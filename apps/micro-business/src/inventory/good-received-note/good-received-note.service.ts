import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
// import { IPaginate } from '@/common/shared-interface/paginate.interface';
import QueryParams from '@/libs/paginate.query';
import {
  IGoodReceivedNoteCreate,
  IGoodReceivedNoteUpdate,
  IGoodReceivedNoteDetailCreate,
  IGoodReceivedNoteDetailUpdate,
} from './interface/good-received-note.interface';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { calcBaseQty, calcBasePrices } from '@/common/common.helper';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { enum_good_received_note_status, enum_good_received_note_type, enum_purchase_order_doc_status } from '@repo/prisma-shared-schema-tenant';
import { InventoryTransactionService, ICreateFromGrnDetailItem } from '@/inventory/inventory-transaction/inventory-transaction.service';
import { format } from 'date-fns';
import * as ExcelJS from 'exceljs';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import {
  NotificationService,
  // NotificationType,
  GoodReceivedNoteDetailResponseSchema,
  GoodReceivedNoteListItemResponseSchema,
  GrnProductListItemSchema,
  GrnLocationListItemSchema,
  Result,
  ErrorCode,
  TryCatch,
} from '@/common';
import {
  renderViaMicroReport,
  formatReportDate,
} from '@/common/print-report.helper';

@Injectable()
export class GoodReceivedNoteService {
  private readonly logger: BackendLogger = new BackendLogger(
    GoodReceivedNoteService.name,
  );
  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
    private readonly notificationService: NotificationService,
    private readonly inventoryTransactionService: InventoryTransactionService,
  ) { }

  /**
   * Find a good received note by ID
   * ค้นหาใบรับสินค้ารายการเดียวตาม ID
   * @param id - GRN ID / ID ใบรับสินค้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns GRN detail with items / รายละเอียดใบรับสินค้าพร้อมรายการ
   */
  @TryCatch
  async findOne(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!goodReceivedNote) {
      return Result.error('Good received note not found', ErrorCode.NOT_FOUND);
    }

    const goodReceivedNoteDetail =
      await prisma.tb_good_received_note_detail.findMany({
        where: {
          good_received_note_id: id,
        },
        orderBy: { sequence_no: 'asc' },
        include: {
          tb_location: { select: { location_type: true } },
          tb_purchase_order_detail: {
            select: {
              tb_purchase_order: { select: { po_no: true } },
            },
          },
        },
      });

    // Fetch detail items for each detail row
    const detailIds = goodReceivedNoteDetail.map((d: any) => d.id);
    const detailItems = detailIds.length > 0
      ? await prisma.tb_good_received_note_detail_item.findMany({
          where: {
            good_received_note_detail_id: { in: detailIds },
            deleted_at: null,
          },
        })
      : [];

    // Group detail items by their parent detail id
    const detailItemsByDetailId = new Map<string, any[]>();
    for (const item of detailItems) {
      const list = detailItemsByDetailId.get(item.good_received_note_detail_id) || [];
      list.push(item);
      detailItemsByDetailId.set(item.good_received_note_detail_id, list);
    }

    const goodReceivedNoteDetailWithItems = goodReceivedNoteDetail.map((detail: any) => {
      const { tb_location, tb_purchase_order_detail, ...rest } = detail;
      return {
        ...rest,
        location_type: tb_location?.location_type || null,
        po_no: tb_purchase_order_detail?.tb_purchase_order?.po_no || null,
        items: detailItemsByDetailId.get(detail.id) || [],
      };
    });

    const extraCost = await prisma.tb_extra_cost.findMany({
      where: {
        good_received_note_id: id,
        deleted_at: null,
      },
    });

    const extraCostDetail = extraCost.length > 0
      ? await prisma.tb_extra_cost_detail.findMany({
          where: {
            extra_cost_id: {
              in: extraCost.map((item: any) => item.id),
            },
            deleted_at: null,
          },
        })
      : [];

    const responseData = {
      ...goodReceivedNote,
      good_received_note_detail: goodReceivedNoteDetailWithItems,
      extra_cost: extraCost,
      extra_cost_detail: extraCostDetail,
    };

    const serializedData = GoodReceivedNoteDetailResponseSchema.parse(responseData);

    return Result.ok(serializedData);
  }

  /**
   * Find all good received notes with pagination
   * ค้นหาใบรับสินค้าทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of GRNs / รายการใบรับสินค้าแบบแบ่งหน้า
   */
  @TryCatch
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate },
      GoodReceivedNoteService.name,
    );
    const defaultSearchFields = ['grn_no', 'description', 'invoice_no', 'vendor_name'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note
      .findMany({
        ...q.findMany(),
        select: {
          id: true,
          grn_no: true,
          grn_date: true,
          doc_type: true,
          doc_status: true,
          invoice_no: true,
          invoice_date: true,
          description: true,
          vendor_name: true,
          currency_id: true,
          currency_code: true,
          exchange_rate: true,
          exchange_rate_date: true,
          net_amount: true,
          base_net_amount: true,
          total_amount: true,
          base_total_amount: true,
          created_at: true,
          is_active: true,
        },
      })
      .then((res) => {
        return res.map((item) => ({
          id: item.id,
          grn_no: item.grn_no,
          grn_date: item.grn_date,
          doc_type: item.doc_type,
          doc_status: item.doc_status,
          invoice_no: item.invoice_no,
          invoice_date: item.invoice_date,
          description: item.description,
          vendor_name: item.vendor_name,
          currency_id: item.currency_id,
          currency_code: item.currency_code,
          exchange_rate: item.exchange_rate !== null && item.exchange_rate !== undefined ? Number(item.exchange_rate) : null,
          exchange_rate_date: item.exchange_rate_date,
          net_amount: Number(item.net_amount ?? 0),
          base_net_amount: Number(item.base_net_amount ?? 0),
          total_amount: Number(item.total_amount ?? 0),
          base_total_amount: Number(item.base_total_amount ?? 0),
          created_at: item.created_at,
          is_active: item.is_active,
        }));
      });

    const total = await prisma.tb_good_received_note.count({
      where: {
        ...q.where(),
      },
    });

    const serializedGoodReceivedNotes = goodReceivedNote.map((item) =>
      GoodReceivedNoteListItemResponseSchema.parse(item)
    );

    return Result.ok({
      data: serializedGoodReceivedNotes,
      paginate: {
        total: total,
        page: q.page,
        perpage: q.perpage,
        pages: total == 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Find all Good Received Notes for a vendor with pagination
   * ค้นหาใบรับสินค้าทั้งหมดของผู้ขายรายหนึ่งพร้อมการแบ่งหน้า
   * @param vendor_id - Vendor ID / รหัสผู้ขาย
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination/filter/sort options / ตัวเลือกการแบ่งหน้า กรอง และเรียงลำดับ
   * @returns Paginated list of GRNs for the vendor (all statuses) / รายการใบรับสินค้าของผู้ขายทุกสถานะแบบแบ่งหน้า
   */
  @TryCatch
  async findByVendorId(
    vendor_id: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findByVendorId', vendor_id, user_id, tenant_id, paginate },
      GoodReceivedNoteService.name,
    );
    return this.findByVendorIdInternal(vendor_id, user_id, tenant_id, paginate);
  }

  /**
   * Find Good Received Notes for a vendor filtered to saved/committed for Credit Note selection
   * ค้นหาใบรับสินค้าของผู้ขายเฉพาะสถานะ saved หรือ committed สำหรับใช้เลือกตอนสร้างใบลดหนี้
   * @param vendor_id - Vendor ID / รหัสผู้ขาย
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination/filter/sort options / ตัวเลือกการแบ่งหน้า กรอง และเรียงลำดับ
   * @returns Paginated list of GRNs with doc_status in (saved, committed) / รายการใบรับสินค้าที่สถานะเป็น saved หรือ committed แบบแบ่งหน้า
   */
  @TryCatch
  async findByVendorIdForCn(
    vendor_id: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findByVendorIdForCn', vendor_id, user_id, tenant_id, paginate },
      GoodReceivedNoteService.name,
    );
    return this.findByVendorIdInternal(vendor_id, user_id, tenant_id, paginate, {
      doc_status: { in: ['saved', 'committed'] },
    });
  }

  /**
   * Shared internal implementation for vendor-scoped GRN list queries with optional where extension
   * การทำงานภายในที่ใช้ร่วมกันสำหรับการค้นหาใบรับสินค้าตามผู้ขาย พร้อมเงื่อนไข where เพิ่มเติมแบบเลือกได้
   * @param vendor_id - Vendor ID / รหัสผู้ขาย
   * @param user_id - User ID / รหัสผู้ใช้
   * @param tenant_id - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination/filter/sort options / ตัวเลือกการแบ่งหน้า กรอง และเรียงลำดับ
   * @param extraWhere - Additional Prisma where predicates merged into the final query / เงื่อนไข where เพิ่มเติมที่รวมเข้ากับ query สุดท้าย
   * @returns Paginated list of GRNs matching the combined filters / รายการใบรับสินค้าตามเงื่อนไขที่รวมกันแบบแบ่งหน้า
   */
  private async findByVendorIdInternal(
    vendor_id: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    extraWhere: Record<string, unknown> = {},
  ): Promise<Result<unknown>> {
    const defaultSearchFields = ['grn_no', 'name'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const where = {
      ...q.where(),
      vendor_id,
      ...extraWhere,
    };

    const goodReceivedNotes = await prisma.tb_good_received_note
      .findMany({
        ...q.findMany(),
        where,
        select: {
          id: true,
          grn_no: true,
          grn_date: true,
          doc_type: true,
          doc_status: true,
          invoice_no: true,
          invoice_date: true,
          description: true,
          vendor_name: true,
          currency_id: true,
          currency_code: true,
          exchange_rate: true,
          exchange_rate_date: true,
          created_at: true,
          is_active: true,
          tb_good_received_note_detail: {
            select: {
              tb_good_received_note_detail_item: {
                select: {
                  net_amount: true,
                  base_net_amount: true,
                  total_price: true,
                  base_total_price: true,
                },
              },
            },
          },
        },
      })
      .then((res) => {
        return res.map((item) => {
          let net_amount = 0;
          let base_net_amount = 0;
          let total_amount = 0;
          let base_total_amount = 0;

          for (const detail of item.tb_good_received_note_detail) {
            for (const detailItem of detail.tb_good_received_note_detail_item) {
              net_amount += Number(detailItem.net_amount ?? 0);
              base_net_amount += Number(detailItem.base_net_amount ?? 0);
              total_amount += Number(detailItem.total_price ?? 0);
              base_total_amount += Number(detailItem.base_total_price ?? 0);
            }
          }

          return {
            id: item.id,
            grn_no: item.grn_no,
            grn_date: item.grn_date,
            doc_type: item.doc_type,
            doc_status: item.doc_status,
            invoice_no: item.invoice_no,
            invoice_date: item.invoice_date,
            description: item.description,
            vendor_name: item.vendor_name,
            currency_id: item.currency_id,
            currency_code: item.currency_code,
            exchange_rate: item.exchange_rate !== null && item.exchange_rate !== undefined ? Number(item.exchange_rate) : null,
            exchange_rate_date: item.exchange_rate_date,
            net_amount,
            base_net_amount,
            total_amount,
            base_total_amount,
            created_at: item.created_at,
            is_active: item.is_active,
          };
        });
      });

    const total = await prisma.tb_good_received_note.count({ where });

    const serialized = goodReceivedNotes.map((item) =>
      GoodReceivedNoteListItemResponseSchema.parse(item)
    );

    return Result.ok({
      data: serialized,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
  // ==================== Shared Validation & Enrichment ====================

  /**
   * Validate and enrich GRN header fields (vendor, currency, credit term).
   * Mutates data in place. Returns error string if validation fails, null if OK.
   */
  private async validateAndEnrichHeader(
    prisma: any,
    data: { vendor_id?: string; vendor_name?: string; currency_id?: string; currency_code?: string; credit_term_id?: string; credit_term_name?: string; credit_term_days?: number },
  ): Promise<string | null> {
    if (data.vendor_id) {
      const vendor = await prisma.tb_vendor.findFirst({ where: { id: data.vendor_id } });
      if (!vendor) return `Vendor not found: ${data.vendor_id}`;
      data.vendor_name = vendor.name;
    }

    if (data.currency_id) {
      const currency = await prisma.tb_currency.findFirst({ where: { id: data.currency_id } });
      if (!currency) return `Currency not found: ${data.currency_id}`;
      data.currency_code = currency.code;
    }

    if (data.credit_term_id) {
      const creditTerm = await prisma.tb_credit_term.findFirst({ where: { id: data.credit_term_id } });
      if (!creditTerm) return `Credit term not found: ${data.credit_term_id}`;
      data.credit_term_name = creditTerm.name;
      data.credit_term_days = Number(creditTerm.value);
    }

    return null;
  }

  /**
   * Validate and enrich GRN detail items (product, location, units, tax, delivery point).
   * Mutates items in place. Returns error string if validation fails, null if OK.
   */
  private async validateAndEnrichDetailItems(
    prisma: any,
    items: any[],
  ): Promise<string | null> {
    const errors: string[] = [];

    // Collect all unique IDs for batch validation
    const poDetailIds = items.map((i) => i.purchase_order_detail_id).filter(Boolean);
    const locationIds = items.map((i) => i.location_id).filter(Boolean);
    const productIds = items.map((i) => i.product_id).filter(Boolean);
    const unitIds = [
      ...items.map((i) => i.order_unit_id),
      ...items.map((i) => i.received_unit_id),
      ...items.map((i) => i.foc_unit_id),
    ].filter(Boolean);
    const taxProfileIds = items.map((i) => i.tax_profile_id).filter(Boolean);
    const deliveryPointIds = items.map((i) => i.delivery_point_id).filter(Boolean);

    // Batch fetch all foreign records
    const [poDetails, locations, products, units, taxProfiles, deliveryPoints] = await Promise.all([
      poDetailIds.length > 0 ? prisma.tb_purchase_order_detail.findMany({ where: { id: { in: poDetailIds } }, select: { id: true } }) : [],
      locationIds.length > 0 ? prisma.tb_location.findMany({ where: { id: { in: locationIds } }, select: { id: true, name: true, code: true } }) : [],
      productIds.length > 0 ? prisma.tb_product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, code: true, local_name: true } }) : [],
      unitIds.length > 0 ? prisma.tb_unit.findMany({ where: { id: { in: [...new Set(unitIds)] } }, select: { id: true, name: true } }) : [],
      taxProfileIds.length > 0 ? prisma.tb_tax_profile.findMany({ where: { id: { in: taxProfileIds }, deleted_at: null }, select: { id: true } }) : [],
      deliveryPointIds.length > 0 ? prisma.tb_delivery_point.findMany({ where: { id: { in: deliveryPointIds } }, select: { id: true, name: true } }) : [],
    ]);

    const poDetailMap = new Map<string, any>(poDetails.map((r: any) => [r.id, r]));
    const locationMap = new Map<string, any>(locations.map((r: any) => [r.id, r]));
    const productMap = new Map<string, any>(products.map((r: any) => [r.id, r]));
    const unitMap = new Map<string, any>(units.map((r: any) => [r.id, r]));
    const taxProfileMap = new Map<string, any>(taxProfiles.map((r: any) => [r.id, r]));
    const deliveryPointMap = new Map<string, any>(deliveryPoints.map((r: any) => [r.id, r]));

    for (const item of items) {
      if (item.purchase_order_detail_id && !poDetailMap.has(item.purchase_order_detail_id)) {
        errors.push(`Purchase order detail not found: ${item.purchase_order_detail_id}`);
      }

      if (item.location_id) {
        const loc = locationMap.get(item.location_id);
        if (!loc) { errors.push(`Location not found: ${item.location_id}`); }
        else { item.location_name = loc.name; item.location_code = loc.code; }
      }

      if (item.product_id) {
        const prod = productMap.get(item.product_id);
        if (!prod) { errors.push(`Product not found: ${item.product_id}`); }
        else {
          item.product_name = prod.name;
          item.product_code = prod.code;
          item.product_sku = prod.code;
          item.product_local_name = prod.local_name;
        }
      }

      if (item.order_unit_id) {
        const u = unitMap.get(item.order_unit_id);
        if (!u) { errors.push(`Order unit not found: ${item.order_unit_id}`); }
        else { item.order_unit_name = u.name; }
      }

      if (item.received_unit_id) {
        const u = unitMap.get(item.received_unit_id);
        if (!u) { errors.push(`Received unit not found: ${item.received_unit_id}`); }
        else { item.received_unit_name = u.name; }
      }

      if (item.foc_unit_id) {
        const u = unitMap.get(item.foc_unit_id);
        if (!u) { errors.push(`FOC unit not found: ${item.foc_unit_id}`); }
        else { item.foc_unit_name = u.name; }
      }

      if (item.tax_profile_id && !taxProfileMap.has(item.tax_profile_id)) {
        errors.push(`Tax profile not found: ${item.tax_profile_id}`);
      }

      if (item.delivery_point_id) {
        const dp = deliveryPointMap.get(item.delivery_point_id);
        if (!dp) { errors.push(`Delivery point not found: ${item.delivery_point_id}`); }
        else { item.delivery_point_name = dp.name; }
      }
    }

    return errors.length > 0 ? errors.join('; ') : null;
  }

  /**
   * Validate and enrich extra cost detail items.
   * Returns error string if validation fails, null if OK.
   */
  private async validateAndEnrichExtraCost(
    prisma: any,
    items: any[],
  ): Promise<string | null> {
    const ids = items.map((i) => i.extra_cost_type_id).filter(Boolean);
    if (ids.length === 0) return null;

    const types = await prisma.tb_extra_cost_type.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    const typeMap = new Map<string, any>(types.map((t: any) => [t.id, t]));

    const notFound: string[] = [];
    for (const item of items) {
      const t = typeMap.get(item.extra_cost_type_id);
      if (!t) { notFound.push(item.extra_cost_type_id); }
      else { item.extra_cost_type_name = t.name; }
    }

    return notFound.length > 0 ? `Extra cost type not found: ${notFound.join(', ')}` : null;
  }

  // ==================== Create ====================

  /**
   * Create a new good received note with details
   * สร้างใบรับสินค้าใหม่พร้อมรายการรายละเอียด
   * @param data - GRN creation data / ข้อมูลสร้างใบรับสินค้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created GRN / ใบรับสินค้าที่สร้างแล้ว
   */
  @TryCatch
  async create(
    data: IGoodReceivedNoteCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    // Validate & enrich header
    const headerError = await this.validateAndEnrichHeader(prisma, data);
    if (headerError) return Result.error(headerError, ErrorCode.NOT_FOUND);

    // Validate & enrich detail items
    if (data.good_received_note_detail?.add) {
      const detailError = await this.validateAndEnrichDetailItems(prisma, data.good_received_note_detail.add);
      if (detailError) return Result.error(detailError, ErrorCode.NOT_FOUND);
    }

    // Validate & enrich extra cost
    if (data.extra_cost?.extra_cost_detail?.add) {
      const extraCostError = await this.validateAndEnrichExtraCost(prisma, data.extra_cost.extra_cost_detail.add);
      if (extraCostError) return Result.error(extraCostError, ErrorCode.NOT_FOUND);
    }

    const tx = await prisma.$transaction(async (prisma) => {
      // Pick only fields that exist on tb_good_received_note
      const goodReceivedNoteObject: any = { ...data };
      delete goodReceivedNoteObject.good_received_note_detail;
      delete goodReceivedNoteObject.extra_cost;
      delete goodReceivedNoteObject.expired_date;
      delete goodReceivedNoteObject.discount_rate;
      delete goodReceivedNoteObject.discount_amount;
      delete goodReceivedNoteObject.is_discount_adjustment;
      delete goodReceivedNoteObject.base_discount_amount;

      // Convert Date objects to ISO strings for Prisma Timestamptz fields
      if (goodReceivedNoteObject.invoice_date instanceof Date) goodReceivedNoteObject.invoice_date = goodReceivedNoteObject.invoice_date.toISOString();
      if (goodReceivedNoteObject.received_at instanceof Date) goodReceivedNoteObject.received_at = goodReceivedNoteObject.received_at.toISOString();
      if (goodReceivedNoteObject.payment_due_date instanceof Date) goodReceivedNoteObject.payment_due_date = goodReceivedNoteObject.payment_due_date.toISOString();
      if (goodReceivedNoteObject.grn_date instanceof Date) goodReceivedNoteObject.grn_date = goodReceivedNoteObject.grn_date.toISOString();
      if (goodReceivedNoteObject.exchange_rate_date instanceof Date) goodReceivedNoteObject.exchange_rate_date = goodReceivedNoteObject.exchange_rate_date.toISOString();

      const createGoodReceivedNote = await prisma.tb_good_received_note.create({
        data: {
          ...goodReceivedNoteObject,
          created_by_id: user_id,
          grn_no: await this.generateGRNNo(
            data.received_at,
            tenant_id,
            user_id,
          ),
          doc_version: 0,
          doc_status: enum_good_received_note_status.draft,
        },
      });

      if (data.good_received_note_detail?.add?.length > 0) {
        const isPurchaseOrder = data.doc_type === enum_good_received_note_type.purchase_order;

        if (isPurchaseOrder) {
          // PO create: group by product+location, N items per detail
          // Each item maps 1:1 to a junction row (tb_purchase_order_detail_tb_purchase_request_detail)
          // Fetch junction IDs from purchase_order_detail_id

          const poDetailIds = data.good_received_note_detail.add
            .map((item) => item.purchase_order_detail_id)
            .filter(Boolean) as string[];

          // Build map: "po_detail_id::location_id" → junction.id
          const junctionMap = new Map<string, string>();
          if (poDetailIds.length > 0) {
            const junctions = await prisma.tb_purchase_order_detail_tb_purchase_request_detail.findMany({
              where: { po_detail_id: { in: poDetailIds }, deleted_at: null },
              select: { id: true, po_detail_id: true, location_id: true },
            });
            for (const j of junctions) {
              junctionMap.set(`${j.po_detail_id}::${j.location_id}`, j.id);
            }
          }

          // Group input items by product_id + location_id
          const groupedMap = new Map<string, any[]>();
          for (const item of data.good_received_note_detail.add) {
            const key = `${item.product_id}::${item.location_id}`;
            const group = groupedMap.get(key) || [];
            group.push(item);
            groupedMap.set(key, group);
          }

          let sequenceNo = 1;
          for (const [, groupItems] of groupedMap) {
            const firstItem = groupItems[0];

            const detail = await prisma.tb_good_received_note_detail.create({
              data: {
                good_received_note_id: createGoodReceivedNote.id,
                sequence_no: sequenceNo++,
                purchase_order_detail_id: groupItems.length === 1 ? (firstItem.purchase_order_detail_id || null) : null,
                location_id: firstItem.location_id,
                location_code: (firstItem as any).location_code || null,
                location_name: (firstItem as any).location_name || null,
                product_id: firstItem.product_id,
                product_code: firstItem.product_code || null,
                product_name: firstItem.product_name || null,
                product_local_name: firstItem.product_local_name || null,
                product_sku: firstItem.product_sku || null,
              },
            });

            // Create N detail items (1 per junction row)
            for (const item of groupItems) {
              const junctionKey = `${item.purchase_order_detail_id}::${item.location_id}`;
              await prisma.tb_good_received_note_detail_item.create({
                data: {
                  good_received_note_detail_id: detail.id,
                  purchase_order_detail_purchase_request_detail_id: junctionMap.get(junctionKey) || null,
                  order_qty: (item as any).order_qty || 0,
                  order_unit_id: (item as any).order_unit_id || null,
                  order_unit_name: (item as any).order_unit_name || null,
                  order_unit_conversion_factor: (item as any).order_unit_conversion_factor || 0,
                  order_base_qty: calcBaseQty((item as any).order_qty, (item as any).order_unit_conversion_factor),
                  received_qty: (item as any).received_qty || 0,
                  received_unit_id: (item as any).received_unit_id || null,
                  received_unit_name: (item as any).received_unit_name || null,
                  received_unit_conversion_factor: (item as any).received_unit_conversion_factor || 0,
                  received_base_qty: calcBaseQty((item as any).received_qty, (item as any).received_unit_conversion_factor),
                  foc_qty: (item as any).foc_qty || 0,
                  foc_unit_id: (item as any).foc_unit_id || null,
                  foc_unit_name: (item as any).foc_unit_name || null,
                  foc_unit_conversion_factor: (item as any).foc_unit_conversion_factor || 0,
                  foc_base_qty: calcBaseQty((item as any).foc_qty, (item as any).foc_unit_conversion_factor),
                  tax_profile_id: item.tax_profile_id || null,
                  tax_profile_name: item.tax_profile_name || null,
                  tax_rate: item.tax_rate || 0,
                  tax_amount: item.tax_amount || 0,
                  base_tax_amount: (item as any).base_tax_amount || 0,
                  is_tax_adjustment: false,
                  discount_rate: (item as any).discount_rate || 0,
                  discount_amount: (item as any).discount_amount || 0,
                  base_discount_amount: (item as any).base_discount_amount || 0,
                  is_discount_adjustment: (item as any).is_discount_adjustment || false,
                  sub_total_price: (item as any).sub_total_price || 0,
                  net_amount: (item as any).net_amount || 0,
                  total_price: (item as any).total_price || 0,
                  ...calcBasePrices(item as any, (data as any).exchange_rate),
                  note: (item as any).note || null,
                  created_by_id: user_id,
                },
              });
            }
          }
        } else {
          // Manual create: 1:1 (1 grn_detail = 1 grn_detail_item)
          for (let i = 0; i < data.good_received_note_detail.add.length; i++) {
            const item = data.good_received_note_detail.add[i];

            const detail = await prisma.tb_good_received_note_detail.create({
              data: {
                good_received_note_id: createGoodReceivedNote.id,
                sequence_no: i + 1,
                location_id: item.location_id,
                location_code: (item as any).location_code || null,
                location_name: (item as any).location_name || null,
                product_id: item.product_id,
                product_code: item.product_code || null,
                product_name: item.product_name || null,
                product_local_name: item.product_local_name || null,
                product_sku: item.product_sku || null,
              },
            });

            await prisma.tb_good_received_note_detail_item.create({
              data: {
                good_received_note_detail_id: detail.id,
                purchase_order_detail_purchase_request_detail_id: null,
                received_qty: (item as any).received_qty || 0,
                received_unit_id: (item as any).received_unit_id || null,
                received_unit_name: (item as any).received_unit_name || null,
                received_unit_conversion_factor: (item as any).received_unit_conversion_factor || 0,
                received_base_qty: calcBaseQty((item as any).received_qty, (item as any).received_unit_conversion_factor),
                foc_qty: (item as any).foc_qty || 0,
                foc_unit_id: (item as any).foc_unit_id || null,
                foc_unit_name: (item as any).foc_unit_name || null,
                foc_unit_conversion_factor: (item as any).foc_unit_conversion_factor || 0,
                foc_base_qty: calcBaseQty((item as any).foc_qty, (item as any).foc_unit_conversion_factor),
                tax_profile_id: item.tax_profile_id || null,
                tax_profile_name: item.tax_profile_name || null,
                tax_rate: item.tax_rate || 0,
                tax_amount: item.tax_amount || 0,
                base_tax_amount: (item as any).base_tax_amount || 0,
                is_tax_adjustment: false,
                discount_rate: (item as any).discount_rate || 0,
                discount_amount: (item as any).discount_amount || 0,
                base_discount_amount: (item as any).base_discount_amount || 0,
                is_discount_adjustment: (item as any).is_discount_adjustment || false,
                sub_total_price: (item as any).sub_total_price || 0,
                net_amount: (item as any).net_amount || 0,
                total_price: (item as any).total_price || 0,
                ...calcBasePrices(item as any, (data as any).exchange_rate),
                note: (item as any).note || null,
                created_by_id: user_id,
              },
            });
          }
        }
      }

      if (data.extra_cost) {
        const createExtraCost = await prisma.tb_extra_cost.create({
          data: {
            good_received_note_id: createGoodReceivedNote.id,
            created_by_id: user_id,
            name: data.extra_cost.name,
            allocate_extra_cost_type: data.extra_cost.allocate_extracost_type,
            note: data.extra_cost.note,
            info: data.extra_cost.info ?? {},
          },
        });

        if (data.extra_cost.extra_cost_detail?.add?.length > 0) {
          const extraCostDetailObj = data.extra_cost.extra_cost_detail.add.map(
            (item) => ({
              extra_cost_id: createExtraCost.id,
              extra_cost_type_id: item.extra_cost_type_id,
              name: (item as any).extra_cost_type_name,
              amount: item.amount,
              tax_profile_id: item.tax_profile_id,
              tax_profile_name: item.tax_profile_name,
              tax_rate: item.tax_rate,
              tax_amount: item.tax_amount,
              note: item.note,
              info: item.info ?? {},
              dimension: item.dimension ?? [],
            }),
          );

          await prisma.tb_extra_cost_detail.createMany({
            data: extraCostDetailObj,
          });
        }
      }

      await this.recalculateGrnTotals(prisma, createGoodReceivedNote.id);

      return { id: createGoodReceivedNote.id, grn_no: createGoodReceivedNote.grn_no };
    });

    // Send notification for GRN creation
    this.sendGRNCreatedNotification(tx, data, user_id);

    return Result.ok(tx);
  }

  /**
   * Update a good received note with details
   * แก้ไขใบรับสินค้าพร้อมรายการรายละเอียด
   * @param data - GRN update data / ข้อมูลแก้ไขใบรับสินค้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated GRN / ใบรับสินค้าที่แก้ไขแล้ว
   */
  @TryCatch
  async update(
    data: IGoodReceivedNoteUpdate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id },
      'update',
    );
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note.findFirst({
      where: {
        id: data.id,
      },
    });

    if (!goodReceivedNote) {
      return Result.error('Good received note not found', ErrorCode.NOT_FOUND);
    }

    // Validate & enrich header
    const headerError = await this.validateAndEnrichHeader(prisma, data as any);
    if (headerError) return Result.error(headerError, ErrorCode.NOT_FOUND);

    if (data.good_received_note_detail) {
      // Validate & enrich add items
      if (data.good_received_note_detail?.add) {
        const addError = await this.validateAndEnrichDetailItems(prisma, data.good_received_note_detail.add as any[]);
        if (addError) return Result.error(addError, ErrorCode.NOT_FOUND);
      }

      // Validate & enrich update items (reuses same validation)
      if (data.good_received_note_detail?.update) {
        // Check that detail IDs exist
        const detailNotFound: string[] = [];
        await Promise.all(
          data.good_received_note_detail.update.map(async (item) => {
            const found = await prisma.tb_good_received_note_detail.findFirst({ where: { id: item.id } });
            if (!found) detailNotFound.push(item.id);
          }),
        );
        if (detailNotFound.length > 0) {
          return Result.error(`Good received note detail not found: ${detailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }

        const updateError = await this.validateAndEnrichDetailItems(prisma, data.good_received_note_detail.update as any[]);
        if (updateError) return Result.error(updateError, ErrorCode.NOT_FOUND);
      }

      if (data.good_received_note_detail?.remove) {
        const goodReceivedNoteDetailNotFound: string[] = [];

        await Promise.all(
          data.good_received_note_detail.remove.map(async (item) => {
            const findGoodReceivedNoteDetail =
              await prisma.tb_good_received_note_detail.findFirst({
                where: { id: item.id },
              });

            if (!findGoodReceivedNoteDetail) {
              goodReceivedNoteDetailNotFound.push(item.id);
            }
          }),
        );

        if (goodReceivedNoteDetailNotFound.length > 0) {
          return Result.error(`Good received note detail not found: ${goodReceivedNoteDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
        }
      }
    }

    if (data.extra_cost) {
      if (data.extra_cost.id) {
        const extraCost = await prisma.tb_extra_cost.findFirst({
          where: { id: data.extra_cost.id },
        });

        if (!extraCost) {
          return Result.error('Extra cost not found', ErrorCode.NOT_FOUND);
        }
      }

      if (data.extra_cost.extra_cost_detail) {
        if (data.extra_cost.extra_cost_detail?.add) {
          const extraCostTypeNotFound: string[] = [];
          const taxProfileNotFound: string[] = [];

          await Promise.all(
            data.extra_cost.extra_cost_detail.add.map(async (item) => {
              const findExtraCostType =
                await prisma.tb_extra_cost_type.findFirst({
                  where: {
                    id: item.extra_cost_type_id,
                  },
                });

              if (!findExtraCostType) {
                extraCostTypeNotFound.push(item.extra_cost_type_id);
              } else {
                item.extra_cost_type_name = findExtraCostType.name;
              }

              if (item.tax_profile_id) {
                const findTaxProfile =
                  await prisma.tb_tax_profile.findFirst({
                    where: {
                      id: item.tax_profile_id,
                      deleted_at: null,
                    },
                  });

                if (!findTaxProfile) {
                  taxProfileNotFound.push(item.tax_profile_name);
                }
              }
            }),
          );

          if (extraCostTypeNotFound.length > 0) {
            return Result.error(`Extra cost type not found: ${extraCostTypeNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }

          if (taxProfileNotFound.length > 0) {
            return Result.error(`Tax profile not found: ${taxProfileNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }
        }

        if (data.extra_cost.extra_cost_detail?.update) {
          const extraCostDetailNotFound: string[] = [];
          const extraCostTypeNotFound: string[] = [];
          const taxProfileNotFound: string[] = [];

          await Promise.all(
            data.extra_cost.extra_cost_detail.update.map(async (item) => {
              const findExtraCostDetail =
                await prisma.tb_extra_cost_detail.findFirst({
                  where: { id: item.id },
                });

              if (!findExtraCostDetail) {
                extraCostDetailNotFound.push(item.id);
              }

              if (item.extra_cost_type_id) {
                const findExtraCostType =
                  await prisma.tb_extra_cost_type.findFirst({
                    where: { id: item.extra_cost_type_id },
                  });

                if (!findExtraCostType) {
                  extraCostTypeNotFound.push(item.extra_cost_type_id);
                } else {
                  item.extra_cost_type_name = findExtraCostType.name;
                }
              }

              if (item.tax_profile_id) {
                const findTaxProfile =
                  await prisma.tb_tax_profile.findFirst({
                    where: {
                      id: item.tax_profile_id,
                      deleted_at: null,
                    },
                  });

                if (!findTaxProfile) {
                  taxProfileNotFound.push(item.tax_profile_name);
                }
              }
            }),
          );

          if (extraCostDetailNotFound.length > 0) {
            return Result.error(`Extra cost detail not found: ${extraCostDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }

          if (extraCostTypeNotFound.length > 0) {
            return Result.error(`Extra cost type not found: ${extraCostTypeNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }

          if (taxProfileNotFound.length > 0) {
            return Result.error(`Tax profile not found: ${taxProfileNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }
        }

        if (data.extra_cost.extra_cost_detail?.remove) {
          const extraCostDetailNotFound: string[] = [];

          await Promise.all(
            data.extra_cost.extra_cost_detail.remove.map(async (item) => {
              const findExtraCostDetail =
                await prisma.tb_extra_cost_detail.findFirst({
                  where: { id: item.id },
                });

              if (!findExtraCostDetail) {
                extraCostDetailNotFound.push(item.id);
              }
            }),
          );

          if (extraCostDetailNotFound.length > 0) {
            return Result.error(`Extra cost detail not found: ${extraCostDetailNotFound.join(', ')}`, ErrorCode.NOT_FOUND);
          }
        }
      }
    }

    const tx = await prisma.$transaction(async (prisma) => {
      const goodReceivedNoteObject: IGoodReceivedNoteUpdate = { ...data };
      delete goodReceivedNoteObject.good_received_note_detail;
      delete goodReceivedNoteObject.extra_cost;

      if (Object.keys(goodReceivedNoteObject).length > 0) {
        await prisma.tb_good_received_note.update({
          where: { id: data.id },
          data: {
            ...goodReceivedNoteObject,
            updated_by_id: user_id,
            updated_at: new Date().toISOString(),
          },
        });
      }

      if (data.good_received_note_detail) {
        // ADD new details + detail items
        if (data.good_received_note_detail.add?.length > 0) {
          const maxSeq = await prisma.tb_good_received_note_detail.aggregate({
            where: { good_received_note_id: data.id },
            _max: { sequence_no: true },
          });
          let seqNo = (maxSeq._max.sequence_no || 0) + 1;

          for (const item of data.good_received_note_detail.add) {
            const detail = await prisma.tb_good_received_note_detail.create({
              data: {
                good_received_note_id: data.id,
                sequence_no: seqNo++,
                purchase_order_detail_id: (item as any).purchase_order_detail_id || null,
                location_id: (item as any).location_id,
                location_code: (item as any).location_code || null,
                location_name: (item as any).location_name || null,
                product_id: (item as any).product_id,
                product_code: (item as any).product_code || null,
                product_name: (item as any).product_name || null,
                product_local_name: (item as any).product_local_name || null,
                product_sku: (item as any).product_sku || null,
              },
            });

            await prisma.tb_good_received_note_detail_item.create({
              data: {
                good_received_note_detail_id: detail.id,
                received_qty: (item as any).received_qty || 0,
                received_unit_id: (item as any).received_unit_id || null,
                received_unit_name: (item as any).received_unit_name || null,
                received_unit_conversion_factor: (item as any).received_unit_conversion_factor || 0,
                received_base_qty: calcBaseQty((item as any).received_qty, (item as any).received_unit_conversion_factor),
                foc_qty: (item as any).foc_qty || 0,
                foc_unit_id: (item as any).foc_unit_id || null,
                foc_unit_name: (item as any).foc_unit_name || null,
                foc_unit_conversion_factor: (item as any).foc_unit_conversion_factor || 0,
                foc_base_qty: calcBaseQty((item as any).foc_qty, (item as any).foc_unit_conversion_factor),
                tax_profile_id: (item as any).tax_profile_id || null,
                tax_profile_name: (item as any).tax_profile_name || null,
                tax_rate: (item as any).tax_rate || 0,
                tax_amount: (item as any).tax_amount || 0,
                base_tax_amount: (item as any).base_tax_amount || 0,
                discount_rate: (item as any).discount_rate || 0,
                discount_amount: (item as any).discount_amount || 0,
                base_discount_amount: (item as any).base_discount_amount || 0,
                is_discount_adjustment: (item as any).is_discount_adjustment || false,
                sub_total_price: (item as any).sub_total_price || 0,
                net_amount: (item as any).net_amount || 0,
                total_price: (item as any).total_price || 0,
                ...calcBasePrices(item as any, (data as any).exchange_rate),
                note: (item as any).note || null,
                created_by_id: user_id,
              },
            });
          }
        }

        // UPDATE existing details + detail items
        if (data.good_received_note_detail.update?.length > 0) {
          for (const item of data.good_received_note_detail.update) {
            const { id: detailId, ...updateFields } = item as any;

            // Update detail header (product, location)
            const detailUpdate: Record<string, unknown> = { updated_by_id: user_id, updated_at: new Date().toISOString() };
            if (updateFields.location_id) detailUpdate.location_id = updateFields.location_id;
            if (updateFields.location_code !== undefined) detailUpdate.location_code = updateFields.location_code;
            if (updateFields.location_name !== undefined) detailUpdate.location_name = updateFields.location_name;
            if (updateFields.product_id) detailUpdate.product_id = updateFields.product_id;
            if (updateFields.product_code !== undefined) detailUpdate.product_code = updateFields.product_code;
            if (updateFields.product_name !== undefined) detailUpdate.product_name = updateFields.product_name;
            if (updateFields.product_local_name !== undefined) detailUpdate.product_local_name = updateFields.product_local_name;
            if (updateFields.product_sku !== undefined) detailUpdate.product_sku = updateFields.product_sku;

            await prisma.tb_good_received_note_detail.update({
              where: { id: detailId },
              data: detailUpdate,
            });

            // Update or create detail item (qty, cost, tax, discount)
            const existingItem = await prisma.tb_good_received_note_detail_item.findFirst({
              where: { good_received_note_detail_id: detailId, deleted_at: null },
            });

            const itemData: Record<string, unknown> = {};
            const itemFields = [
              'received_qty', 'received_unit_id', 'received_unit_name', 'received_unit_conversion_factor', 'received_base_qty',
              'foc_qty', 'foc_unit_id', 'foc_unit_name', 'foc_unit_conversion_factor', 'foc_base_qty',
              'tax_profile_id', 'tax_profile_name', 'tax_rate', 'tax_amount', 'base_tax_amount',
              'discount_rate', 'discount_amount', 'base_discount_amount', 'is_discount_adjustment',
              'sub_total_price', 'net_amount', 'total_price', 'base_price',
              'base_sub_total_price', 'base_net_amount', 'base_total_price', 'note',
            ];
            for (const field of itemFields) {
              if (updateFields[field] !== undefined) itemData[field] = updateFields[field];
            }

            if (Object.keys(itemData).length > 0) {
              const merged = { ...(existingItem || {}), ...itemData } as Record<string, unknown>;
              itemData.received_base_qty = calcBaseQty(merged.received_qty, merged.received_unit_conversion_factor);
              itemData.foc_base_qty = calcBaseQty(merged.foc_qty, merged.foc_unit_conversion_factor);
              Object.assign(itemData, calcBasePrices(merged, (data as any).exchange_rate));

              if (existingItem) {
                await prisma.tb_good_received_note_detail_item.update({
                  where: { id: existingItem.id },
                  data: { ...itemData, updated_by_id: user_id, updated_at: new Date().toISOString() },
                });
              } else {
                await prisma.tb_good_received_note_detail_item.create({
                  data: {
                    good_received_note_detail_id: detailId,
                    ...itemData,
                    created_by_id: user_id,
                  },
                });
              }
            }
          }
        }

        // REMOVE details + their items
        if (data.good_received_note_detail.remove?.length > 0) {
          const removeIds = data.good_received_note_detail.remove.map((item) => item.id);

          // Delete detail items first (FK constraint)
          await prisma.tb_good_received_note_detail_item.deleteMany({
            where: { good_received_note_detail_id: { in: removeIds } },
          });

          await prisma.tb_good_received_note_detail.deleteMany({
            where: { id: { in: removeIds } },
          });
        }
      }

      if (data.extra_cost) {
        if (data.extra_cost.id) {
          const extraCostObject = { ...data.extra_cost };
          delete extraCostObject.extra_cost_detail;

          await prisma.tb_extra_cost.update({
            where: { id: data.extra_cost.id },
            data: {
              ...extraCostObject,
              updated_by_id: user_id,
              updated_at: new Date().toISOString(),
            },
          });
        } else {
          const extraCostObject = { ...data.extra_cost };
          delete extraCostObject.extra_cost_detail;

          await prisma.tb_extra_cost.create({
            data: {
              ...extraCostObject,
              good_received_note_id: data.id,
              created_by_id: user_id,
            },
          });
        }

        if (data.extra_cost.extra_cost_detail?.add?.length > 0) {
          const extraCostDetailObj = await Promise.all(
            data.extra_cost.extra_cost_detail.add.map(async (item) => {
              return {
                extra_cost_id: data.extra_cost.id,
                created_by_id: user_id,
                ...item,
              };
            }),
          );

          await prisma.tb_extra_cost_detail.createMany({
            data: extraCostDetailObj,
          });
        }

        if (data.extra_cost.extra_cost_detail?.update?.length > 0) {
          await Promise.all(
            data.extra_cost.extra_cost_detail.update.map(async (item) => {
              await prisma.tb_extra_cost_detail.update({
                where: { id: item.id },
                data: {
                  ...item,
                  updated_by_id: user_id,
                  updated_at: new Date().toISOString(),
                },
              });
            }),
          );
        }
        if (data.extra_cost.extra_cost_detail?.remove?.length > 0) {
          const extraCostDetailId =
            data.extra_cost.extra_cost_detail.remove.map((item) => item.id);

          await prisma.tb_extra_cost_detail.deleteMany({
            where: { id: { in: extraCostDetailId } },
          });
        }
      }

      await this.recalculateGrnTotals(prisma, data.id);

      return { id: data.id };
    });

    return Result.ok(tx);
  }

  /**
   * Soft delete a good received note
   * ลบใบรับสินค้าแบบซอฟต์ดีลีท
   * @param id - GRN ID / ID ใบรับสินค้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted GRN ID / ID ใบรับสินค้าที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'delete', id, user_id, tenant_id }, 'delete');
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note.findFirst({
      where: {
        id: id,
        deleted_at: null,
      },
    });

    if (!goodReceivedNote) {
      return Result.error('Good received note not found', ErrorCode.NOT_FOUND);
    }

    if (goodReceivedNote.doc_status !== enum_good_received_note_status.draft) {
      return Result.error(
        'Only draft good received notes can be deleted',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    const now = new Date().toISOString();

    const detailIds = await prisma.tb_good_received_note_detail
      .findMany({
        where: { good_received_note_id: id },
        select: { id: true },
      })
      .then((res) => res.map((item) => item.id));

    if (detailIds.length > 0) {
      await prisma.tb_good_received_note_detail_item.updateMany({
        where: { good_received_note_detail_id: { in: detailIds }, deleted_at: null },
        data: { deleted_at: now, deleted_by_id: user_id },
      });

      await prisma.tb_good_received_note_detail_comment.updateMany({
        where: { good_received_note_detail_id: { in: detailIds }, deleted_at: null },
        data: { deleted_at: now, deleted_by_id: user_id },
      });

      // tb_good_received_note_detail has no deleted_at column — hard delete
      await prisma.tb_good_received_note_detail.deleteMany({
        where: { good_received_note_id: id },
      });
    }

    await prisma.tb_good_received_note_comment.updateMany({
      where: { good_received_note_id: id, deleted_at: null },
      data: { deleted_at: now, deleted_by_id: user_id },
    });

    const extraCostIds = await prisma.tb_extra_cost
      .findMany({
        where: { good_received_note_id: id, deleted_at: null },
        select: { id: true },
      })
      .then((res) => res.map((item) => item.id));

    if (extraCostIds.length > 0) {
      await prisma.tb_extra_cost_detail.updateMany({
        where: { extra_cost_id: { in: extraCostIds }, deleted_at: null },
        data: { deleted_at: now, deleted_by_id: user_id },
      });

      await prisma.tb_extra_cost.updateMany({
        where: { good_received_note_id: id, deleted_at: null },
        data: { deleted_at: now, deleted_by_id: user_id },
      });
    }

    await this.recalculateGrnTotals(prisma, id);

    await prisma.tb_good_received_note.update({
      where: { id: id },
      data: { deleted_at: now, deleted_by_id: user_id },
    });

    return Result.ok({ id });
  }

  /**
   * Void a good received note by ID
   * ยกเลิกใบรับสินค้าตาม ID
   */
  @TryCatch
  async voidGrnById(id: string, user_id: string, tenant_id: string): Promise<Result<unknown>> {
    this.logger.debug({ function: 'voidGrnById', id, user_id, tenant_id }, GoodReceivedNoteService.name);

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) return Result.error('Tenant not found', ErrorCode.NOT_FOUND);

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const grn = await prisma.tb_good_received_note.findFirst({ where: { id, deleted_at: null } });
    if (!grn) return Result.error('Good received note not found', ErrorCode.NOT_FOUND);
    if (grn.doc_status === enum_good_received_note_status.voided) {
      return Result.error('Good received note is already voided', ErrorCode.INVALID_ARGUMENT);
    }

    await this.voidGrn(prisma, id, '', grn.note, user_id);
    return Result.ok({ id });
  }

  /**
   * Find the latest GRN by document number pattern
   * ค้นหาใบรับสินค้าล่าสุดตามรูปแบบเลขที่เอกสาร
   * @param pattern - Document number pattern / รูปแบบเลขที่เอกสาร
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param user_id - User ID / ID ผู้ใช้
   * @returns Latest GRN matching the pattern / ใบรับสินค้าล่าสุดที่ตรงกับรูปแบบ
   */
  async findLatestPrByPattern(
    pattern: string,
    tenant_id: string,
    user_id: string,
  ): Promise<any> {
    this.logger.debug(
      { function: 'findLatestPrByPattern', pattern, tenant_id, user_id },
      'findLatestPrByPattern',
    );
    const tenant = await this.tenantService.getdb_connection(
      user_id,
      tenant_id,
    );

    if (!tenant) {
      throw new Error('tenant not found');
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const goodReceivedNote = await prisma.tb_good_received_note.findFirst({
      where: {
        grn_no: {
          contains: pattern,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return goodReceivedNote;
  }

  private async generateGRNNo(
    GRNDate: string,
    tenant_id: string,
    user_id: string,
  ) {
    this.logger.debug(
      { function: 'generateGRNNo', GRNDate, tenant_id, user_id },
      'generateGRNNo',
    );
    // const pattern = await this.commonLogic.getRunningPattern('PR', user_id, tenant_id)
     
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.get-pattern-by-type', service: 'running-codes' },
      { type: 'GRN', user_id, bu_code: tenant_id },
    );
    const response = await firstValueFrom(res);

    if (!response?.data || !Array.isArray(response.data)) {
      throw new Error(`Failed to get running code pattern for GRN: ${JSON.stringify(response)}`);
    }

     
    const patterns: any[] = response.data as any[];

    let datePattern;
    let runningPattern;
    patterns.forEach((pattern) => {
      if (pattern.type === 'date') {
        datePattern = pattern;
      } else if (pattern.type === 'running') {
        runningPattern = pattern;
      }
    });

    if (!datePattern || !runningPattern) {
      throw new Error(`Missing running code pattern config for GRN: datePattern=${!!datePattern}, runningPattern=${!!runningPattern}`);
    }

    const getDate = new Date(GRNDate);
    const datePatternValue = format(getDate, datePattern.pattern);
    const latestGRN = await this.findLatestPrByPattern(
      datePatternValue,
      tenant_id,
      user_id,
    );
    const latestGRNNumber = latestGRN
      ? Number(latestGRN.grn_no.slice(-Number(runningPattern.pattern)))
      : 0;

     
    const generateCodeRes: Observable<any> = this.masterService.send(
      { cmd: 'running-code.generate-code', service: 'running-codes' },
      {
        type: 'GRN',
        issueDate: getDate,
        last_no: latestGRNNumber,
        user_id,
        bu_code: tenant_id,
      },
    );
    const generateCodeResponse = await firstValueFrom(generateCodeRes);

    if (!generateCodeResponse?.data?.code) {
      throw new Error(`Failed to generate GRN number: ${JSON.stringify(generateCodeResponse)}`);
    }

    return generateCodeResponse.data.code;
  }

  /**
   * Send notification when GRN is created
   */
  private async sendGRNCreatedNotification(
    grnData: { id: string; grn_no?: string },
    createData: IGoodReceivedNoteCreate,
    creatorId: string,
  ): Promise<void> {
    try {
      const grnNo = grnData.grn_no || 'N/A';

      // Notify the creator
      await this.notificationService.sendGRNNotification(
        creatorId,
        `Good Received Note Created: ${grnNo}`,
        `Good Received Note ${grnNo} has been created for vendor ${createData.vendor_name || 'N/A'}.`,
        {
          grn_id: grnData.id,
          grn_no: grnNo,
          vendor_id: createData.vendor_id,
          vendor_name: createData.vendor_name,
          action: 'created',
        },
        creatorId,
      );

      this.logger.log(`Notification sent for GRN ${grnNo} creation`);
    } catch (error) {
      this.logger.error('Failed to send GRN created notification:', error);
    }
  }

  /**
   * Export Good Received Note to Excel
   */
  /**
   * Export good received notes to Excel
   * ส่งออกใบรับสินค้าเป็น Excel
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Excel buffer / บัฟเฟอร์ Excel
   */
  @TryCatch
  async exportToExcel(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      { function: 'exportToExcel', id, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Fetch GRN with details
    const grn = await prisma.tb_good_received_note.findFirst({
      where: { id },
      include: {
        tb_good_received_note_detail: {
          include: {
            tb_good_received_note_detail_item: true,
          },
        },
        tb_vendor: true,
        tb_currency: true,
      },
    });

    if (!grn) {
      return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Carmen System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('GRN Details');

    // Header style
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    // Title
    worksheet.mergeCells('A1:J1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Good Received Note: ${grn.grn_no || 'N/A'}`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // GRN Info
    worksheet.addRow([]);
    worksheet.addRow(['GRN No:', grn.grn_no || 'N/A', '', 'GRN Date:', grn.grn_date ? format(new Date(grn.grn_date), 'yyyy-MM-dd') : 'N/A']);
    worksheet.addRow(['Vendor:', grn.vendor_name || grn.tb_vendor?.name || 'N/A', '', 'Status:', grn.doc_status]);
    worksheet.addRow(['Invoice No:', grn.invoice_no || 'N/A', '', 'Invoice Date:', grn.invoice_date ? format(new Date(grn.invoice_date), 'yyyy-MM-dd') : 'N/A']);
    worksheet.addRow(['Currency:', grn.currency_code || grn.tb_currency?.code || 'N/A', '', 'Exchange Rate:', Number(grn.exchange_rate) || 1]);
    worksheet.addRow(['Description:', grn.description || 'N/A']);
    worksheet.addRow([]);

    // Detail items header
    const detailHeaderRow = worksheet.addRow([
      'Seq',
      'Product Name',
      'Location',
      'Order Qty',
      'Order Unit',
      'Received Qty',
      'Received Unit',
      'FOC Qty',
      'Price',
      'Total Price',
    ]);
    detailHeaderRow.eachCell((cell) => {
      Object.assign(cell, { style: headerStyle });
    });

    // Flatten details and items
    let seq = 1;
    for (const detail of grn.tb_good_received_note_detail) {
      for (const item of detail.tb_good_received_note_detail_item) {
        const row = worksheet.addRow([
          seq++,
          detail.product_name || 'N/A',
          detail.location_name || 'N/A',
          Number(item.order_qty) || 0,
          item.order_unit_name || 'N/A',
          Number(item.received_qty) || 0,
          item.received_unit_name || 'N/A',
          Number(item.foc_qty) || 0,
          Number(item.base_price) || 0,
          Number(item.total_price) || 0,
        ]);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      }
    }

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = Math.min(maxLength + 2, 50);
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `GRN_${grn.grn_no || id}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;

    return Result.ok({ buffer: Buffer.from(buffer), filename });
  }

  // reject, approve, commit — moved to good-received-note.logic.ts

  // ==================== Good Received Note Detail CRUD ====================

  /**
   * Find a GRN detail by ID
   * ค้นหารายการรายละเอียดใบรับสินค้าตาม ID
   * @param detailId - GRN detail ID / ID รายการรายละเอียดใบรับสินค้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns GRN detail / รายการรายละเอียดใบรับสินค้า
   */
  @TryCatch
  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const detail = await prisma.tb_good_received_note_detail.findFirst({
      where: {
        id: detailId,
      },
      include: {
        tb_good_received_note_detail_item: true,
        tb_good_received_note: {
          select: {
            id: true,
            grn_no: true,
            doc_status: true,
          },
        },
        tb_location: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tb_product: {
          select: {
            id: true,
            name: true,
            local_name: true,
          },
        },
      },
    });

    if (!detail) {
      return Result.error('GRN Detail not found', ErrorCode.NOT_FOUND);
    }

    return Result.ok(detail);
  }

  /**
   * Find all GRN Details by GRN ID
   */
  /**
   * Find all details by GRN ID
   * ค้นหารายการรายละเอียดทั้งหมดตาม ID ใบรับสินค้า
   * @param grnId - GRN ID / ID ใบรับสินค้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns List of GRN details / รายการรายละเอียดใบรับสินค้า
   */
  @TryCatch
  async findDetailsByGrnId(
    grnId: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailsByGrnId', grnId, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // First check if GRN exists
    const grn = await prisma.tb_good_received_note.findFirst({
      where: { id: grnId },
    });

    if (!grn) {
      return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);
    }

    const details = await prisma.tb_good_received_note_detail.findMany({
      where: {
        good_received_note_id: grnId,
      },
      include: {
        tb_good_received_note_detail_item: true,
        tb_location: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tb_product: {
          select: {
            id: true,
            name: true,
            local_name: true,
          },
        },
      },
      orderBy: {
        sequence_no: 'asc',
      },
    });

    return Result.ok(details);
  }

  /**
   * Find distinct products in a GRN with pagination/search/filter/sort
   * ค้นหาสินค้าแบบไม่ซ้ำในใบรับสินค้าพร้อมการแบ่งหน้า/ค้นหา/กรอง/เรียง
   */
  @TryCatch
  async findProductsByGrnId(
    grnId: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    locationId?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findProductsByGrnId', grnId, user_id, tenant_id, paginate, locationId },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const grn = await prisma.tb_good_received_note.findFirst({
      where: { id: grnId, deleted_at: null },
      select: { id: true },
    });
    if (!grn) {
      return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);
    }

    const defaultSearchFields = ['product_code', 'product_name', 'product_sku'];
    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    const baseWhere = {
      good_received_note_id: grnId,
      ...(locationId ? { location_id: locationId } : {}),
    };
    const { where: qWhere, orderBy, skip, take } = q.findMany();
    const where = { ...qWhere, ...baseWhere };

    const rows = await prisma.tb_good_received_note_detail.findMany({
      where,
      select: {
        product_id: true,
        product_code: true,
        product_name: true,
        product_sku: true,
      },
      distinct: ['product_id'],
      orderBy: Array.isArray(orderBy) && orderBy.length > 0 ? orderBy : [{ product_code: 'asc' }],
      skip,
      take,
    });

    const totalGroups = await prisma.tb_good_received_note_detail.groupBy({
      by: ['product_id'],
      where,
    });
    const total = totalGroups.length;

    const serialized = rows.map((r: any) => GrnProductListItemSchema.parse(r));

    return Result.ok({
      data: serialized,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Find distinct locations in a GRN with pagination/search/filter/sort
   * ค้นหาตำแหน่งจัดเก็บแบบไม่ซ้ำในใบรับสินค้าพร้อมการแบ่งหน้า/ค้นหา/กรอง/เรียง
   */
  @TryCatch
  async findLocationsByGrnId(
    grnId: string,
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    productId?: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findLocationsByGrnId', grnId, user_id, tenant_id, paginate, productId },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const grn = await prisma.tb_good_received_note.findFirst({
      where: { id: grnId, deleted_at: null },
      select: { id: true },
    });
    if (!grn) {
      return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);
    }

    const defaultSearchFields = ['location_code', 'location_name'];
    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      paginate.filter,
      paginate.sort,
      paginate.advance,
    );

    const baseWhere = {
      good_received_note_id: grnId,
      ...(productId ? { product_id: productId } : {}),
    };
    const { where: qWhere, orderBy, skip, take } = q.findMany();
    const where = { ...qWhere, ...baseWhere };

    const rows = await prisma.tb_good_received_note_detail.findMany({
      where,
      select: {
        location_id: true,
        location_code: true,
        location_name: true,
      },
      distinct: ['location_id'],
      orderBy: Array.isArray(orderBy) && orderBy.length > 0 ? orderBy : [{ location_code: 'asc' }],
      skip,
      take,
    });

    const totalGroups = await prisma.tb_good_received_note_detail.groupBy({
      by: ['location_id'],
      where,
    });
    const total = totalGroups.length;

    const serialized = rows.map((r: any) => GrnLocationListItemSchema.parse(r));

    return Result.ok({
      data: serialized,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Create a new GRN Detail
   */
  /**
   * Create a GRN detail line
   * สร้างรายการรายละเอียดใบรับสินค้า
   * @param grnId - GRN ID / ID ใบรับสินค้า
   * @param data - Detail creation data / ข้อมูลสร้างรายการรายละเอียด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Created detail / รายการรายละเอียดที่สร้างแล้ว
   */
  @TryCatch
  async createDetail(
    grnId: string,
    data: IGoodReceivedNoteDetailCreate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'createDetail', grnId, data, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Check if GRN exists and is in draft status
    const grn = await prisma.tb_good_received_note.findFirst({
      where: {
        id: grnId,
        deleted_at: null,
      },
    });

    if (!grn) {
      return Result.error('Good Received Note not found', ErrorCode.NOT_FOUND);
    }

    if (grn.doc_status !== enum_good_received_note_status.draft) {
      return Result.error('Cannot add detail to non-draft GRN', ErrorCode.INVALID_ARGUMENT);
    }

    // Get next sequence number
    const maxSequence = await prisma.tb_good_received_note_detail.aggregate({
      where: { good_received_note_id: grnId },
      _max: { sequence_no: true },
    });
    const nextSequence = (maxSequence._max.sequence_no || 0) + 1;

    // Create detail and item in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create detail
      const detail = await tx.tb_good_received_note_detail.create({
        data: {
          good_received_note_id: grnId,
          sequence_no: data.sequence_no || nextSequence,
          purchase_order_id: data.purchase_order_detail_id ? grn.id : null,
          purchase_order_detail_id: data.purchase_order_detail_id,
          location_id: data.location_id,
          location_name: data.location_name,
          product_id: data.product_id,
          product_name: data.product_name,
          product_local_name: data.product_local_name,
        },
      });

      // Create detail item with quantity/pricing info
      const detailItem = await tx.tb_good_received_note_detail_item.create({
        data: {
          good_received_note_detail_id: detail.id,
          inventory_transaction_id: data.inventory_transaction_id,
          order_qty: data.order_qty || 0,
          order_unit_id: data.order_unit_id,
          order_unit_name: data.order_unit_name,
          received_qty: data.received_qty || 0,
          received_unit_id: data.received_unit_id,
          received_unit_name: data.received_unit_name,
          foc_qty: data.foc_qty || 0,
          foc_unit_id: data.foc_unit_id,
          foc_unit_name: data.foc_unit_name,
          tax_profile_id: data.tax_profile_id,
          tax_profile_name: data.tax_profile_name,
          tax_rate: data.tax_rate || 0,
          tax_amount: data.tax_amount || 0,
          is_tax_adjustment: data.is_tax_adjustment || false,
          discount_rate: data.discount_rate || 0,
          discount_amount: data.discount_amount || 0,
          is_discount_adjustment: data.is_discount_adjustment || false,
          sub_total_price: data.price ? (data.price * (data.received_qty || 0)) : 0,
          total_price: data.total_amount || 0,
          ...calcBasePrices(
            {
              price: data.price,
              sub_total_price: data.price ? (data.price * (data.received_qty || 0)) : 0,
              discount_amount: data.discount_amount,
              net_amount: (data as any).net_amount,
              tax_amount: data.tax_amount,
              total_price: data.total_amount,
            },
            grn.exchange_rate,
          ),
          note: data.note,
          created_by_id: user_id,
        },
      });

      await this.recalculateGrnTotals(tx, grnId);

      return { ...detail, tb_good_received_note_detail_item: [detailItem] };
    });

    return Result.ok(result);
  }

  /**
   * Update a GRN Detail
   */
  /**
   * Update a GRN detail line
   * แก้ไขรายการรายละเอียดใบรับสินค้า
   * @param detailId - GRN detail ID / ID รายการรายละเอียดใบรับสินค้า
   * @param data - Detail update data / ข้อมูลแก้ไขรายการรายละเอียด
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Updated detail / รายการรายละเอียดที่แก้ไขแล้ว
   */
  @TryCatch
  async updateDetail(
    detailId: string,
    data: IGoodReceivedNoteDetailUpdate,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'updateDetail', detailId, data, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Find existing detail with GRN
    const existingDetail = await prisma.tb_good_received_note_detail.findFirst({
      where: { id: detailId },
      include: {
        tb_good_received_note: true,
        tb_good_received_note_detail_item: true,
      },
    });

    if (!existingDetail) {
      return Result.error('GRN Detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_good_received_note?.doc_status !== enum_good_received_note_status.draft) {
      return Result.error('Cannot update detail of non-draft GRN', ErrorCode.INVALID_ARGUMENT);
    }

    // Update detail and item in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update detail
      const updatedDetail = await tx.tb_good_received_note_detail.update({
        where: { id: detailId },
        data: {
          sequence_no: data.sequence_no,
          location_id: data.location_id,
          location_name: data.location_name,
          product_id: data.product_id,
          product_name: data.product_name,
          product_local_name: data.product_local_name,
        },
      });

      // Update detail item if exists
      const existingItem = existingDetail.tb_good_received_note_detail_item?.[0];
      if (existingItem) {
        await tx.tb_good_received_note_detail_item.update({
          where: { id: existingItem.id },
          data: {
            inventory_transaction_id: data.inventory_transaction_id,
            order_qty: data.order_qty,
            order_unit_id: data.order_unit_id,
            order_unit_name: data.order_unit_name,
            received_qty: data.received_qty,
            received_unit_id: data.received_unit_id,
            received_unit_name: data.received_unit_name,
            foc_qty: data.foc_qty,
            foc_unit_id: data.foc_unit_id,
            foc_unit_name: data.foc_unit_name,
            tax_profile_id: data.tax_profile_id,
            tax_profile_name: data.tax_profile_name,
            tax_rate: data.tax_rate,
            tax_amount: data.tax_amount,
            is_tax_adjustment: data.is_tax_adjustment,
            discount_rate: data.discount_rate,
            discount_amount: data.discount_amount,
            is_discount_adjustment: data.is_discount_adjustment,
            total_price: data.total_amount,
            ...calcBasePrices(
              {
                price: (data as any).price,
                sub_total_price: (data as any).sub_total_price,
                discount_amount: data.discount_amount,
                net_amount: (data as any).net_amount,
                tax_amount: data.tax_amount,
                total_price: data.total_amount,
              },
              existingDetail.tb_good_received_note?.exchange_rate,
            ),
            note: data.note,
            updated_by_id: user_id,
            updated_at: new Date().toISOString(),
          },
        });
      }

      if (existingDetail.tb_good_received_note?.id) {
        await this.recalculateGrnTotals(tx, existingDetail.tb_good_received_note.id);
      }

      return updatedDetail;
    });

    return Result.ok(result);
  }

  /**
   * Delete a GRN Detail
   */
  /**
   * Soft delete a GRN detail line
   * ลบรายการรายละเอียดใบรับสินค้าแบบซอฟต์ดีลีท
   * @param detailId - GRN detail ID / ID รายการรายละเอียดใบรับสินค้า
   * @param user_id - User ID / ID ผู้ใช้
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @returns Deleted detail / รายการรายละเอียดที่ลบแล้ว
   */
  @TryCatch
  async deleteDetail(
    detailId: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'deleteDetail', detailId, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    // Find existing detail with GRN
    const existingDetail = await prisma.tb_good_received_note_detail.findFirst({
      where: { id: detailId },
      include: {
        tb_good_received_note: true,
        tb_good_received_note_detail_item: true,
      },
    });

    if (!existingDetail) {
      return Result.error('GRN Detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_good_received_note?.doc_status !== enum_good_received_note_status.draft) {
      return Result.error('Cannot delete detail of non-draft GRN', ErrorCode.INVALID_ARGUMENT);
    }

    // Delete detail and related items in transaction
    await prisma.$transaction(async (tx) => {
      // Delete detail items first (due to foreign key)
      await tx.tb_good_received_note_detail_item.deleteMany({
        where: { good_received_note_detail_id: detailId },
      });

      // Delete detail comments
      await tx.tb_good_received_note_detail_comment.deleteMany({
        where: { good_received_note_detail_id: detailId },
      });

      // Delete detail
      await tx.tb_good_received_note_detail.delete({
        where: { id: detailId },
      });

      if (existingDetail.tb_good_received_note?.id) {
        await this.recalculateGrnTotals(tx, existingDetail.tb_good_received_note.id);
      }
    });

    return Result.ok({ id: detailId });
  }

  /**
   * Recompute amount totals for one GRN (or all non-deleted GRNs in tenant
   * if grnId is omitted). Used by the admin "regenerate totals" endpoint to
   * repair drift after manual DB edits or migrations.
   * @returns count of GRNs recalculated
   */
  @TryCatch
  async regenerateTotals(
    user_id: string,
    tenant_id: string,
    grnId?: string,
  ): Promise<Result<{ count: number }>> {
    this.logger.debug(
      { function: 'regenerateTotals', user_id, tenant_id, grnId },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }
    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    if (grnId) {
      const exists = await prisma.tb_good_received_note.findFirst({
        where: { id: grnId, deleted_at: null },
        select: { id: true },
      });
      if (!exists) {
        return Result.error('Good received note not found', ErrorCode.NOT_FOUND);
      }
      await this.recalculateGrnTotals(prisma, grnId);
      return Result.ok({ count: 1 });
    }

    const grns = await prisma.tb_good_received_note.findMany({
      where: { deleted_at: null },
      select: { id: true },
    });
    for (const g of grns) {
      await this.recalculateGrnTotals(prisma, g.id);
    }
    return Result.ok({ count: grns.length });
  }

  /**
   * Recompute net_amount, base_net_amount, total_amount, base_total_amount on
   * tb_good_received_note from the current set of (non-deleted) detail items.
   * เรียกหลังจาก insert / update / soft-delete tb_good_received_note_detail_item
   * เพื่อให้ list/sort สามารถใช้คอลัมน์ header ได้โดยตรง
   */
  async recalculateGrnTotals(tx: any, grnId: string): Promise<void> {
    const agg = await tx.tb_good_received_note_detail_item.aggregate({
      where: {
        deleted_at: null,
        tb_good_received_note_detail: { good_received_note_id: grnId },
      },
      _sum: {
        net_amount: true,
        base_net_amount: true,
        total_price: true,
        base_total_price: true,
      },
    });

    await tx.tb_good_received_note.update({
      where: { id: grnId },
      data: {
        net_amount: agg._sum.net_amount ?? 0,
        base_net_amount: agg._sum.base_net_amount ?? 0,
        total_amount: agg._sum.total_price ?? 0,
        base_total_amount: agg._sum.base_total_price ?? 0,
      },
    });
  }

  // ==================== Methods used by GoodReceivedNoteLogic ====================

  /**
   * Get a tenant prisma client for use in logic-layer transactions.
   */
  async getPrismaClient(user_id: string, tenant_id: string) {
    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) return null;
    return this.prismaTenant(tenant.tenant_id, tenant.db_connection);
  }

  /**
   * Find GRN with details and detail items for commit/approve flow.
   */
  async findGrnWithDetails(prisma: any, id: string) {
    return prisma.tb_good_received_note.findFirst({
      where: { id, deleted_at: null },
      include: {
        tb_good_received_note_detail: {
          select: {
            id: true,
            purchase_order_detail_id: true,
            product_id: true,
            location_id: true,
            location_code: true,
            tb_good_received_note_detail_item: {
              select: {
                id: true,
                received_qty: true,
                received_base_qty: true,
                base_net_amount: true,
                purchase_order_detail_purchase_request_detail_id: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update GRN status within a transaction.
   */
  async updateGrnStatus(tx: any, id: string, status: enum_good_received_note_status, user_id: string) {
    await tx.tb_good_received_note.update({
      where: { id },
      data: {
        doc_status: status,
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });
  }

  /**
   * Lock and fetch junction rows for a PO detail (FOR UPDATE).
   */
  async lockJunctionRows(tx: any, poDetailId: string): Promise<any[]> {
    return tx.$queryRawUnsafe(
      `SELECT * FROM tb_purchase_order_detail_tb_purchase_request_detail
       WHERE po_detail_id = $1 AND deleted_at IS NULL
       FOR UPDATE`,
      poDetailId,
    );
  }

  /**
   * Increment received_qty on a junction row.
   */
  async incrementJunctionReceivedQty(tx: any, junctionId: string, qty: number, user_id: string) {
    await tx.tb_purchase_order_detail_tb_purchase_request_detail.update({
      where: { id: junctionId },
      data: {
        received_qty: { increment: qty },
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });
  }

  /**
   * Increment received_qty on a PO detail.
   */
  async incrementPoDetailReceivedQty(tx: any, poDetailId: string, qty: number, user_id: string) {
    await tx.tb_purchase_order_detail.update({
      where: { id: poDetailId },
      data: {
        received_qty: { increment: qty },
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });
  }

  /**
   * Get all PO detail rows for the given IDs (to find their purchase_order_id).
   */
  async getPoDetailsByIds(tx: any, poDetailIds: string[]) {
    return tx.tb_purchase_order_detail.findMany({
      where: { id: { in: poDetailIds } },
      select: { purchase_order_id: true },
    });
  }

  /**
   * Get all detail rows for a PO (to check if fully received).
   */
  async getPoDetailsForStatus(tx: any, poId: string) {
    return tx.tb_purchase_order_detail.findMany({
      where: { purchase_order_id: poId, deleted_at: null },
      select: { order_qty: true, received_qty: true, cancelled_qty: true },
    });
  }

  /**
   * Update PO header status.
   */
  async updatePoStatus(tx: any, poId: string, status: any, user_id: string) {
    await tx.tb_purchase_order.update({
      where: { id: poId },
      data: {
        po_status: status,
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });
  }

  /**
   * Find GRN for reject flow (header only).
   */
  async findGrnForReject(prisma: any, id: string) {
    return prisma.tb_good_received_note.findFirst({
      where: { id, deleted_at: null },
    });
  }

  /**
   * Void a GRN (for reject).
   */
  async voidGrn(prisma: any, id: string, reason: string, existingNote: string | null, user_id: string) {
    await prisma.tb_good_received_note.update({
      where: { id },
      data: {
        doc_status: enum_good_received_note_status.voided,
        note: reason ? `Rejected: ${reason}` : existingNote,
        updated_by_id: user_id,
        updated_at: new Date().toISOString(),
      },
    });
  }

  /**
   * Print a GRN via FastReport viewer (micro-report)
   * พิมพ์ใบรับสินค้าผ่าน FastReport viewer (micro-report)
   */
  @TryCatch
  async printToReport(
    id: string,
    user_id: string,
    tenant_id: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id, user_id, tenant_id },
      GoodReceivedNoteService.name,
    );

    const tenant = await this.tenantService.getdb_connection(user_id, tenant_id);
    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }
    const prisma = await this.prismaTenant(tenant.tenant_id, tenant.db_connection);

    const grn = await prisma.tb_good_received_note.findFirst({
      where: { id, deleted_at: null },
      include: {
        tb_good_received_note_detail: { orderBy: { sequence_no: 'asc' } },
      },
    });
    if (!grn) {
      return Result.error('Good received note not found', ErrorCode.NOT_FOUND);
    }

    return renderViaMicroReport({
      prismaSystem: this.prismaSystem,
      bu_code: tenant_id,
      documentType: 'GRN',
      datasetPrefix: 'GRN',
      buildHeader: () => ({
        GrnNo: grn.grn_no || '',
        GrnDate: formatReportDate(grn.grn_date),
        InvoiceNo: grn.invoice_no || '',
        InvoiceDate: formatReportDate(grn.invoice_date),
        VendorName: grn.vendor_name || '',
        Currency: grn.currency_code || '',
        Description: grn.description || '',
        GrnStatus: grn.doc_status || '',
        TotalAmount: Number(grn.total_amount) || 0,
      }),
      buildDetail: () =>
        grn.tb_good_received_note_detail.map((d, i) => ({
          No: String(i + 1),
          ProductName: d.product_name || '',
          LocationName: d.location_name || '',
          ProductCode: d.product_code || '',
          // Quantity/price live on tb_good_received_note_detail_item — template
          // can join those if needed.
        })),
    });
  }
}
