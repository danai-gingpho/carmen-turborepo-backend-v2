import { HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { TenantService } from '@/tenant/tenant.service';
import {
  enum_purchase_order_doc_status,
  enum_purchase_request_doc_status,
  PrismaClient,
} from '@repo/prisma-shared-schema-tenant';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import {
  ICreatePurchaseOrder,
  IUpdatePurchaseOrder,
  IPurchaseOrderDetail,
} from './interface/purchase-order.interface';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { CommonLogic } from '@/common/common.logic';
import { getPattern } from '@/common/common.helper';
import { format } from 'date-fns';
import QueryParams from '@/libs/paginate.query';
import getPaginationParams from '@/common/helpers/pagination.params';
import {
  NotificationService,
  NotificationType,
  PurchaseOrderDetailResponseSchema,
  PurchaseOrderListItemResponseSchema,
  TryCatch,
  Result,
  ErrorCode,
} from '@/common';
import * as ExcelJS from 'exceljs';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';


const ERROR_MISSING_BU_CODE = 'Missing bu_code';
const ERROR_MISSING_USER_ID = 'Missing user_id';

@Injectable()
export class PurchaseOrderService {
  get bu_code(): string {
    if (this._bu_code) {
      return String(this._bu_code);
    }
    throw new HttpException(
      ERROR_MISSING_BU_CODE,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  get userId(): string {
    if (isUUID(this._userId, 4)) {
      return String(this._userId);
    }
    throw new HttpException(
      ERROR_MISSING_USER_ID,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  set bu_code(value: string) {
    this._bu_code = value;
  }

  set userId(value: string) {
    this._userId = value;
  }

  private _bu_code?: string;
  private _userId?: string;

  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseOrderService.name,
  );

  async initializePrismaService(bu_code: string, userId: string): Promise<void> {
    this._prismaService = await this.tenantService.prismaTenantInstance(bu_code, userId);
  }

  private _prismaService: PrismaClient | undefined;

  get prismaService(): PrismaClient {
    if (!this._prismaService) {
      throw new HttpException(
        'Prisma service is not initialized',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return this._prismaService;
  }

  constructor(
    private readonly tenantService: TenantService,
    private readonly commonLogic: CommonLogic,
    private readonly notificationService: NotificationService,
  ) {}

  @TryCatch
  async findById(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findById', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        po_no: true,
        po_status: true,
        description: true,
        order_date: true,
        delivery_date: true,
        workflow_id: true,
        workflow_name: true,
        workflow_current_stage: true,
        workflow_previous_stage: true,
        workflow_next_stage: true,
        user_action: true,
        last_action: true,
        last_action_at_date: true,
        last_action_by_id: true,
        last_action_by_name: true,
        vendor_id: true,
        vendor_name: true,
        currency_id: true,
        currency_name: true,
        exchange_rate: true,
        approval_date: true,
        email: true,
        buyer_id: true,
        buyer_name: true,
        credit_term_id: true,
        credit_term_name: true,
        credit_term_value: true,
        remarks: true,
        total_qty: true,
        total_price: true,
        total_tax: true,
        total_amount: true,
        note: true,
        info: true,
        doc_version: true,
        created_at: true,
        tb_vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tb_currency_tb_purchase_order_currency_idTotb_currency: {
          select: {
            id: true,
            name: true,
            code: true,
            symbol: true,
          },
        },
        tb_credit_term: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
        tb_purchase_order_detail: {
          select: {
            id: true,
            sequence_no: true,
            description: true,
            order_qty: true,
            order_unit_id: true,
            order_unit_name: true,
            order_unit_conversion_factor: true,
            base_qty: true,
            base_unit_id: true,
            base_unit_name: true,
            is_foc: true,
            tax_profile_id: true,
            tax_profile_name: true,
            tax_rate: true,
            tax_amount: true,
            base_tax_amount: true,
            is_tax_adjustment: true,
            discount_rate: true,
            discount_amount: true,
            base_discount_amount: true,
            is_discount_adjustment: true,
            price: true,
            sub_total_price: true,
            net_amount: true,
            total_price: true,
            base_price: true,
            base_sub_total_price: true,
            base_net_amount: true,
            base_total_price: true,
            received_qty: true,
            cancelled_qty: true,
            note: true,
            info: true,
            doc_version: true,
            tb_purchase_order_detail_tb_purchase_request_detail: {
              select: {
                id: true,
                pr_detail_id: true,
                pr_detail_order_unit_id: true,
                pr_detail_order_unit_name: true,
                pr_detail_qty: true,
                pr_detail_base_qty: true,
                pr_detail_base_unit_id: true,
                pr_detail_base_unit_name: true,
                received_qty: true,
                foc_qty: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    // Transform the response
    const transformedData = {
      ...purchaseOrder,
      vendor: purchaseOrder.tb_vendor,
      currency: purchaseOrder.tb_currency_tb_purchase_order_currency_idTotb_currency,
      //credit_term: purchaseOrder.tb_credit_term?.value,
      credit_term_value: purchaseOrder.tb_credit_term?.value,
      credit_term_id: purchaseOrder.tb_credit_term?.id,
      credit_term_name: purchaseOrder.tb_credit_term?.name,
      total_qty: Number(purchaseOrder.total_qty),
      total_price: Number(purchaseOrder.total_price),
      total_tax: Number(purchaseOrder.total_tax),
      total_amount: Number(purchaseOrder.total_amount),
      exchange_rate: Number(purchaseOrder.exchange_rate),
      purchase_order_detail: purchaseOrder.tb_purchase_order_detail.map((detail) => ({
        ...detail,
        order_qty: Number(detail.order_qty),
        order_unit_conversion_factor: Number(detail.order_unit_conversion_factor),
        base_qty: Number(detail.base_qty),
        tax_rate: Number(detail.tax_rate),
        tax_amount: Number(detail.tax_amount),
        base_tax_amount: Number(detail.base_tax_amount),
        discount_rate: Number(detail.discount_rate),
        discount_amount: Number(detail.discount_amount),
        base_discount_amount: Number(detail.base_discount_amount),
        price: Number(detail.price),
        sub_total_price: Number(detail.sub_total_price),
        net_amount: Number(detail.net_amount),
        total_price: Number(detail.total_price),
        base_price: Number(detail.base_price),
        base_sub_total_price: Number(detail.base_sub_total_price),
        base_net_amount: Number(detail.base_net_amount),
        base_total_price: Number(detail.base_total_price),
        received_qty: Number(detail.received_qty),
        cancelled_qty: Number(detail.cancelled_qty),
        pr_details: detail.tb_purchase_order_detail_tb_purchase_request_detail.map((prLink) => ({
          id: prLink.id,
          pr_detail_id: prLink.pr_detail_id,
          order_unit_id: prLink.pr_detail_order_unit_id,
          order_unit_name: prLink.pr_detail_order_unit_name,
          order_qty: Number(prLink.pr_detail_qty),
          order_base_qty: Number(prLink.pr_detail_base_qty),
          base_unit_id: prLink.pr_detail_base_unit_id,
          base_unit_name: prLink.pr_detail_base_unit_name,
          received_qty: Number(prLink.received_qty),
          foc_qty: Number(prLink.foc_qty),
        })),
      })),
    };

    // Remove the original nested relations
    delete (transformedData as any).tb_vendor;
    delete (transformedData as any).tb_currency_tb_purchase_order_currency_idTotb_currency;
    delete (transformedData as any).tb_credit_term;
    delete (transformedData as any).tb_purchase_order_detail;

    const serializedPurchaseOrder = PurchaseOrderDetailResponseSchema.parse(transformedData);

    return Result.ok(serializedPurchaseOrder);
  }

  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAll', user_id: this.userId, tenant_id: this.bu_code, paginate },
      PurchaseOrderService.name,
    );

    const defaultSearchFields = ['po_no', 'description', 'vendor_name'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter) ? paginate.filter : {},
      paginate.sort,
      paginate.advance,
    );

    const pagination = getPaginationParams(q.page, q.perpage);

    const selectClause = {
      id: true,
      po_no: true,
      po_status: true,
      description: true,
      order_date: true,
      delivery_date: true,
      vendor_id: true,
      vendor_name: true,
      currency_id: true,
      currency_name: true,
      exchange_rate: true,
      buyer_id: true,
      buyer_name: true,
      total_qty: true,
      total_price: true,
      total_tax: true,
      total_amount: true,
      workflow_current_stage: true,
      workflow_next_stage: true,
      last_action: true,
      created_at: true,
      doc_version: true,
      tb_vendor: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      tb_currency_tb_purchase_order_currency_idTotb_currency: {
        select: {
          id: true,
          name: true,
          code: true,
          symbol: true,
        },
      },
    };

    const purchaseOrders = await this.prismaService.tb_purchase_order.findMany({
      select: selectClause,
      where: q.where(),
      orderBy: q.orderBy(),
      ...pagination
    });

    const total = await this.prismaService.tb_purchase_order.count({
      where: q.where(),
    });

    const transformedData = purchaseOrders.map((po) => ({
      id: po.id,
      po_no: po.po_no,
      po_status: po.po_status,
      description: po.description,
      order_date: po.order_date,
      delivery_date: po.delivery_date,
      vendor_name: po.tb_vendor?.name ?? po.vendor_name ?? null,
      vendor: po.tb_vendor,
      currency: po.tb_currency_tb_purchase_order_currency_idTotb_currency,
      exchange_rate: Number(po.exchange_rate),
      buyer_id: po.buyer_id,
      buyer_name: po.buyer_name,
      total_qty: Number(po.total_qty),
      total_price: Number(po.total_price),
      total_tax: Number(po.total_tax),
      total_amount: Number(po.total_amount),
      workflow_current_stage: po.workflow_current_stage,
      workflow_next_stage: po.workflow_next_stage,
      last_action: po.last_action,
      created_at: po.created_at,
      doc_version: po.doc_version,
    }));

    const serializedPurchaseOrders = transformedData.map((item) => PurchaseOrderListItemResponseSchema.parse(item));    

    return Result.ok({
      paginate: {
        total: total,
        page: q.perpage < 0 ? 1 : q.page,
        perpage: q.perpage < 0 ? 1 : q.perpage,
        pages: total === 0 || q.perpage < 0 ? 1 : Math.ceil(total / q.perpage),
      },
      data: serializedPurchaseOrders,
    });
  }

  @TryCatch
  async create(data: ICreatePurchaseOrder): Promise<Result<any>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Validate vendor
    const vendor = await this.prismaService.tb_vendor.findUnique({
      where: { id: data.vendor_id },
    });

    if (!vendor) {
      return Result.error('Vendor not found', ErrorCode.INVALID_ARGUMENT);
    }

    // Validate currency
    const currency = await this.prismaService.tb_currency.findUnique({
      where: { id: data.currency_id },
    });

    if (!currency) {
      return Result.error('Currency not found', ErrorCode.INVALID_ARGUMENT);
    }

    // Validate credit term if provided
    let creditTerm = null;
    if (data.credit_term_id) {
      creditTerm = await this.prismaService.tb_credit_term.findUnique({
        where: { id: data.credit_term_id },
      });
    }

    // Generate PO number - ensure order_date is a valid Date
    const orderDate = data.order_date ? new Date(String(data.order_date)) : new Date();
    const poNo = await this.generatePONo(orderDate.toISOString());

    // Calculate totals from details
    let total_qty = 0;
    let total_price = 0;
    let total_tax = 0;
    let total_amount = 0;

    for (const detail of data.details) {
      total_qty += detail.order_qty || 0;
      total_price += detail.sub_total_price || 0;
      total_tax += detail.tax_amount || 0;
      total_amount += detail.total_price || 0;
    }

    // Create Purchase Order with transaction
    const purchaseOrder = await this.prismaService.$transaction(async (prismatx) => {
      // Create PO header
      const po = await prismatx.tb_purchase_order.create({
        data: {
          po_no: poNo,
          po_status: enum_purchase_order_doc_status.draft,
          description: data.description,
          order_date: orderDate.toISOString(),
          delivery_date: new Date(String(data.delivery_date)).toISOString(),
          vendor_id: data.vendor_id,
          vendor_name: data.vendor_name || vendor.name,
          currency_id: data.currency_id,
          currency_name: data.currency_name || currency.name,
          exchange_rate: data.exchange_rate || 1,
          email: data.email,
          buyer_id: data.buyer_id,
          buyer_name: data.buyer_name,
          credit_term_id: data.credit_term_id,
          credit_term_name: data.credit_term_name || creditTerm?.name,
          credit_term_value: data.credit_term_value || creditTerm?.value,
          remarks: data.remarks,
          note: data.note,
          total_qty,
          total_price,
          total_tax,
          total_amount,
          is_active: true,
          doc_version: 1,
          created_by_id: this.userId,
        },
      });

      // Create PO details and PR detail linkages
      for (const detail of data.details) {
        // Validate unit
        const unit = await prismatx.tb_unit.findUnique({
          where: { id: detail.order_unit_id },
        });

        // Calculate base_qty if not provided
        const base_qty =
          detail.base_qty ||
          detail.order_qty * (detail.order_unit_conversion_factor || 1);

        // Create PO detail
        const poDetail = await prismatx.tb_purchase_order_detail.create({
          data: {
            purchase_order_id: po.id,
            sequence_no: detail.sequence,
            description: detail.description,
            order_qty: detail.order_qty,
            order_unit_id: detail.order_unit_id || undefined,
            order_unit_name: detail.order_unit_name || unit?.name,
            order_unit_conversion_factor: detail.order_unit_conversion_factor || 1,
            base_qty: base_qty,
            base_unit_id: detail.base_unit_id || undefined,
            base_unit_name: detail.base_unit_name,
            is_foc: detail.is_foc || false,
            // Pricing
            price: detail.price || 0,
            sub_total_price: detail.sub_total_price || 0,
            net_amount: detail.net_amount || 0,
            total_price: detail.total_price || 0,
            // Tax
            tax_profile_id: detail.tax_profile_id || undefined,
            tax_profile_name: detail.tax_profile_name,
            tax_rate: detail.tax_rate || 0,
            tax_amount: detail.tax_amount || 0,
            is_tax_adjustment: detail.is_tax_adjustment || false,
            // Discount
            discount_rate: detail.discount_rate || 0,
            discount_amount: detail.discount_amount || 0,
            is_discount_adjustment: detail.is_discount_adjustment || false,
            note: detail.note,
            // Store product info in info JSON field
            info: {
              product_id: detail.product_id,
              product_name: detail.product_name,
              product_local_name: detail.product_local_name,
            },
            is_active: true,
            doc_version: 1,
            created_by_id: this.userId,
          },
        });

        // Create PR detail linkages (junction table records)
        if (detail.pr_detail && detail.pr_detail.length > 0) {
          for (const prDetail of detail.pr_detail) {
            // Skip if required fields are missing
            if (!prDetail.pr_detail_id || !prDetail.order_unit_id) {
              continue;
            }
            await prismatx.tb_purchase_order_detail_tb_purchase_request_detail.create({
              data: {
                po_detail_id: poDetail.id,
                pr_detail_id: prDetail.pr_detail_id,
                pr_detail_order_unit_id: prDetail.order_unit_id,
                pr_detail_order_unit_name: prDetail.order_unit_name || '',
                pr_detail_qty: prDetail.order_qty,
                pr_detail_base_qty: prDetail.order_base_qty,
                pr_detail_base_unit_id: prDetail.order_base_unit_id || undefined,
                pr_detail_base_unit_name: prDetail.order_base_unit_name,
                created_by_id: this.userId,
              },
            });
          }
        }
      }

      return po;
    });

    // Send notification for PO creation
    this.sendPOCreatedNotification(purchaseOrder, data);

    return Result.ok({ id: purchaseOrder.id, po_no: purchaseOrder.po_no });
  }

  @TryCatch
  async update(data: IUpdatePurchaseOrder): Promise<Result<any>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const purchaseOrderId = typeof data.id === 'object' ? (data.id as any).id : data.id;

    const currentPO = await this.prismaService.tb_purchase_order.findUnique({
      where: { id: purchaseOrderId },
    });

    if (!currentPO) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    // Check doc_version for optimistic locking
    if (data.doc_version !== undefined && data.doc_version !== currentPO.doc_version) {
      return Result.error('Purchase order has been modified by another user', ErrorCode.ALREADY_EXISTS);
    }

    // Validate vendor if provided
    if (data.vendor_id) {
      const vendor = await this.prismaService.tb_vendor.findUnique({
        where: { id: data.vendor_id },
      });

      if (!vendor) {
        return Result.error('Vendor not found', ErrorCode.INVALID_ARGUMENT);
      }
      data.vendor_name = data.vendor_name || vendor.name;
    }

    // Validate currency if provided
    if (data.currency_id) {
      const currency = await this.prismaService.tb_currency.findUnique({
        where: { id: data.currency_id },
      });

      if (!currency) {
        return Result.error('Currency not found', ErrorCode.INVALID_ARGUMENT);
      }
      data.currency_name = data.currency_name || currency.name;
    }

    // Update the main purchase order record
    const updatedPO = await this.prismaService.tb_purchase_order.update({
      where: { id: purchaseOrderId },
      data: {
        description: data.description,
        order_date: data.order_date ? new Date(data.order_date as string).toISOString() : undefined,
        delivery_date: data.delivery_date
          ? new Date(data.delivery_date as string).toISOString()
          : undefined,
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        currency_id: data.currency_id,
        currency_name: data.currency_name,
        exchange_rate: data.exchange_rate,
        email: data.email,
        buyer_id: data.buyer_id,
        buyer_name: data.buyer_name,
        credit_term_id: data.credit_term_id,
        credit_term_name: data.credit_term_name,
        credit_term_value: data.credit_term_value,
        remarks: data.remarks,
        note: data.note,
        info: data.info as object,
        doc_version: { increment: 1 },
        updated_by_id: this.userId,
      },
    });

    // Handle purchase_order_details add/remove/update
    if (data.purchase_order_details) {
      // Add new details
      if (data.purchase_order_details.add) {
        for (const detail of data.purchase_order_details.add) {
          await this.prismaService.tb_purchase_order_detail.create({
            data: {
              purchase_order_id: updatedPO.id,
              sequence_no: detail.sequence_no,
              description: detail.description,
              order_qty: detail.order_qty,
              order_unit_id: detail.order_unit_id || undefined,
              order_unit_name: detail.order_unit_name,
              order_unit_conversion_factor: detail.order_unit_conversion_factor,
              base_qty: detail.base_qty,
              base_unit_id: detail.base_unit_id || undefined,
              base_unit_name: detail.base_unit_name,
              is_foc: detail.is_foc,
              tax_profile_id: detail.tax_profile_id || undefined,
              tax_profile_name: detail.tax_profile_name,
              tax_rate: detail.tax_rate,
              tax_amount: detail.tax_amount,
              is_tax_adjustment: detail.is_tax_adjustment,
              discount_rate: detail.discount_rate,
              discount_amount: detail.discount_amount,
              is_discount_adjustment: detail.is_discount_adjustment,
              price: detail.price,
              sub_total_price: detail.sub_total_price,
              net_amount: detail.net_amount,
              total_price: detail.total_price,
              note: detail.note,
              info: detail.info as object,
              is_active: true,
              doc_version: 1,
              created_by_id: this.userId,
            },
          });
        }
      }

      // Remove details
      if (data.purchase_order_details.remove) {
        for (const detailId of data.purchase_order_details.remove) {
          const id = typeof detailId === 'object' ? detailId.id : detailId;
          // First delete junction records
          await this.prismaService.tb_purchase_order_detail_tb_purchase_request_detail.deleteMany(
            {
              where: { po_detail_id: id },
            },
          );
          // Then delete the detail
          await this.prismaService.tb_purchase_order_detail.delete({
            where: { id: id },
          });
        }
      }

      // Update existing details
      if (data.purchase_order_details.update) {
        for (const detail of data.purchase_order_details.update) {
          const detailId = typeof detail.id === 'object' ? (detail.id as any).id : detail.id;
          await this.prismaService.tb_purchase_order_detail.update({
            where: { id: detailId },
            data: {
              sequence_no: detail.sequence_no,
              description: detail.description,
              order_qty: detail.order_qty,
              order_unit_id: detail.order_unit_id || undefined,
              order_unit_name: detail.order_unit_name,
              order_unit_conversion_factor: detail.order_unit_conversion_factor,
              base_qty: detail.base_qty,
              base_unit_id: detail.base_unit_id || undefined,
              base_unit_name: detail.base_unit_name,
              is_foc: detail.is_foc,
              tax_profile_id: detail.tax_profile_id || undefined,
              tax_profile_name: detail.tax_profile_name,
              tax_rate: detail.tax_rate,
              tax_amount: detail.tax_amount,
              is_tax_adjustment: detail.is_tax_adjustment,
              discount_rate: detail.discount_rate,
              discount_amount: detail.discount_amount,
              is_discount_adjustment: detail.is_discount_adjustment,
              price: detail.price,
              sub_total_price: detail.sub_total_price,
              net_amount: detail.net_amount,
              total_price: detail.total_price,
              note: detail.note,
              info: detail.info as object,
              doc_version: { increment: 1 },
              updated_by_id: this.userId,
            },
          });
        }
      }
    }

    // Recalculate totals
    const details = await this.prismaService.tb_purchase_order_detail.findMany({
      where: { purchase_order_id: updatedPO.id },
    });

    let total_qty = 0;
    let total_price = 0;
    let total_tax = 0;
    let total_amount = 0;

    for (const detail of details) {
      total_qty += Number(detail.order_qty) || 0;
      total_price += Number(detail.sub_total_price) || 0;
      total_tax += Number(detail.tax_amount) || 0;
      total_amount += Number(detail.total_price) || 0;
    }

    await this.prismaService.tb_purchase_order.update({
      where: { id: updatedPO.id },
      data: {
        total_qty,
        total_price,
        total_tax,
        total_amount,
      },
    });

    return Result.ok({ id: updatedPO.id });
  }

  @TryCatch
  async delete(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const purchaseOrder = await this.prismaService.tb_purchase_order.findUnique({
      where: { id: id },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    // Soft delete - update status and set deleted_at
    const deletedPO = await this.prismaService.tb_purchase_order.update({
      where: { id: id },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_by_id: this.userId,
      },
    });

    return Result.ok({ id: deletedPO.id });
  }

  @TryCatch
  async cancel(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'cancel', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Find the purchase order with its details
    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: id,
        is_active: true,
        deleted_at: null,
      },
      include: {
        tb_purchase_order_detail: true,
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    // Validate status - only allow cancellation from draft, in_progress, or sent
    const allowedStatuses: enum_purchase_order_doc_status[] = [
      enum_purchase_order_doc_status.draft,
      enum_purchase_order_doc_status.in_progress,
      enum_purchase_order_doc_status.sent,
    ];

    if (!allowedStatuses.includes(purchaseOrder.po_status)) {
      return Result.error(
        `Cannot cancel purchase order with status '${purchaseOrder.po_status}'. Only draft, in_progress, or sent orders can be cancelled.`,
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    // Use transaction to update PO and line items
    await this.prismaService.$transaction(async (prismatx) => {
      // Update PO header
      await prismatx.tb_purchase_order.update({
        where: { id: id },
        data: {
          po_status: enum_purchase_order_doc_status.closed,
          last_action_at_date: new Date(),
          last_action_by_id: this.userId,
          updated_by_id: this.userId,
        },
      });

      // Update each line item - set cancelled_qty to remaining qty (order_qty - received_qty)
      for (const detail of purchaseOrder.tb_purchase_order_detail) {
        const orderQty = Number(detail.order_qty) || 0;
        const receivedQty = Number(detail.received_qty) || 0;
        const cancelledQty = orderQty - receivedQty;

        await prismatx.tb_purchase_order_detail.update({
          where: { id: detail.id },
          data: {
            cancelled_qty: cancelledQty,
            updated_by_id: this.userId,
          },
        });
      }
    });

    return Result.ok({ id: id });
  }

  private async generatePONo(orderDate: string): Promise<string> {
    this.logger.debug(
      { function: 'generatePONo', orderDate, tenant_id: this.bu_code, user_id: this.userId },
      PurchaseOrderService.name,
    );

    const pattern = await this.commonLogic.getRunningPattern(
      'PO',
      this.userId,
      this.bu_code,
    );

    const poPatterns = getPattern(pattern);
    let datePattern;
    let runningPattern;

    poPatterns.forEach((p) => {
      if (p.type === 'date') {
        datePattern = p;
      } else if (p.type === 'running') {
        runningPattern = p;
      }
    });

    const getDate = new Date(orderDate);
    const datePatternValue = format(getDate, datePattern.pattern);

    const latestPO = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        po_no: {
          contains: `PO${datePatternValue}`,
        },
      },
      orderBy: {
        po_no: 'desc',
      },
    });

    const latestPONumber = latestPO
      ? Number(latestPO.po_no.slice(-Number(runningPattern.pattern)))
      : 0;

    const poNo = await this.commonLogic.generateRunningCode(
      'PO',
      getDate,
      latestPONumber,
      this.userId,
      this.bu_code,
    );

    return poNo;
  }

  /**
   * Group PR details by vendor_id -> delivery_date -> currency_id
   * This is used to prepare data for creating POs from PRs
   */
  @TryCatch
  async groupPrForPo(pr_ids: string[]): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'groupPrForPo',
        pr_ids,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseOrderService.name,
    );

    if (!pr_ids || pr_ids.length === 0) {
      return Result.error('PR IDs are required', ErrorCode.INVALID_ARGUMENT);
    }

    // Fetch PR details with related data based on PR IDs
    const prDetails = await this.prismaService.tb_purchase_request_detail.findMany({
      where: {
        purchase_request_id: { in: pr_ids },
      },
      select: {
        id: true,
        purchase_request_id: true,
        delivery_date: true,
        product_id: true,
        product_name: true,
        vendor_id: true,
        vendor_name: true,
        currency_id: true,
        currency_name: true,
        exchange_rate: true,
        approved_qty: true,
        pricelist_price: true,
        total_price: true,
        base_total_price: true,
        tb_purchase_request: {
          select: {
            id: true,
            pr_no: true,
          },
        },
        tb_vendor: {
          select: {
            id: true,
            name: true,
          },
        },
        tb_currency: {
          select: {
            id: true,
            name: true,
          },
        },
        tb_product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (prDetails.length === 0) {
      return Result.error('No PR details found', ErrorCode.NOT_FOUND);
    }

    // Group by vendor_id -> delivery_date -> currency_id
    const groupedData = new Map<string, any>();

    for (const prDetail of prDetails) {
      // Skip if missing required grouping fields
      if (!prDetail.vendor_id || !prDetail.currency_id) {
        continue;
      }

      // Format delivery_date to date string (YYYY-MM-DD)
      const deliveryDateStr = prDetail.delivery_date
        ? format(new Date(prDetail.delivery_date), 'yyyy-MM-dd')
        : '';

      // Create group key: vendor_id|delivery_date|currency_id
      const groupKey = `${prDetail.vendor_id}|${deliveryDateStr}|${prDetail.currency_id}`;

      if (!groupedData.has(groupKey)) {
        groupedData.set(groupKey, {
          vendor_id: prDetail.vendor_id,
          delivery_date: deliveryDateStr,
          vendor_name: prDetail.vendor_name || prDetail.tb_vendor?.name || '',
          currency_id: prDetail.currency_id,
          currency_name: prDetail.currency_name || prDetail.tb_currency?.name || '',
          exchange_rate: Number(prDetail.exchange_rate) || 1,
          total_price: 0,
          base_price: 0,
          products: [],
          pr_set: new Set<string>(),
        });
      }

      const group = groupedData.get(groupKey);

      // Add product to the group
      group.products.push({
        product_id: prDetail.product_id || '',
        product_name: prDetail.product_name || prDetail.tb_product?.name || '',
        qty: Number(prDetail.approved_qty) || 0,
        price_per_unit: Number(prDetail.pricelist_price) || 0,
        total: Number(prDetail.total_price) || 0,
        base_total_price: Number(prDetail.base_total_price) || 0,
      });

      // Update totals
      group.total_price += Number(prDetail.total_price) || 0;
      group.base_price += Number(prDetail.base_total_price) || 0;

      // Track PR numbers
      const prNo = prDetail.tb_purchase_request?.pr_no;
      if (prNo) {
        group.pr_set.add(prNo);
      }
    }

    // Convert Map to array and add draft PO numbers
    const result: any[] = [];
    let draftCounter = 1;

    // Sort groups by vendor_name, then delivery_date
    const sortedGroups = Array.from(groupedData.values()).sort((a, b) => {
      const vendorCompare = (a.vendor_name || '').localeCompare(b.vendor_name || '');
      if (vendorCompare !== 0) return vendorCompare;
      return (a.delivery_date || '').localeCompare(b.delivery_date || '');
    });

    for (const group of sortedGroups) {
      // Convert pr_set to sorted array and remove from result
      const prArray = Array.from(group.pr_set).sort();
      delete group.pr_set;
      delete group.vendor_id;
      delete group.currency_id;

      result.push({
        po_no: `#${String(draftCounter).padStart(2, '0')}`,
        delivery_date: group.delivery_date,
        vendor_name: group.vendor_name,
        currency_name: group.currency_name,
        exchange_rate: group.exchange_rate,
        total_price: group.total_price,
        base_price: group.base_price,
        products: group.products,
        pr: prArray,
      });

      draftCounter++;
    }

    return Result.ok(result);
  }

  /**
   * Confirm PR and create PO(s)
   * Groups PR details by vendor_id -> delivery_date -> currency_id and creates POs
   */
  @TryCatch
  async confirmPrToPo(pr_ids: string[]): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'confirmPrToPo',
        pr_ids,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseOrderService.name,
    );

    if (!pr_ids || pr_ids.length === 0) {
      return Result.error('PR IDs are required', ErrorCode.INVALID_ARGUMENT);
    }

    // Fetch PR details with related data based on PR IDs
    const prDetails = await this.prismaService.tb_purchase_request_detail.findMany({
      where: {
        purchase_request_id: { in: pr_ids },
      },
      select: {
        id: true,
        purchase_request_id: true,
        sequence_no: true,
        delivery_date: true,
        location_id: true,
        location_code: true,
        location_name: true,
        delivery_point_id: true,
        delivery_point_name: true,
        product_id: true,
        product_name: true,
        product_local_name: true,
        inventory_unit_id: true,
        inventory_unit_name: true,
        description: true,
        vendor_id: true,
        vendor_name: true,
        pricelist_detail_id: true,
        pricelist_no: true,
        pricelist_unit: true,
        pricelist_price: true,
        currency_id: true,
        currency_name: true,
        exchange_rate: true,
        approved_qty: true,
        approved_unit_id: true,
        approved_unit_name: true,
        approved_unit_conversion_factor: true,
        approved_base_qty: true,
        tax_profile_id: true,
        tax_profile_name: true,
        tax_rate: true,
        tax_amount: true,
        base_tax_amount: true,
        is_tax_adjustment: true,
        discount_rate: true,
        discount_amount: true,
        base_discount_amount: true,
        is_discount_adjustment: true,
        sub_total_price: true,
        net_amount: true,
        total_price: true,
        base_price: true,
        base_sub_total_price: true,
        base_net_amount: true,
        base_total_price: true,
        foc_qty: true,
        tb_purchase_request: {
          select: {
            id: true,
            pr_no: true,
          },
        },
        tb_vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tb_currency: {
          select: {
            id: true,
            name: true,
            code: true,
            symbol: true,
          },
        },
      },
    });

    if (prDetails.length === 0) {
      return Result.error('No PR details found', ErrorCode.NOT_FOUND);
    }

    // Group by vendor_id -> delivery_date -> currency_id
    const groupedData = new Map<string, any>();

    for (const prDetail of prDetails) {
      if (!prDetail.vendor_id || !prDetail.currency_id) {
        continue;
      }

      const deliveryDateStr = prDetail.delivery_date
        ? format(new Date(prDetail.delivery_date), 'yyyy-MM-dd')
        : 'no-date';

      const groupKey = `${prDetail.vendor_id}|${deliveryDateStr}|${prDetail.currency_id}`;

      if (!groupedData.has(groupKey)) {
        // Ensure delivery_date is a valid Date object
        let deliveryDate: Date | null = null;
        if (prDetail.delivery_date) {
          deliveryDate = prDetail.delivery_date instanceof Date
            ? prDetail.delivery_date
            : new Date(prDetail.delivery_date);
        }

        groupedData.set(groupKey, {
          vendor_id: prDetail.vendor_id,
          vendor_name: prDetail.vendor_name || prDetail.tb_vendor?.name,
          delivery_date: deliveryDate,
          currency_id: prDetail.currency_id,
          currency_name: prDetail.currency_name || prDetail.tb_currency?.name,
          exchange_rate: Number(prDetail.exchange_rate) || 1,
          items: [],
          total_qty: 0,
          total_price: 0,
          total_tax: 0,
          total_amount: 0,
        });
      }

      const group = groupedData.get(groupKey);

      // Find existing item with same product_id
      const existingItem = group.items.find(
        (item: any) => item.product_id === prDetail.product_id,
      );

      if (existingItem) {
        existingItem.pr_details.push({
          pr_detail_id: prDetail.id,
          pr_id: prDetail.purchase_request_id,
          pr_no: prDetail.tb_purchase_request?.pr_no,
          order_qty: Number(prDetail.approved_qty) || 0,
          order_unit_id: prDetail.approved_unit_id,
          order_unit_name: prDetail.approved_unit_name,
          order_unit_conversion_factor: Number(prDetail.approved_unit_conversion_factor) || 1,
          order_base_qty: Number(prDetail.approved_base_qty) || 0,
          location_id: prDetail.location_id,
          location_name: prDetail.location_name,
        });

        existingItem.order_qty += Number(prDetail.approved_qty) || 0;
        existingItem.base_qty += Number(prDetail.approved_base_qty) || 0;
        existingItem.sub_total_price += Number(prDetail.sub_total_price) || 0;
        existingItem.tax_amount += Number(prDetail.tax_amount) || 0;
        existingItem.total_price += Number(prDetail.total_price) || 0;
      } else {
        group.items.push({
          sequence: group.items.length + 1,
          product_id: prDetail.product_id,
          product_name: prDetail.product_name,
          product_local_name: prDetail.product_local_name,
          order_unit_id: prDetail.approved_unit_id,
          order_unit_name: prDetail.approved_unit_name,
          order_unit_conversion_factor: Number(prDetail.approved_unit_conversion_factor) || 1,
          order_qty: Number(prDetail.approved_qty) || 0,
          base_unit_id: prDetail.inventory_unit_id,
          base_unit_name: prDetail.inventory_unit_name,
          base_qty: Number(prDetail.approved_base_qty) || 0,
          price: Number(prDetail.pricelist_price) || 0,
          sub_total_price: Number(prDetail.sub_total_price) || 0,
          net_amount: Number(prDetail.net_amount) || 0,
          total_price: Number(prDetail.total_price) || 0,
          tax_profile_id: prDetail.tax_profile_id,
          tax_profile_name: prDetail.tax_profile_name,
          tax_rate: Number(prDetail.tax_rate) || 0,
          tax_amount: Number(prDetail.tax_amount) || 0,
          is_tax_adjustment: prDetail.is_tax_adjustment || false,
          discount_rate: Number(prDetail.discount_rate) || 0,
          discount_amount: Number(prDetail.discount_amount) || 0,
          is_discount_adjustment: prDetail.is_discount_adjustment || false,
          is_foc: (Number(prDetail.foc_qty) || 0) > 0,
          pricelist_detail_id: prDetail.pricelist_detail_id,
          pricelist_no: prDetail.pricelist_no,
          pr_details: [
            {
              pr_detail_id: prDetail.id,
              pr_id: prDetail.purchase_request_id,
              pr_no: prDetail.tb_purchase_request?.pr_no,
              order_qty: Number(prDetail.approved_qty) || 0,
              order_unit_id: prDetail.approved_unit_id,
              order_unit_name: prDetail.approved_unit_name,
              order_unit_conversion_factor: Number(prDetail.approved_unit_conversion_factor) || 1,
              order_base_qty: Number(prDetail.approved_base_qty) || 0,
              location_id: prDetail.location_id,
              location_name: prDetail.location_name,
            },
          ],
        });
      }

      group.total_qty += Number(prDetail.approved_qty) || 0;
      group.total_price += Number(prDetail.sub_total_price) || 0;
      group.total_tax += Number(prDetail.tax_amount) || 0;
      group.total_amount += Number(prDetail.total_price) || 0;
    }

    const groups = Array.from(groupedData.values());

    if (groups.length === 0) {
      return Result.error('No valid PR details found for PO creation (missing vendor or currency)', ErrorCode.INVALID_ARGUMENT);
    }

    // Create POs from grouped data
    const createdPOs: any[] = [];

    await this.prismaService.$transaction(async (prismatx) => {
        for (const group of groups) {
          // Generate PO number
          const orderDate = new Date();
          const poNo = await this.generatePONo(orderDate.toISOString());

          // Create PO header
          const po = await prismatx.tb_purchase_order.create({
            data: {
              po_no: poNo,
              po_status: enum_purchase_order_doc_status.draft,
              description: `PO from PR confirmation`,
              order_date: orderDate.toISOString(),
              delivery_date: group.delivery_date instanceof Date ? group.delivery_date.toISOString() : orderDate.toISOString(),
              vendor_id: group.vendor_id,
              vendor_name: group.vendor_name,
              currency_id: group.currency_id,
              currency_name: group.currency_name,
              exchange_rate: group.exchange_rate,
              total_qty: group.total_qty,
              total_price: group.total_price,
              total_tax: group.total_tax,
              total_amount: group.total_amount,
              is_active: true,
              doc_version: 1,
              created_by_id: this.userId,
            },
          });

          // Create PO details
          for (const item of group.items) {
            const poDetail = await prismatx.tb_purchase_order_detail.create({
              data: {
                purchase_order_id: po.id,
                sequence_no: item.sequence,
                description: item.product_name,
                order_qty: item.order_qty,
                order_unit_id: item.order_unit_id || undefined,
                order_unit_name: item.order_unit_name,
                order_unit_conversion_factor: item.order_unit_conversion_factor,
                base_qty: item.base_qty,
                base_unit_id: item.base_unit_id || undefined,
                base_unit_name: item.base_unit_name,
                is_foc: item.is_foc || false,
                price: item.price,
                sub_total_price: item.sub_total_price,
                net_amount: item.net_amount,
                total_price: item.total_price,
                tax_profile_id: item.tax_profile_id || undefined,
                tax_profile_name: item.tax_profile_name,
                tax_rate: item.tax_rate,
                tax_amount: item.tax_amount,
                is_tax_adjustment: item.is_tax_adjustment,
                discount_rate: item.discount_rate,
                discount_amount: item.discount_amount,
                is_discount_adjustment: item.is_discount_adjustment,
                info: {
                  product_id: item.product_id,
                  product_name: item.product_name,
                  product_local_name: item.product_local_name,
                  pricelist_detail_id: item.pricelist_detail_id,
                  pricelist_no: item.pricelist_no,
                },
                is_active: true,
                doc_version: 1,
                created_by_id: this.userId,
              },
            });

            // Create PR detail linkages
            for (const prDetail of item.pr_details) {
              // Skip if required fields are missing
              if (!prDetail.pr_detail_id || !prDetail.order_unit_id) {
                continue;
              }
              await prismatx.tb_purchase_order_detail_tb_purchase_request_detail.create({
                data: {
                  po_detail_id: poDetail.id,
                  pr_detail_id: prDetail.pr_detail_id,
                  pr_detail_order_unit_id: prDetail.order_unit_id,
                  pr_detail_order_unit_name: prDetail.order_unit_name || '',
                  pr_detail_qty: prDetail.order_qty,
                  pr_detail_base_qty: prDetail.order_base_qty,
                  pr_detail_base_unit_id: prDetail.order_base_unit_id || undefined,
                  pr_detail_base_unit_name: prDetail.order_base_unit_name,
                  created_by_id: this.userId,
                },
              });
            }
          }

          createdPOs.push({
            id: po.id,
            po_no: po.po_no,
            vendor_id: po.vendor_id,
            vendor_name: po.vendor_name,
            delivery_date: po.delivery_date,
            currency_id: po.currency_id,
            currency_name: po.currency_name,
            total_qty: Number(po.total_qty),
            total_price: Number(po.total_price),
            total_tax: Number(po.total_tax),
            total_amount: Number(po.total_amount),
            items_count: group.items.length,
          });
        }

        // Update PR status to completed after creating all POs
        await prismatx.tb_purchase_request.updateMany({
          where: {
            id: { in: pr_ids },
          },
          data: {
            pr_status: enum_purchase_request_doc_status.completed,
            updated_by_id: this.userId,
            updated_at: new Date(),
          },
        });
      });

    // Send notifications for PO creation from PR confirmation
    this.sendPOFromPRNotification(createdPOs, prDetails);

    return Result.ok({
      purchase_orders: createdPOs,
      summary: {
        total_pos_created: createdPOs.length,
        total_prs_processed: pr_ids.length,
        total_pr_details_processed: prDetails.length,
      },
    });
  }

  /**
   * Send notification when PO is created
   */
  private async sendPOCreatedNotification(
    purchaseOrder: any,
    data: ICreatePurchaseOrder,
  ): Promise<void> {
    try {
      const poNo = purchaseOrder.po_no;
      const buyerId = data.buyer_id;

      // Notify buyer if specified
      if (buyerId) {
        await this.notificationService.sendPONotification(
          buyerId,
          `Purchase Order Created: ${poNo}`,
          `A new Purchase Order ${poNo} has been created for vendor ${data.vendor_name || 'N/A'}.`,
          {
            po_id: purchaseOrder.id,
            po_no: poNo,
            vendor_id: data.vendor_id,
            vendor_name: data.vendor_name,
            action: 'created',
          },
          this.userId,
        );
      }

      this.logger.log(`Notification sent for PO ${poNo} creation`);
    } catch (error) {
      this.logger.error('Failed to send PO created notification:', error);
    }
  }

  /**
   * Send notification when POs are created from PR confirmation
   */
  private async sendPOFromPRNotification(
    createdPOs: any[],
    prDetails: any[],
  ): Promise<void> {
    try {
      // Collect unique PR requestor IDs
      const prRequestorMap = new Map<string, Set<string>>();

      for (const prDetail of prDetails) {
        const prId = prDetail.purchase_request_id;
        const prNo = prDetail.tb_purchase_request?.pr_no;

        if (prId && prNo) {
          if (!prRequestorMap.has(prId)) {
            prRequestorMap.set(prId, new Set());
          }
        }
      }

      // Get PR requestors from database
      const prIds = Array.from(prRequestorMap.keys());
      if (prIds.length > 0) {
        const prs = await this.prismaService.tb_purchase_request.findMany({
          where: { id: { in: prIds } },
          select: {
            id: true,
            pr_no: true,
            requestor_id: true,
            requestor_name: true,
          },
        });

        // Notify each PR requestor
        const notifiedUsers = new Set<string>();
        for (const pr of prs) {
          if (pr.requestor_id && !notifiedUsers.has(pr.requestor_id)) {
            notifiedUsers.add(pr.requestor_id);

            const poNumbers = createdPOs.map((po) => po.po_no).join(', ');

            await this.notificationService.sendPONotification(
              pr.requestor_id,
              `Purchase Orders Created from PR: ${pr.pr_no}`,
              `${createdPOs.length} Purchase Order(s) have been created from your Purchase Request ${pr.pr_no}: ${poNumbers}`,
              {
                pr_id: pr.id,
                pr_no: pr.pr_no,
                po_ids: createdPOs.map((po) => po.id),
                po_numbers: createdPOs.map((po) => po.po_no),
                action: 'pr_to_po_confirmed',
              },
              this.userId,
            );
          }
        }

        this.logger.log(
          `Notification sent to ${notifiedUsers.size} requestor(s) for ${createdPOs.length} PO(s) creation`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to send PO from PR notification:', error);
    }
  }

  /**
   * Export Purchase Order to Excel format
   */
  @TryCatch
  async exportToExcel(id: string): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      { function: 'exportToExcel', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Fetch the purchase order with all details
    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        po_no: true,
        po_status: true,
        description: true,
        order_date: true,
        delivery_date: true,
        vendor_id: true,
        vendor_name: true,
        currency_id: true,
        currency_name: true,
        exchange_rate: true,
        approval_date: true,
        email: true,
        buyer_id: true,
        buyer_name: true,
        credit_term_id: true,
        credit_term_name: true,
        credit_term_value: true,
        remarks: true,
        total_qty: true,
        total_price: true,
        total_tax: true,
        total_amount: true,
        note: true,
        created_at: true,
        tb_vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tb_currency_tb_purchase_order_currency_idTotb_currency: {
          select: {
            id: true,
            name: true,
            code: true,
            symbol: true,
          },
        },
        tb_credit_term: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
        tb_purchase_order_detail: {
          select: {
            id: true,
            sequence_no: true,
            description: true,
            order_qty: true,
            order_unit_id: true,
            order_unit_name: true,
            base_qty: true,
            base_unit_id: true,
            base_unit_name: true,
            is_foc: true,
            tax_profile_id: true,
            tax_profile_name: true,
            tax_rate: true,
            tax_amount: true,
            discount_rate: true,
            discount_amount: true,
            price: true,
            sub_total_price: true,
            net_amount: true,
            total_price: true,
            received_qty: true,
            cancelled_qty: true,
            note: true,
            info: true,
          },
          orderBy: {
            sequence_no: 'asc',
          },
        },
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Carmen System';
    workbook.created = new Date();

    // Create worksheet
    const worksheet = workbook.addWorksheet('Purchase Order');

    // Define header styles
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      },
    };

    const titleStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, size: 16 },
      alignment: { horizontal: 'center' },
    };

    const labelStyle: Partial<ExcelJS.Style> = {
      font: { bold: true },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' },
      },
    };

    // Set column widths
    worksheet.columns = [
      { width: 5 },   // A - No.
      { width: 35 },  // B - Description/Product
      { width: 12 },  // C - Qty
      { width: 12 },  // D - Unit
      { width: 15 },  // E - Unit Price
      { width: 15 },  // F - Sub Total
      { width: 12 },  // G - Tax %
      { width: 15 },  // H - Tax Amount
      { width: 15 },  // I - Total
    ];

    // Add title
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'PURCHASE ORDER';
    titleCell.style = titleStyle;
    worksheet.getRow(1).height = 30;

    // Add PO header information
    let currentRow = 3;

    // PO Number and Status
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'PO Number:';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`C${currentRow}:E${currentRow}`);
    worksheet.getCell(`C${currentRow}`).value = purchaseOrder.po_no || '';

    worksheet.getCell(`F${currentRow}`).value = 'Status:';
    worksheet.getCell(`F${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`G${currentRow}:I${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = purchaseOrder.po_status || '';

    currentRow++;

    // Vendor and Order Date
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'Vendor:';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`C${currentRow}:E${currentRow}`);
    worksheet.getCell(`C${currentRow}`).value = purchaseOrder.vendor_name || purchaseOrder.tb_vendor?.name || '';

    worksheet.getCell(`F${currentRow}`).value = 'Order Date:';
    worksheet.getCell(`F${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`G${currentRow}:I${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = purchaseOrder.order_date
      ? format(new Date(purchaseOrder.order_date), 'dd/MM/yyyy')
      : '';

    currentRow++;

    // Currency and Delivery Date
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'Currency:';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`C${currentRow}:E${currentRow}`);
    const currency = purchaseOrder.tb_currency_tb_purchase_order_currency_idTotb_currency;
    worksheet.getCell(`C${currentRow}`).value = currency
      ? `${currency.name} (${currency.code})`
      : purchaseOrder.currency_name || '';

    worksheet.getCell(`F${currentRow}`).value = 'Delivery Date:';
    worksheet.getCell(`F${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`G${currentRow}:I${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = purchaseOrder.delivery_date
      ? format(new Date(purchaseOrder.delivery_date), 'dd/MM/yyyy')
      : '';

    currentRow++;

    // Buyer and Credit Term
    worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
    worksheet.getCell(`A${currentRow}`).value = 'Buyer:';
    worksheet.getCell(`A${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`C${currentRow}:E${currentRow}`);
    worksheet.getCell(`C${currentRow}`).value = purchaseOrder.buyer_name || '';

    worksheet.getCell(`F${currentRow}`).value = 'Credit Term:';
    worksheet.getCell(`F${currentRow}`).style = labelStyle;
    worksheet.mergeCells(`G${currentRow}:I${currentRow}`);
    worksheet.getCell(`G${currentRow}`).value = purchaseOrder.credit_term_name || '';

    currentRow++;

    // Description
    if (purchaseOrder.description) {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'Description:';
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      worksheet.mergeCells(`C${currentRow}:I${currentRow}`);
      worksheet.getCell(`C${currentRow}`).value = purchaseOrder.description;
      currentRow++;
    }

    // Add empty row before details
    currentRow++;

    // Add detail table header
    const headerRow = currentRow;
    const headers = ['No.', 'Description', 'Qty', 'Unit', 'Unit Price', 'Sub Total', 'Tax %', 'Tax Amount', 'Total'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(headerRow, index + 1);
      cell.value = header;
      cell.style = headerStyle;
    });
    worksheet.getRow(headerRow).height = 25;

    currentRow++;

    // Add detail rows
    const currencySymbol = currency?.symbol || '';
    purchaseOrder.tb_purchase_order_detail.forEach((detail, index) => {
      const info = detail.info as any;
      const productName = info?.product_name || detail.description || '';

      worksheet.getCell(currentRow, 1).value = index + 1;
      worksheet.getCell(currentRow, 1).alignment = { horizontal: 'center' };

      worksheet.getCell(currentRow, 2).value = productName;

      worksheet.getCell(currentRow, 3).value = Number(detail.order_qty) || 0;
      worksheet.getCell(currentRow, 3).numFmt = '#,##0.00';
      worksheet.getCell(currentRow, 3).alignment = { horizontal: 'right' };

      worksheet.getCell(currentRow, 4).value = detail.order_unit_name || '';
      worksheet.getCell(currentRow, 4).alignment = { horizontal: 'center' };

      worksheet.getCell(currentRow, 5).value = Number(detail.price) || 0;
      worksheet.getCell(currentRow, 5).numFmt = '#,##0.00';
      worksheet.getCell(currentRow, 5).alignment = { horizontal: 'right' };

      worksheet.getCell(currentRow, 6).value = Number(detail.sub_total_price) || 0;
      worksheet.getCell(currentRow, 6).numFmt = '#,##0.00';
      worksheet.getCell(currentRow, 6).alignment = { horizontal: 'right' };

      worksheet.getCell(currentRow, 7).value = Number(detail.tax_rate) || 0;
      worksheet.getCell(currentRow, 7).numFmt = '0.00%';
      worksheet.getCell(currentRow, 7).alignment = { horizontal: 'right' };

      worksheet.getCell(currentRow, 8).value = Number(detail.tax_amount) || 0;
      worksheet.getCell(currentRow, 8).numFmt = '#,##0.00';
      worksheet.getCell(currentRow, 8).alignment = { horizontal: 'right' };

      worksheet.getCell(currentRow, 9).value = Number(detail.total_price) || 0;
      worksheet.getCell(currentRow, 9).numFmt = '#,##0.00';
      worksheet.getCell(currentRow, 9).alignment = { horizontal: 'right' };

      // Add borders to detail rows
      for (let col = 1; col <= 9; col++) {
        worksheet.getCell(currentRow, col).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      currentRow++;
    });

    // Add totals section
    currentRow++;

    // Sub Total
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    worksheet.getCell(`H${currentRow}`).value = 'Sub Total:';
    worksheet.getCell(`H${currentRow}`).style = labelStyle;
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`I${currentRow}`).value = Number(purchaseOrder.total_price) || 0;
    worksheet.getCell(`I${currentRow}`).numFmt = '#,##0.00';
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'right' };

    currentRow++;

    // Total Tax
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    worksheet.getCell(`H${currentRow}`).value = 'Total Tax:';
    worksheet.getCell(`H${currentRow}`).style = labelStyle;
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`I${currentRow}`).value = Number(purchaseOrder.total_tax) || 0;
    worksheet.getCell(`I${currentRow}`).numFmt = '#,##0.00';
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'right' };

    currentRow++;

    // Grand Total
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    worksheet.getCell(`H${currentRow}`).value = 'Grand Total:';
    worksheet.getCell(`H${currentRow}`).font = { bold: true, size: 12 };
    worksheet.getCell(`H${currentRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getCell(`H${currentRow}`).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getCell(`H${currentRow}`).alignment = { horizontal: 'right' };
    worksheet.getCell(`I${currentRow}`).value = Number(purchaseOrder.total_amount) || 0;
    worksheet.getCell(`I${currentRow}`).numFmt = '#,##0.00';
    worksheet.getCell(`I${currentRow}`).font = { bold: true };
    worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'right' };

    // Add remarks if present
    if (purchaseOrder.remarks) {
      currentRow += 2;
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      worksheet.getCell(`A${currentRow}`).value = 'Remarks:';
      worksheet.getCell(`A${currentRow}`).style = labelStyle;
      worksheet.mergeCells(`C${currentRow}:I${currentRow}`);
      worksheet.getCell(`C${currentRow}`).value = purchaseOrder.remarks;
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generate filename
    const poNo = purchaseOrder.po_no?.replace(/[^a-zA-Z0-9]/g, '_') || 'PO';
    const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `${poNo}_${dateStr}.xlsx`;

    return Result.ok({
      buffer: Buffer.from(buffer),
      filename,
    });
  }

  /**
   * Print Purchase Order to PDF format
   */
  @TryCatch
  async printToPdf(id: string): Promise<Result<{ buffer: Buffer; filename: string }>> {
    this.logger.debug(
      { function: 'printToPdf', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Fetch the purchase order with all details
    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        po_no: true,
        po_status: true,
        description: true,
        order_date: true,
        delivery_date: true,
        vendor_id: true,
        vendor_name: true,
        currency_id: true,
        currency_name: true,
        exchange_rate: true,
        approval_date: true,
        email: true,
        buyer_id: true,
        buyer_name: true,
        credit_term_id: true,
        credit_term_name: true,
        credit_term_value: true,
        remarks: true,
        total_qty: true,
        total_price: true,
        total_tax: true,
        total_amount: true,
        note: true,
        created_at: true,
        tb_vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        tb_currency_tb_purchase_order_currency_idTotb_currency: {
          select: {
            id: true,
            name: true,
            code: true,
            symbol: true,
          },
        },
        tb_credit_term: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
        tb_purchase_order_detail: {
          select: {
            id: true,
            sequence_no: true,
            description: true,
            order_qty: true,
            order_unit_id: true,
            order_unit_name: true,
            base_qty: true,
            base_unit_id: true,
            base_unit_name: true,
            is_foc: true,
            tax_profile_id: true,
            tax_profile_name: true,
            tax_rate: true,
            tax_amount: true,
            discount_rate: true,
            discount_amount: true,
            price: true,
            sub_total_price: true,
            net_amount: true,
            total_price: true,
            received_qty: true,
            cancelled_qty: true,
            note: true,
            info: true,
          },
          orderBy: {
            sequence_no: 'asc',
          },
        },
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    const currency = purchaseOrder.tb_currency_tb_purchase_order_currency_idTotb_currency;
    const currencySymbol = currency?.symbol || '';
    const currencyCode = currency?.code || purchaseOrder.currency_name || '';

    // Format number with thousand separator
    const formatNumber = (num: number): string => {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Build detail table rows
    const tableBody: TableCell[][] = [
      // Header row
      [
        { text: 'No.', style: 'tableHeader', alignment: 'center' },
        { text: 'Description', style: 'tableHeader' },
        { text: 'Qty', style: 'tableHeader', alignment: 'right' },
        { text: 'Unit', style: 'tableHeader', alignment: 'center' },
        { text: 'Unit Price', style: 'tableHeader', alignment: 'right' },
        { text: 'Tax %', style: 'tableHeader', alignment: 'right' },
        { text: 'Total', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    // Add detail rows
    purchaseOrder.tb_purchase_order_detail.forEach((detail, index) => {
      const info = detail.info as any;
      const productName = info?.product_name || detail.description || '';

      tableBody.push([
        { text: (index + 1).toString(), alignment: 'center' },
        { text: productName },
        { text: formatNumber(Number(detail.order_qty) || 0), alignment: 'right' },
        { text: detail.order_unit_name || '', alignment: 'center' },
        { text: formatNumber(Number(detail.price) || 0), alignment: 'right' },
        { text: `${Number(detail.tax_rate) || 0}%`, alignment: 'right' },
        { text: formatNumber(Number(detail.total_price) || 0), alignment: 'right' },
      ]);
    });

    // Build document definition
    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: [
        // Title
        {
          text: 'PURCHASE ORDER',
          style: 'title',
          alignment: 'center',
          margin: [0, 0, 0, 20],
        },

        // Header info - two columns
        {
          columns: [
            {
              width: '50%',
              stack: [
                { text: [{ text: 'PO Number: ', bold: true }, purchaseOrder.po_no || ''] },
                { text: [{ text: 'Vendor: ', bold: true }, purchaseOrder.vendor_name || purchaseOrder.tb_vendor?.name || ''] },
                { text: [{ text: 'Currency: ', bold: true }, currencyCode] },
                { text: [{ text: 'Buyer: ', bold: true }, purchaseOrder.buyer_name || ''] },
              ],
            },
            {
              width: '50%',
              stack: [
                { text: [{ text: 'Status: ', bold: true }, purchaseOrder.po_status || ''] },
                { text: [{ text: 'Order Date: ', bold: true }, purchaseOrder.order_date ? format(new Date(purchaseOrder.order_date), 'dd/MM/yyyy') : ''] },
                { text: [{ text: 'Delivery Date: ', bold: true }, purchaseOrder.delivery_date ? format(new Date(purchaseOrder.delivery_date), 'dd/MM/yyyy') : ''] },
                { text: [{ text: 'Credit Term: ', bold: true }, purchaseOrder.credit_term_name || ''] },
              ],
            },
          ],
          margin: [0, 0, 0, 10],
        },

        // Description
        ...(purchaseOrder.description
          ? [
              {
                text: [{ text: 'Description: ', bold: true }, purchaseOrder.description],
                margin: [0, 0, 0, 15] as [number, number, number, number],
              } as Content,
            ]
          : []),

        // Detail table
        {
          table: {
            headerRows: 1,
            widths: [30, '*', 50, 40, 70, 40, 70],
            body: tableBody,
          },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#aaaaaa',
            vLineColor: () => '#aaaaaa',
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#4472C4' : null),
          },
          margin: [0, 0, 0, 15],
        },

        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 200,
              table: {
                widths: ['*', 80],
                body: [
                  [
                    { text: 'Sub Total:', alignment: 'right', bold: true },
                    { text: `${currencySymbol} ${formatNumber(Number(purchaseOrder.total_price) || 0)}`, alignment: 'right' },
                  ],
                  [
                    { text: 'Total Tax:', alignment: 'right', bold: true },
                    { text: `${currencySymbol} ${formatNumber(Number(purchaseOrder.total_tax) || 0)}`, alignment: 'right' },
                  ],
                  [
                    { text: 'Grand Total:', alignment: 'right', bold: true, fillColor: '#4472C4', color: 'white' },
                    { text: `${currencySymbol} ${formatNumber(Number(purchaseOrder.total_amount) || 0)}`, alignment: 'right', bold: true, fillColor: '#4472C4', color: 'white' },
                  ],
                ],
              },
              layout: {
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#aaaaaa',
                vLineColor: () => '#aaaaaa',
              },
            },
          ],
        },

        // Remarks
        ...(purchaseOrder.remarks
          ? [
              {
                text: [{ text: 'Remarks: ', bold: true }, purchaseOrder.remarks],
                margin: [0, 20, 0, 0] as [number, number, number, number],
              } as Content,
            ]
          : []),
      ],

      styles: {
        title: {
          fontSize: 18,
          bold: true,
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: 'white',
        },
      },

      defaultStyle: {
        fontSize: 10,
      },
    };

    // Generate PDF buffer
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        // Use pdfmake's createPdf with virtual file system
        const PdfMake = require('pdfmake/build/pdfmake');
        const vfsFonts = require('pdfmake/build/vfs_fonts');
        PdfMake.vfs = vfsFonts.pdfMake ? vfsFonts.pdfMake.vfs : vfsFonts.vfs;

        const pdfDocGenerator = PdfMake.createPdf(docDefinition);
        pdfDocGenerator.getBuffer((buffer: Buffer) => {
          resolve(buffer);
        });
      } catch (error) {
        reject(error);
      }
    });

    // Generate filename
    const poNo = purchaseOrder.po_no?.replace(/[^a-zA-Z0-9]/g, '_') || 'PO';
    const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
    const filename = `${poNo}_${dateStr}.pdf`;

    return Result.ok({
      buffer: pdfBuffer,
      filename,
    });
  }

  // ==================== Purchase Order Detail CRUD ====================

  /**
   * Get a single Purchase Order Detail by ID
   */
  @TryCatch
  async findDetailById(detailId: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const detail = await this.prismaService.tb_purchase_order_detail.findFirst({
      where: {
        id: detailId,
        deleted_at: null,
      },
      include: {
        tb_purchase_order: {
          select: {
            id: true,
            po_no: true,
            po_status: true,
            vendor_name: true,
            currency_name: true,
          },
        },
        tb_unit_tb_purchase_order_detail_order_unit_idTotb_unit: {
          select: {
            id: true,
            name: true,
          },
        },
        tb_unit_tb_purchase_order_detail_base_unit_idTotb_unit: {
          select: {
            id: true,
            name: true,
          },
        },
        tb_tax_profile: {
          select: {
            id: true,
            name: true,
          },
        },
        tb_purchase_order_detail_tb_purchase_request_detail: {
          select: {
            id: true,
            pr_detail_id: true,
            pr_detail_qty: true,
            pr_detail_order_unit_id: true,
            pr_detail_order_unit_name: true,
          },
        },
      },
    });

    if (!detail) {
      return Result.error('Purchase order detail not found', ErrorCode.NOT_FOUND);
    }

    // Convert decimal fields to numbers
    const result = {
      ...detail,
      order_qty: Number(detail.order_qty),
      order_unit_conversion_factor: Number(detail.order_unit_conversion_factor),
      base_qty: Number(detail.base_qty),
      price: Number(detail.price),
      sub_total_price: Number(detail.sub_total_price),
      net_amount: Number(detail.net_amount),
      total_price: Number(detail.total_price),
      base_price: Number(detail.base_price),
      base_sub_total_price: Number(detail.base_sub_total_price),
      base_net_amount: Number(detail.base_net_amount),
      base_total_price: Number(detail.base_total_price),
      tax_rate: Number(detail.tax_rate),
      tax_amount: Number(detail.tax_amount),
      base_tax_amount: Number(detail.base_tax_amount),
      discount_rate: Number(detail.discount_rate),
      discount_amount: Number(detail.discount_amount),
      base_discount_amount: Number(detail.base_discount_amount),
      received_qty: Number(detail.received_qty),
      cancelled_qty: Number(detail.cancelled_qty),
    };

    return Result.ok(result);
  }

  /**
   * Get all Purchase Order Details by Purchase Order ID
   */
  @TryCatch
  async findDetailsByPurchaseOrderId(purchaseOrderId: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findDetailsByPurchaseOrderId', purchaseOrderId, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Verify PO exists
    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: purchaseOrderId,
        deleted_at: null,
      },
      select: {
        id: true,
        po_no: true,
        po_status: true,
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    const details = await this.prismaService.tb_purchase_order_detail.findMany({
      where: {
        purchase_order_id: purchaseOrderId,
        deleted_at: null,
      },
      orderBy: {
        sequence_no: 'asc',
      },
      include: {
        tb_unit_tb_purchase_order_detail_order_unit_idTotb_unit: {
          select: {
            id: true,
            name: true,
          },
        },
        tb_unit_tb_purchase_order_detail_base_unit_idTotb_unit: {
          select: {
            id: true,
            name: true,
          },
        },
        tb_tax_profile: {
          select: {
            id: true,
            name: true,
          },
        },
        tb_purchase_order_detail_tb_purchase_request_detail: {
          select: {
            id: true,
            pr_detail_id: true,
            pr_detail_qty: true,
            pr_detail_order_unit_id: true,
            pr_detail_order_unit_name: true,
          },
        },
      },
    });

    // Convert decimal fields to numbers
    const results = details.map((detail) => ({
      ...detail,
      order_qty: Number(detail.order_qty),
      order_unit_conversion_factor: Number(detail.order_unit_conversion_factor),
      base_qty: Number(detail.base_qty),
      price: Number(detail.price),
      sub_total_price: Number(detail.sub_total_price),
      net_amount: Number(detail.net_amount),
      total_price: Number(detail.total_price),
      base_price: Number(detail.base_price),
      base_sub_total_price: Number(detail.base_sub_total_price),
      base_net_amount: Number(detail.base_net_amount),
      base_total_price: Number(detail.base_total_price),
      tax_rate: Number(detail.tax_rate),
      tax_amount: Number(detail.tax_amount),
      base_tax_amount: Number(detail.base_tax_amount),
      discount_rate: Number(detail.discount_rate),
      discount_amount: Number(detail.discount_amount),
      base_discount_amount: Number(detail.base_discount_amount),
      received_qty: Number(detail.received_qty),
      cancelled_qty: Number(detail.cancelled_qty),
    }));

    return Result.ok({
      purchase_order: purchaseOrder,
      details: results,
    });
  }

  /**
   * Create a new Purchase Order Detail
   */
  @TryCatch
  async createDetail(purchaseOrderId: string, detailData: IPurchaseOrderDetail): Promise<Result<any>> {
    this.logger.debug(
      { function: 'createDetail', purchaseOrderId, detailData, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Verify PO exists and is editable
    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: purchaseOrderId,
        deleted_at: null,
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    if (purchaseOrder.po_status !== enum_purchase_order_doc_status.draft) {
      return Result.error('Cannot add detail to non-draft purchase order', ErrorCode.INVALID_ARGUMENT);
    }

    // Get next sequence number
    const lastDetail = await this.prismaService.tb_purchase_order_detail.findFirst({
      where: {
        purchase_order_id: purchaseOrderId,
        deleted_at: null,
      },
      orderBy: {
        sequence_no: 'desc',
      },
      select: {
        sequence_no: true,
      },
    });

    const nextSequenceNo = (lastDetail?.sequence_no || 0) + 1;

    const tx = await this.prismaService.$transaction(async (prisma) => {
      // Create detail
      const newDetail = await prisma.tb_purchase_order_detail.create({
        data: {
          purchase_order_id: purchaseOrderId,
          sequence_no: nextSequenceNo,
          description: detailData.description,
          order_qty: detailData.order_qty || 0,
          order_unit_id: detailData.order_unit_id,
          order_unit_name: detailData.order_unit_name,
          order_unit_conversion_factor: detailData.order_unit_conversion_factor || 1,
          base_qty: detailData.base_qty || 0,
          base_unit_id: detailData.base_unit_id,
          base_unit_name: detailData.base_unit_name,
          is_foc: detailData.is_foc || false,
          tax_profile_id: detailData.tax_profile_id,
          tax_profile_name: detailData.tax_profile_name,
          tax_rate: detailData.tax_rate || 0,
          tax_amount: detailData.tax_amount || 0,
          base_tax_amount: detailData.base_tax_amount || 0,
          is_tax_adjustment: detailData.is_tax_adjustment || false,
          discount_rate: detailData.discount_rate || 0,
          discount_amount: detailData.discount_amount || 0,
          base_discount_amount: detailData.base_discount_amount || 0,
          is_discount_adjustment: detailData.is_discount_adjustment || false,
          price: detailData.price || 0,
          sub_total_price: detailData.sub_total_price || 0,
          net_amount: detailData.net_amount || 0,
          total_price: detailData.total_price || 0,
          base_sub_total_price: detailData.base_sub_total_price || 0,
          base_net_amount: detailData.base_net_amount || 0,
          base_total_price: detailData.base_total_price || 0,
          note: detailData.note,
          info: detailData.info || {
            product_id: detailData.product_id,
            product_name: detailData.product_name,
            product_local_name: detailData.product_local_name,
          },
          created_by_id: this.userId,
        },
      });

      // Update PO totals
      await this.updatePurchaseOrderTotals(prisma, purchaseOrderId);

      return newDetail;
    });

    return Result.ok({ id: tx.id });
  }

  /**
   * Update a Purchase Order Detail
   */
  @TryCatch
  async updateDetail(detailId: string, detailData: Partial<IPurchaseOrderDetail>): Promise<Result<any>> {
    this.logger.debug(
      { function: 'updateDetail', detailId, detailData, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Find detail with PO
    const existingDetail = await this.prismaService.tb_purchase_order_detail.findFirst({
      where: {
        id: detailId,
        deleted_at: null,
      },
      include: {
        tb_purchase_order: true,
      },
    });

    if (!existingDetail) {
      return Result.error('Purchase order detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_purchase_order?.po_status !== enum_purchase_order_doc_status.draft) {
      return Result.error('Cannot update detail of non-draft purchase order', ErrorCode.INVALID_ARGUMENT);
    }

    const tx = await this.prismaService.$transaction(async (prisma) => {
      // Build update info object
      const currentInfo = existingDetail.info as any || {};
      const updatedInfo = {
        ...currentInfo,
        ...(detailData.product_id && { product_id: detailData.product_id }),
        ...(detailData.product_name && { product_name: detailData.product_name }),
        ...(detailData.product_local_name && { product_local_name: detailData.product_local_name }),
      };

      // Update detail
      const updatedDetail = await prisma.tb_purchase_order_detail.update({
        where: { id: detailId },
        data: {
          description: detailData.description ?? existingDetail.description,
          sequence_no: detailData.sequence_no ?? existingDetail.sequence_no,
          order_qty: detailData.order_qty ?? existingDetail.order_qty,
          order_unit_id: detailData.order_unit_id ?? existingDetail.order_unit_id,
          order_unit_name: detailData.order_unit_name ?? existingDetail.order_unit_name,
          order_unit_conversion_factor: detailData.order_unit_conversion_factor ?? existingDetail.order_unit_conversion_factor,
          base_qty: detailData.base_qty ?? existingDetail.base_qty,
          base_unit_id: detailData.base_unit_id ?? existingDetail.base_unit_id,
          base_unit_name: detailData.base_unit_name ?? existingDetail.base_unit_name,
          is_foc: detailData.is_foc ?? existingDetail.is_foc,
          tax_profile_id: detailData.tax_profile_id ?? existingDetail.tax_profile_id,
          tax_profile_name: detailData.tax_profile_name ?? existingDetail.tax_profile_name,
          tax_rate: detailData.tax_rate ?? existingDetail.tax_rate,
          tax_amount: detailData.tax_amount ?? existingDetail.tax_amount,
          base_tax_amount: detailData.base_tax_amount ?? existingDetail.base_tax_amount,
          is_tax_adjustment: detailData.is_tax_adjustment ?? existingDetail.is_tax_adjustment,
          discount_rate: detailData.discount_rate ?? existingDetail.discount_rate,
          discount_amount: detailData.discount_amount ?? existingDetail.discount_amount,
          base_discount_amount: detailData.base_discount_amount ?? existingDetail.base_discount_amount,
          is_discount_adjustment: detailData.is_discount_adjustment ?? existingDetail.is_discount_adjustment,
          price: detailData.price ?? existingDetail.price,
          sub_total_price: detailData.sub_total_price ?? existingDetail.sub_total_price,
          net_amount: detailData.net_amount ?? existingDetail.net_amount,
          total_price: detailData.total_price ?? existingDetail.total_price,
          base_sub_total_price: detailData.base_sub_total_price ?? existingDetail.base_sub_total_price,
          base_net_amount: detailData.base_net_amount ?? existingDetail.base_net_amount,
          base_total_price: detailData.base_total_price ?? existingDetail.base_total_price,
          note: detailData.note ?? existingDetail.note,
          info: updatedInfo,
          doc_version: { increment: 1 },
          updated_by_id: this.userId,
        },
      });

      // Update PO totals
      await this.updatePurchaseOrderTotals(prisma, existingDetail.purchase_order_id);

      return updatedDetail;
    });

    return Result.ok({ id: tx.id });
  }

  /**
   * Delete a Purchase Order Detail
   */
  @TryCatch
  async deleteDetail(detailId: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'deleteDetail', detailId, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Find detail with PO
    const existingDetail = await this.prismaService.tb_purchase_order_detail.findFirst({
      where: {
        id: detailId,
        deleted_at: null,
      },
      include: {
        tb_purchase_order: true,
      },
    });

    if (!existingDetail) {
      return Result.error('Purchase order detail not found', ErrorCode.NOT_FOUND);
    }

    if (existingDetail.tb_purchase_order?.po_status !== enum_purchase_order_doc_status.draft) {
      return Result.error('Cannot delete detail of non-draft purchase order', ErrorCode.INVALID_ARGUMENT);
    }

    const tx = await this.prismaService.$transaction(async (prisma) => {
      // Soft delete - set deleted_at
      await prisma.tb_purchase_order_detail.update({
        where: { id: detailId },
        data: {
          deleted_at: new Date(),
          deleted_by_id: this.userId,
        },
      });

      // Update PO totals
      await this.updatePurchaseOrderTotals(prisma, existingDetail.purchase_order_id);

      return { id: detailId };
    });

    return Result.ok(tx);
  }

  /**
   * Helper method to update Purchase Order totals after detail changes
   */
  private async updatePurchaseOrderTotals(prisma: any, purchaseOrderId: string): Promise<void> {
    // Calculate totals from all active details
    const totals = await prisma.tb_purchase_order_detail.aggregate({
      where: {
        purchase_order_id: purchaseOrderId,
        deleted_at: null,
      },
      _sum: {
        order_qty: true,
        sub_total_price: true,
        tax_amount: true,
        total_price: true,
      },
    });

    // Update PO with new totals
    await prisma.tb_purchase_order.update({
      where: { id: purchaseOrderId },
      data: {
        total_qty: totals._sum.order_qty || 0,
        total_price: totals._sum.sub_total_price || 0,
        total_tax: totals._sum.tax_amount || 0,
        total_amount: totals._sum.total_price || 0,
        doc_version: { increment: 1 },
        updated_by_id: this.userId,
      },
    });
  }

  /**
   * Close a Purchase Order - marks it as closed, sends notification and email
   * This is different from cancel - close is for POs that have been partially or fully received
   */
  @TryCatch
  async closePO(id: string): Promise<Result<any>> {
    this.logger.debug(
      { function: 'closePO', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Find the purchase order with its details and vendor contact
    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: id,
        is_active: true,
        deleted_at: null,
      },
      include: {
        tb_purchase_order_detail: true,
        tb_vendor: {
          include: {
            tb_vendor_contact: {
              where: {
                is_primary: true,
                deleted_at: null,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    // Validate status - only allow closing from sent, partial, or in_progress
    const allowedStatuses: enum_purchase_order_doc_status[] = [
      enum_purchase_order_doc_status.sent,
      enum_purchase_order_doc_status.partial,
      enum_purchase_order_doc_status.in_progress,
    ];

    if (!allowedStatuses.includes(purchaseOrder.po_status)) {
      return Result.error(
        `Cannot close purchase order with status '${purchaseOrder.po_status}'. Only sent, partial, or in_progress orders can be closed.`,
        ErrorCode.INVALID_ARGUMENT,
      );
    }

    // Use transaction to update PO and line items
    await this.prismaService.$transaction(async (prismatx) => {
      // Update PO header
      await prismatx.tb_purchase_order.update({
        where: { id: id },
        data: {
          po_status: enum_purchase_order_doc_status.closed,
          last_action_at_date: new Date(),
          last_action_by_id: this.userId,
          updated_by_id: this.userId,
        },
      });

      // Update each line item - set cancelled_qty to remaining qty (order_qty - received_qty)
      for (const detail of purchaseOrder.tb_purchase_order_detail) {
        const orderQty = Number(detail.order_qty) || 0;
        const receivedQty = Number(detail.received_qty) || 0;
        const cancelledQty = orderQty - receivedQty;

        if (cancelledQty > 0) {
          await prismatx.tb_purchase_order_detail.update({
            where: { id: detail.id },
            data: {
              cancelled_qty: cancelledQty,
              updated_by_id: this.userId,
            },
          });
        }
      }
    });

    // Send notification to buyer
    await this.sendClosePONotification(purchaseOrder);

    return Result.ok({ id: id, message: 'Purchase order closed successfully' });
  }

  /**
   * Send notification when PO is closed
   */
  private async sendClosePONotification(purchaseOrder: any): Promise<void> {
    try {
      const poNo = purchaseOrder?.po_no || 'N/A';
      const buyerId = purchaseOrder?.buyer_id;
      const vendorName = purchaseOrder?.vendor_name || purchaseOrder?.tb_vendor?.name || 'Unknown Vendor';
      const vendorEmail = purchaseOrder?.email ||
        purchaseOrder?.tb_vendor?.tb_vendor_contact?.[0]?.email || null;

      // Send notification to buyer
      if (buyerId) {
        const title = `Purchase Order Closed: ${poNo}`;
        const message = `Purchase Order ${poNo} for ${vendorName} has been closed.`;

        await this.notificationService.sendPONotification(
          buyerId,
          title,
          message,
          {
            po_id: purchaseOrder?.id,
            po_no: poNo,
            action: 'closed',
            vendor_id: purchaseOrder?.vendor_id,
            vendor_name: vendorName,
            vendor_email: vendorEmail,
            total_amount: Number(purchaseOrder?.total_amount) || 0,
            send_email: true,
          },
          this.userId,
        );
      }

      this.logger.log(`Close PO notification sent for PO ${poNo}`);
    } catch (error) {
      this.logger.error('Failed to send close PO notification:', error);
    }
  }
}

// Force reload at Wed Jan 28 09:54:59 AM +07 2026
