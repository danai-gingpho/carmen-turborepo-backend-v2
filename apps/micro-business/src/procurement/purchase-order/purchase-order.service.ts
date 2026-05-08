import { HttpStatus, HttpException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { isUUID } from 'class-validator';
import { firstValueFrom } from 'rxjs';
import { z } from 'zod';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import {
  enum_last_action,
  enum_purchase_order_doc_status,
  enum_purchase_request_doc_status,
  enum_stage_role,
  Prisma,
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
import { getPattern, calcBasePrices } from '@/common/common.helper';
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
  GlobalApiReturn,
  Stage,
  stage_status,
} from '@/common';
import { StageStatus } from '../purchase-request/interface/workflow.interface';
import { WorkflowPersistenceHelper } from '@/common/workflow/workflow-persistence.helper';
import {
  renderViaMicroReport,
  formatReportDate,
} from '@/common/print-report.helper';
import { WorkflowOrchestratorService } from '@/common/workflow/workflow-orchestrator.service';
import {
  ApprovePurchaseOrderDetailDto,
  RejectPurchaseOrderDetailDto,
  ReviewPurchaseOrderDetailDto,
} from './dto/approve-purchase-order.dto';
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

  /**
   * Initialize the Prisma service for tenant-specific database access
   * เริ่มต้นบริการ Prisma สำหรับการเข้าถึงฐานข้อมูลเฉพาะผู้เช่า
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param userId - User ID / ID ผู้ใช้
   */
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
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly tenantService: TenantService,
    private readonly commonLogic: CommonLogic,
    private readonly notificationService: NotificationService,
    private readonly workflowOrchestrator: WorkflowOrchestratorService,
  ) { }

  /**
   * Find a purchase order by ID with all related data (vendor, currency, credit term, details)
   * ค้นหาใบสั่งซื้อตาม ID พร้อมข้อมูลที่เกี่ยวข้องทั้งหมด (ผู้ขาย สกุลเงิน เงื่อนไขเครดิต รายละเอียด)
   * @param id - Purchase order ID / ID ของใบสั่งซื้อ
   * @returns Purchase order data with relations / ข้อมูลใบสั่งซื้อพร้อมความสัมพันธ์
   */
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
        po_type: true,
        description: true,
        order_date: true,
        delivery_date: true,
        workflow_id: true,
        workflow_name: true,
        workflow_current_stage: true,
        workflow_previous_stage: true,
        workflow_next_stage: true,
        workflow_history: true,
        user_action: true,
        last_action: true,
        last_action_at_date: true,
        last_action_by_id: true,
        last_action_by_name: true,
        vendor_id: true,
        vendor_name: true,
        currency_id: true,
        currency_code: true,
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
        created_by_id: true,
        tb_purchase_order_detail: {
          select: {
            id: true,
            sequence_no: true,
            description: true,
            product_id: true,
            product_code: true,
            product_name: true,
            product_local_name: true,
            product_sku: true,
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
            stages_status: true,
            current_stage_status: true,
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
                location_id: true,
                location_code: true,
                location_name: true,
                delivery_point_id: true,
                delivery_point_name: true,
              },
            },
          },
        },
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    // ===========================================================================
    // PRESERVED-FOR-REUSE: read-time repair of empty user_action.execute.
    //
    // Purpose:
    //   Heals documents whose user_action.execute was incorrectly stored as []
    //   by the previously-buggy buildReviewWorkflow path (the write-side bug is
    //   already fixed in workflow-orchestrator.service.ts buildReviewWorkflow).
    //   When a PO is sitting at the workflow's first stage with empty
    //   user_action, the buyer/creator gets role: "view_only" instead of
    //   "create" and can't act on it.
    //
    // How it works (when uncommented):
    //   1. Detects POs with empty user_action.execute, status != draft,
    //      and a current workflow stage set.
    //   2. Calls workflowOrchestrator.repairUserActionAtCreateStage(...) which
    //      checks the workflow's first stage matches the doc's current stage,
    //      then fetches the buyer profile from the auth service.
    //   3. Patches the in-memory purchaseOrder.user_action so the subsequent
    //      resolveUserRole call returns "create" instead of "view_only".
    //   4. Persists the repaired user_action back to the DB so the fix sticks.
    //
    // When to re-enable:
    //   If we discover another batch of affected POs (e.g., from a different
    //   buggy code path or stale data after a migration), uncomment this block
    //   AND the matching repairUserActionAtCreateStage helper in
    //   workflow-orchestrator.service.ts. Both must be uncommented together.
    //
    // Remove permanently when:
    //   We're confident no more affected docs exist.
    // ===========================================================================
    // const existingUserActionExecute = (purchaseOrder.user_action as any)?.execute;
    // const isUserActionEmpty = !existingUserActionExecute || existingUserActionExecute.length === 0;
    // if (
    //   isUserActionEmpty &&
    //   purchaseOrder.po_status !== enum_purchase_order_doc_status.draft &&
    //   purchaseOrder.workflow_id &&
    //   purchaseOrder.workflow_current_stage
    // ) {
    //   const requestorId = purchaseOrder.buyer_id || purchaseOrder.created_by_id;
    //   const repaired = await this.workflowOrchestrator.repairUserActionAtCreateStage(
    //     purchaseOrder.workflow_id,
    //     purchaseOrder.workflow_current_stage,
    //     requestorId,
    //     null,
    //     this.userId,
    //     this.bu_code,
    //   );
    //   if (repaired) {
    //     purchaseOrder.user_action = repaired as unknown as typeof purchaseOrder.user_action;
    //     await this.prismaService.tb_purchase_order.update({
    //       where: { id: purchaseOrder.id },
    //       data: { user_action: repaired as unknown as Prisma.InputJsonValue },
    //     });
    //     this.logger.log(
    //       { function: 'findById.repairUserAction', id: purchaseOrder.id },
    //       PurchaseOrderService.name,
    //     );
    //   }
    // }

    const role = await this.workflowOrchestrator.resolveUserRole(
      purchaseOrder.po_status === enum_purchase_order_doc_status.draft,
      purchaseOrder.created_by_id === this.userId,
      purchaseOrder.workflow_id,
      purchaseOrder.workflow_current_stage,
      purchaseOrder.user_action,
      this.userId,
      this.bu_code,
    );

    // Transform the response
    const transformedData = {
      ...purchaseOrder,
      role,
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
          location_id: prLink.location_id,
          location_code: prLink.location_code,
          location_name: prLink.location_name,
          delivery_point_id: prLink.delivery_point_id,
          delivery_point_name: prLink.delivery_point_name,
        })),
      })),
    };

    // Remove the original nested relation
    delete (transformedData as Record<string, unknown>).tb_purchase_order_detail;

    // Group junction records by location into detail.locations
    this.enrichLocationFromPrDetails(transformedData);

    const serializedPurchaseOrder = PurchaseOrderDetailResponseSchema.parse(transformedData);

    return Result.ok(serializedPurchaseOrder);
  }

  /**
   * Group pr_details by location_id for each detail.
   * Produces a `locations` array with summed qty fields and nested pr_details.
   */
   
  private enrichLocationFromPrDetails(transformedData: Record<string, any>): void {
    if (!transformedData.purchase_order_detail) return;

    for (const detail of transformedData.purchase_order_detail) {
      if (!detail.pr_details || detail.pr_details.length === 0) {
        detail.locations = [];
        continue;
      }

       
      const locMap = new Map<string, any>();

      for (const pr of detail.pr_details) {
        const key = pr.location_id || '__no_location__';

        if (!locMap.has(key)) {
          locMap.set(key, {
            location_id: pr.location_id || null,
            location_code: pr.location_code || null,
            location_name: pr.location_name || null,
            delivery_point_id: pr.delivery_point_id || null,
            delivery_point_name: pr.delivery_point_name || null,
            order_qty: 0,
            order_base_qty: 0,
            received_qty: 0,
            foc_qty: 0,
            pr_details: [],
          });
        }

        const loc = locMap.get(key);
        loc.order_qty += pr.order_qty || 0;
        loc.order_base_qty += pr.order_base_qty || 0;
        loc.received_qty += pr.received_qty || 0;
        loc.foc_qty += pr.foc_qty || 0;
        loc.pr_details.push({
          pr_detail_id: pr.pr_detail_id,
          order_qty: pr.order_qty,
          order_base_qty: pr.order_base_qty,
          received_qty: pr.received_qty,
          foc_qty: pr.foc_qty,
        });
      }

      detail.locations = Array.from(locMap.values());
    }
  }

  /**
   * List purchase orders available for GRN creation (sent/partial status).
   * Returns PO headers + details with location breakdown from linked PR details.
   * ค้นหาใบสั่งซื้อที่พร้อมสำหรับสร้างใบรับสินค้า (GRN) สถานะ sent/partial
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated PO list with location breakdown / รายการ PO พร้อมรายละเอียดตาม location
   */
  @TryCatch
  async findAllForGrn(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllForGrn', user_id: this.userId, tenant_id: this.bu_code, paginate },
      PurchaseOrderService.name,
    );

    const defaultSearchFields = ['po_no', 'vendor_name'];
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

    const whereClause = {
      ...q.where(),
      deleted_at: null,
      po_status: {
        in: [
          enum_purchase_order_doc_status.sent,
          enum_purchase_order_doc_status.partial,
        ],
      },
    };

    const purchaseOrders = await this.prismaService.tb_purchase_order.findMany({
      ...q.findMany(),
      where: whereClause,
      select: {
        id: true,
        po_no: true,
        po_status: true,
        vendor_id: true,
        vendor_name: true,
        order_date: true,
        delivery_date: true,
        currency_id: true,
        currency_code: true,
        exchange_rate: true,
        tb_purchase_order_detail: {
          where: { deleted_at: null },
          orderBy: { sequence_no: 'asc' },
          select: {
            id: true,
            sequence_no: true,
            product_id: true,
            product_code: true,
            product_name: true,
            product_local_name: true,
            order_qty: true,
            order_unit_id: true,
            order_unit_name: true,
            order_unit_conversion_factor: true,
            base_qty: true,
            base_unit_id: true,
            base_unit_name: true,
            received_qty: true,
            cancelled_qty: true,
            price: true,
            net_amount: true,
            is_foc: true,
            tb_purchase_order_detail_tb_purchase_request_detail: {
              where: { deleted_at: null },
              select: {
                id: true,
                pr_detail_id: true,
                pr_detail_qty: true,
                pr_detail_base_qty: true,
                pr_detail_base_unit_id: true,
                pr_detail_base_unit_name: true,
                pr_detail_order_unit_id: true,
                pr_detail_order_unit_name: true,
                received_qty: true,
                foc_qty: true,
                location_id: true,
                location_code: true,
                location_name: true,
                delivery_point_id: true,
                delivery_point_name: true,
                tb_purchase_request_detail: {
                  select: {
                    id: true,
                    location_id: true,
                    location_code: true,
                    location_name: true,
                    requested_unit_id: true,
                    requested_unit_name: true,
                    requested_unit_conversion_factor: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const total = await this.prismaService.tb_purchase_order.count({
      where: whereClause,
    });

    const data = purchaseOrders.map((po) => ({
      id: po.id,
      po_no: po.po_no,
      po_status: po.po_status,
      grn_status: po.po_status === enum_purchase_order_doc_status.sent ? 'open' : po.po_status,
      vendor_id: po.vendor_id,
      vendor_name: po.vendor_name,
      order_date: po.order_date,
      delivery_date: po.delivery_date,
      currency_id: po.currency_id,
      currency_code: po.currency_code,
      exchange_rate: Number(po.exchange_rate),
      po_detail: po.tb_purchase_order_detail.map((detail) => ({
        id: detail.id,
        sequence_no: detail.sequence_no,
        product_id: detail.product_id,
        product_code: detail.product_code,
        product_name: detail.product_name,
        product_local_name: detail.product_local_name,
        order_qty: Number(detail.order_qty),
        order_unit_id: detail.order_unit_id,
        order_unit_name: detail.order_unit_name,
        order_unit_conversion_factor: Number(detail.order_unit_conversion_factor),
        base_qty: Number(detail.base_qty),
        base_unit_id: detail.base_unit_id,
        base_unit_name: detail.base_unit_name,
        received_qty: Number(detail.received_qty),
        cancelled_qty: Number(detail.cancelled_qty),
        price: Number(detail.price),
        net_amount: Number(detail.net_amount),
        is_foc: detail.is_foc,
        locations: (() => {
          // Group by location_id and sum quantities across PR details
          const locationMap = new Map<string, {
            location_id: string | null;
            location_code: string | null;
            location_name: string | null;
            requested_qty: number;
            remain_qty: number;
            request_unit_id: string | null;
            request_unit_name: string | null;
            foc_qty: number;
            request_base_factor: number;
            request_base_qty: number;
            request_base_unit_id: string | null;
            request_base_unit_name: string | null;
            received_qty: number;
          }>();

          for (const prLink of detail.tb_purchase_order_detail_tb_purchase_request_detail) {
            const prDetail = prLink.tb_purchase_request_detail;
            const locId = prDetail?.location_id || 'no-location';

            const existing = locationMap.get(locId);
            const prQty = Number(prLink.pr_detail_qty);
            const rcvQty = Number(prLink.received_qty);

            if (existing) {
              existing.requested_qty += prQty;
              existing.remain_qty += prQty - rcvQty;
              existing.foc_qty += Number(prLink.foc_qty);
              existing.request_base_qty += Number(prLink.pr_detail_base_qty);
              existing.received_qty += rcvQty;
            } else {
              locationMap.set(locId, {
                location_id: prDetail?.location_id || null,
                location_code: prDetail?.location_code || null,
                location_name: prDetail?.location_name || null,
                requested_qty: prQty,
                remain_qty: prQty - rcvQty,
                request_unit_id: prLink.pr_detail_order_unit_id,
                request_unit_name: prLink.pr_detail_order_unit_name,
                foc_qty: Number(prLink.foc_qty),
                request_base_factor: Number(prDetail?.requested_unit_conversion_factor || 1),
                request_base_qty: Number(prLink.pr_detail_base_qty),
                request_base_unit_id: prLink.pr_detail_base_unit_id,
                request_base_unit_name: prLink.pr_detail_base_unit_name,
                received_qty: rcvQty,
              });
            }
          }

          return Array.from(locationMap.values());
        })(),
      })),
    }));

    return Result.ok({
      data,
      rawPurchaseOrders: purchaseOrders,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Find purchase orders for GRN by vendor ID (sent/partial status)
   * ค้นหาใบสั่งซื้อสำหรับ GRN ตาม vendor ID (สถานะ sent หรือ partial)
   * @param vendorId - Vendor ID / รหัสผู้ขาย
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated PO list filtered by vendor / รายการ PO ที่กรองตาม vendor
   */
  async findVendorsForGrn(paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findVendorsForGrn', user_id: this.userId, tenant_id: this.bu_code, paginate },
      PurchaseOrderService.name,
    );

    const defaultSearchFields = ['vendor_name'];
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

    const whereClause = {
      ...q.where(),
      deleted_at: null,
      po_status: {
        in: [
          enum_purchase_order_doc_status.sent,
          enum_purchase_order_doc_status.partial,
        ],
      },
      vendor_id: { not: null },
    };

    const purchaseOrders = await this.prismaService.tb_purchase_order.findMany({
      where: whereClause,
      select: {
        vendor_id: true,
        vendor_name: true,
        tb_vendor: {
          select: { code: true },
        },
      },
    });

    const vendorMap = new Map<string, { vendor_id: string; vendor_code: string | null; vendor_name: string | null; po_count: number }>();
    for (const po of purchaseOrders) {
      if (!po.vendor_id) continue;
      const existing = vendorMap.get(po.vendor_id);
      if (existing) {
        existing.po_count++;
      } else {
        vendorMap.set(po.vendor_id, {
          vendor_id: po.vendor_id,
          vendor_code: po.tb_vendor?.code ?? null,
          vendor_name: po.vendor_name,
          po_count: 1,
        });
      }
    }

    const allVendors = Array.from(vendorMap.values()).sort((a, b) => {
      if (paginate.sort) return 0;
      const codeCompare = (a.vendor_code ?? '').localeCompare(b.vendor_code ?? '');
      if (codeCompare !== 0) return codeCompare;
      return (a.vendor_name ?? '').localeCompare(b.vendor_name ?? '');
    });

    const total = allVendors.length;
    const page = q.page;
    const perpage = q.perpage;
    const skip = perpage < 0 ? 0 : (page - 1) * perpage;
    const paged = perpage < 0 ? allVendors : allVendors.slice(skip, skip + perpage);

    const data = paged.map((v) => ({
      vendor_id: v.vendor_id,
      vendor_code: v.vendor_code,
      vendor_name: v.vendor_name,
      po_count: v.po_count,
    }));

    return Result.ok({
      paginate: {
        total,
        page: perpage < 0 ? 1 : page,
        perpage: perpage < 0 ? total : perpage,
        pages: total === 0 || perpage < 0 ? 1 : Math.ceil(total / perpage),
      },
      data,
    });
  }

  async findAllForGrnByVendorId(vendorId: string, paginate: IPaginate): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllForGrnByVendorId', user_id: this.userId, tenant_id: this.bu_code, vendorId, paginate },
      PurchaseOrderService.name,
    );

    const defaultSearchFields = ['po_no'];
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

    const whereClause = {
      ...q.where(),
      deleted_at: null,
      vendor_id: vendorId,
      po_status: {
        in: [
          enum_purchase_order_doc_status.sent,
          enum_purchase_order_doc_status.partial,
        ],
      },
    };

    const purchaseOrders = await this.prismaService.tb_purchase_order.findMany({
      ...q.findMany(),
      where: whereClause,
      select: {
        id: true,
        po_no: true,
        po_status: true,
        order_date: true,
        delivery_date: true,
        currency_id: true,
        currency_code: true,
        exchange_rate: true,
        tb_purchase_order_detail: {
          where: { deleted_at: null },
          orderBy: { sequence_no: 'asc' },
          select: {
            id: true,
            sequence_no: true,
            product_id: true,
            product_code: true,
            product_name: true,
            product_local_name: true,
            order_qty: true,
            order_unit_id: true,
            order_unit_name: true,
            order_unit_conversion_factor: true,
            base_qty: true,
            base_unit_id: true,
            base_unit_name: true,
            received_qty: true,
            cancelled_qty: true,
            price: true,
            net_amount: true,
            is_foc: true,
            tb_purchase_order_detail_tb_purchase_request_detail: {
              where: { deleted_at: null },
              select: {
                id: true,
                location_id: true,
                location_code: true,
                location_name: true,
                pr_detail_qty: true,
                received_qty: true,
                foc_qty: true,
                tb_location: {
                  select: { location_type: true },
                },
              },
            },
          },
        },
      },
    });

    const total = await this.prismaService.tb_purchase_order.count({
      where: whereClause,
    });

    const data = purchaseOrders.map((po) => ({
      id: po.id,
      po_no: po.po_no,
      po_status: po.po_status,
      grn_status: po.po_status === enum_purchase_order_doc_status.sent ? 'open' : po.po_status,
      order_date: po.order_date,
      delivery_date: po.delivery_date,
      currency_id: po.currency_id,
      currency_code: po.currency_code,
      exchange_rate: Number(po.exchange_rate),
      po_detail: po.tb_purchase_order_detail.map((detail: any) => ({
        id: detail.id,
        sequence_no: detail.sequence_no,
        product_id: detail.product_id,
        product_code: detail.product_code,
        product_name: detail.product_name,
        product_local_name: detail.product_local_name,
        order_qty: Number(detail.order_qty),
        order_unit_id: detail.order_unit_id,
        order_unit_name: detail.order_unit_name,
        order_unit_conversion_factor: Number(detail.order_unit_conversion_factor),
        base_qty: Number(detail.base_qty),
        base_unit_id: detail.base_unit_id,
        base_unit_name: detail.base_unit_name,
        received_qty: Number(detail.received_qty),
        cancelled_qty: Number(detail.cancelled_qty),
        price: Number(detail.price),
        net_amount: Number(detail.net_amount),
        is_foc: detail.is_foc,
        locations: (() => {
          const locationMap = new Map<string, any>();
          for (const j of detail.tb_purchase_order_detail_tb_purchase_request_detail || []) {
            const key = j.location_id;
            const existing = locationMap.get(key);
            if (existing) {
              existing.order_qty += Number(j.pr_detail_qty);
              existing.received_qty += Number(j.received_qty);
              existing.foc_qty += Number(j.foc_qty);
              existing.remain_qty = existing.order_qty - existing.received_qty;
            } else {
              const orderQty = Number(j.pr_detail_qty);
              const receivedQty = Number(j.received_qty);
              const focQty = Number(j.foc_qty);
              locationMap.set(key, {
                location_id: j.location_id,
                location_code: j.location_code,
                location_name: j.location_name,
                location_type: j.tb_location?.location_type || null,
                order_qty: orderQty,
                received_qty: receivedQty,
                foc_qty: focQty,
                remain_qty: orderQty - receivedQty,
              });
            }
          }
          return Array.from(locationMap.values());
        })(),
      })),
    }));

    return Result.ok({
      data,
      paginate: {
        total,
        page: q.page,
        perpage: q.perpage,
        pages: total === 0 ? 1 : Math.ceil(total / q.perpage),
      },
    });
  }

  /**
   * Find all purchase orders with pagination, search, and filtering
   * ค้นหาใบสั่งซื้อทั้งหมดพร้อมการแบ่งหน้า การค้นหา และการกรอง
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of purchase orders / รายการใบสั่งซื้อที่แบ่งหน้าแล้ว
   */
  @TryCatch
  async findAll(paginate: IPaginate): Promise<Result<unknown>> {
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
      po_type: true,
      description: true,
      order_date: true,
      delivery_date: true,
      vendor_id: true,
      vendor_name: true,
      currency_id: true,
      currency_code: true,
      exchange_rate: true,
      buyer_id: true,
      buyer_name: true,
      total_qty: true,
      total_price: true,
      total_tax: true,
      total_amount: true,
      workflow_name: true,
      workflow_current_stage: true,
      workflow_next_stage: true,
      last_action: true,
      created_at: true,
      created_by_id: true,
      updated_at: true,
      updated_by_id: true,
      deleted_at: true,
      deleted_by_id: true,
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
      tb_purchase_order_detail: {
        select: {
          net_amount: true,
          base_net_amount: true,
          total_price: true,
          base_total_price: true,
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

    const transformedData = purchaseOrders.map((po) => {
      let net_amount = 0;
      let base_net_amount = 0;
      let base_total_amount = 0;
      for (const detail of po.tb_purchase_order_detail) {
        net_amount += Number(detail.net_amount || 0);
        base_net_amount += Number(detail.base_net_amount || 0);
        base_total_amount += Number(detail.base_total_price || 0);
      }
      return {
        id: po.id,
        po_no: po.po_no,
        po_status: po.po_status,
        po_type: po.po_type,
        description: po.description,
        order_date: po.order_date,
        delivery_date: po.delivery_date,
        vendor_id: po.vendor_id,
        vendor_name: po.tb_vendor?.name ?? po.vendor_name ?? null,
        currency_code: po.tb_currency_tb_purchase_order_currency_idTotb_currency?.code ?? po.currency_code ?? null,
        exchange_rate: Number(po.exchange_rate),
        buyer_id: po.buyer_id,
        buyer_name: po.buyer_name,
        total_qty: Number(po.total_qty),
        total_price: Number(po.total_price),
        total_tax: Number(po.total_tax),
        net_amount,
        base_net_amount,
        total_amount: Number(po.total_amount),
        base_total_amount,
        workflow_name: po.workflow_name,
        workflow_current_stage: po.workflow_current_stage,
        workflow_next_stage: po.workflow_next_stage,
        last_action: po.last_action,
        created_at: po.created_at,
        created_by_id: po.created_by_id,
        updated_at: po.updated_at,
        updated_by_id: po.updated_by_id,
        deleted_at: po.deleted_at,
        deleted_by_id: po.deleted_by_id,
        doc_version: po.doc_version,
      };
    });

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

  /**
   * Create a new purchase order with details and generate a running PO number
   * สร้างใบสั่งซื้อใหม่พร้อมรายละเอียดและสร้างเลขที่ใบสั่งซื้ออัตโนมัติ
   * @param data - Purchase order creation data / ข้อมูลสำหรับสร้างใบสั่งซื้อ
   * @returns Created purchase order ID and PO number / ID และเลขที่ใบสั่งซื้อที่สร้างแล้ว
   */
  @TryCatch
  async create(data: ICreatePurchaseOrder): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    // Sanitize empty strings to undefined for optional UUID fields
    if (data.credit_term_id !== undefined && !data.credit_term_id) data.credit_term_id = undefined;
    if (data.buyer_id !== undefined && !data.buyer_id) data.buyer_id = undefined;

    // Validate required UUID fields
    const uuidErrors: string[] = [];
    if (!isUUID(data.vendor_id)) uuidErrors.push('vendor_id must be a valid UUID');
    if (!isUUID(data.currency_id)) uuidErrors.push('currency_id must be a valid UUID');
    if (!isUUID(data.workflow_id)) uuidErrors.push('workflow_id must be a valid UUID');
    if (data.credit_term_id && !isUUID(data.credit_term_id)) uuidErrors.push('credit_term_id must be a valid UUID');
    if (data.buyer_id && !isUUID(data.buyer_id)) uuidErrors.push('buyer_id must be a valid UUID');

    if (uuidErrors.length > 0) {
      return Result.error(uuidErrors.join(', '), ErrorCode.INVALID_ARGUMENT);
    }

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

    const orderDate = data.order_date ? new Date(String(data.order_date)) : new Date();
    const details = data.purchase_order_detail?.add || [];

    // Calculate totals from details
    let total_qty = 0;
    let total_price = 0;
    let total_tax = 0;
    let total_amount = 0;

    for (const detail of details) {
      total_qty += detail.order_qty || 0;
      total_price += detail.sub_total_price || 0;
      total_tax += detail.tax_amount || 0;
      total_amount += detail.total_price || 0;
    }

    // Create Purchase Order with transaction
    const purchaseOrder = await this.prismaService.$transaction(async (prismatx) => {
      // Generate PO number inside transaction (FOR UPDATE lock prevents duplicates)
      const poNo = await this.generatePONo(orderDate.toISOString(), prismatx);

      // Create PO header
      const po = await prismatx.tb_purchase_order.create({
        data: {
          po_no: poNo,
          po_status: enum_purchase_order_doc_status.draft,
          po_type: (data.po_type as any) || 'manual',
          description: data.description,
          order_date: orderDate.toISOString(),
          delivery_date: new Date(String(data.delivery_date)).toISOString(),
          vendor_id: data.vendor_id,
          vendor_name: data.vendor_name || vendor.name,
          currency_id: data.currency_id,
          currency_code: data.currency_code || currency.code,
          exchange_rate: data.exchange_rate || 1,
          email: data.email,
          buyer_id: data.buyer_id,
          buyer_name: data.buyer_name,
          credit_term_id: data.credit_term_id,
          credit_term_name: data.credit_term_name || creditTerm?.name,
          credit_term_value: data.credit_term_value || creditTerm?.value,
          remarks: data.remarks,
          note: data.note,
          workflow_id: data.workflow_id,
          workflow_name: data.workflow_name,
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
      for (const detail of details) {
        // Look up product info
        const product = detail.product_id
          ? await prismatx.tb_product.findUnique({ where: { id: detail.product_id } })
          : null;

        // Look up order unit
        const orderUnit = detail.order_unit_id
          ? await prismatx.tb_unit.findUnique({ where: { id: detail.order_unit_id } })
          : null;

        // Look up base unit
        const baseUnit = detail.base_unit_id
          ? await prismatx.tb_unit.findUnique({ where: { id: detail.base_unit_id } })
          : null;

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
            order_unit_name: detail.order_unit_name || orderUnit?.name,
            order_unit_conversion_factor: detail.order_unit_conversion_factor || 1,
            base_qty: base_qty,
            base_unit_id: detail.base_unit_id || undefined,
            base_unit_name: detail.base_unit_name || baseUnit?.name,
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
            ...calcBasePrices(detail, data.exchange_rate),
            note: detail.note,
            // Product info - enrich from DB if not provided
            product_id: detail.product_id,
            product_code: detail.product_code || product?.code,
            product_name: detail.product_name || product?.name,
            product_local_name: detail.product_local_name || product?.local_name,
            product_sku: detail.product_sku || product?.code,
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

            // Enrich missing unit names from DB
            let orderUnitName = prDetail.order_unit_name || '';
            let baseUnitName = prDetail.order_base_unit_name || '';

            if (!orderUnitName && prDetail.order_unit_id) {
              const unit = await prismatx.tb_unit.findFirst({ where: { id: prDetail.order_unit_id }, select: { name: true } });
              orderUnitName = unit?.name || '';
            }
            if (!baseUnitName && prDetail.order_base_unit_id) {
              const unit = await prismatx.tb_unit.findFirst({ where: { id: prDetail.order_base_unit_id }, select: { name: true } });
              baseUnitName = unit?.name || '';
            }

            await prismatx.tb_purchase_order_detail_tb_purchase_request_detail.create({
              data: {
                po_detail_id: poDetail.id,
                pr_detail_id: prDetail.pr_detail_id,
                pr_detail_order_unit_id: prDetail.order_unit_id,
                pr_detail_order_unit_name: orderUnitName,
                pr_detail_qty: prDetail.order_qty,
                pr_detail_base_qty: prDetail.order_base_qty,
                pr_detail_base_unit_id: prDetail.order_base_unit_id || undefined,
                pr_detail_base_unit_name: baseUnitName,
                location_id: prDetail.location_id || undefined,
                location_code: prDetail.location_code,
                location_name: prDetail.location_name,
                delivery_point_id: prDetail.delivery_point_id || undefined,
                delivery_point_name: prDetail.delivery_point_name,
                created_by_id: this.userId,
              },
            });
          }
        }

        // Create location junction records (for manual PO with locations, pr_detail_id = null)
        if (detail.locations && detail.locations.length > 0) {
          for (const loc of detail.locations) {
            await prismatx.tb_purchase_order_detail_tb_purchase_request_detail.create({
              data: {
                po_detail_id: poDetail.id,
                pr_detail_id: null,
                pr_detail_qty: loc.order_qty,
                pr_detail_base_qty: loc.order_base_qty || 0,
                location_id: loc.location_id,
                location_code: loc.location_code,
                location_name: loc.location_name,
                delivery_point_id: loc.delivery_point_id || undefined,
                delivery_point_name: loc.delivery_point_name,
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

  /**
   * Update an existing purchase order header and its detail lines (add, update, delete)
   * อัปเดตส่วนหัวใบสั่งซื้อที่มีอยู่และรายการรายละเอียด (เพิ่ม อัปเดต ลบ)
   * @param data - Updated purchase order data with detail operations / ข้อมูลใบสั่งซื้อที่อัปเดตพร้อมการดำเนินการรายละเอียด
   * @returns Updated purchase order ID / ID ของใบสั่งซื้อที่อัปเดตแล้ว
   */
  @TryCatch
  async update(data: IUpdatePurchaseOrder): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const purchaseOrderId = typeof data.id === 'object' ? (data.id as unknown as Record<string, string>).id : data.id;

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
      data.currency_code = data.currency_code || currency.code;
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
        currency_code: data.currency_code,
        exchange_rate: data.exchange_rate,
        email: data.email,
        buyer_id: data.buyer_id || null,
        buyer_name: data.buyer_name,
        credit_term_id: data.credit_term_id || null,
        credit_term_name: data.credit_term_name,
        credit_term_value: data.credit_term_value,
        remarks: data.remarks,
        note: data.note,
        info: data.info as object,
        doc_version: { increment: 1 },
        updated_by_id: this.userId,
      },
    });

    // Handle details add/remove/update
    if (data.details) {
      // Add new details
      if (data.details.add) {
        for (const detail of data.details.add) {
          // Look up product, order unit, base unit
          const product = detail.product_id
            ? await this.prismaService.tb_product.findUnique({ where: { id: detail.product_id } })
            : null;
          const orderUnit = detail.order_unit_id
            ? await this.prismaService.tb_unit.findUnique({ where: { id: detail.order_unit_id } })
            : null;
          const baseUnit = detail.base_unit_id
            ? await this.prismaService.tb_unit.findUnique({ where: { id: detail.base_unit_id } })
            : null;

          await this.prismaService.tb_purchase_order_detail.create({
            data: {
              purchase_order_id: updatedPO.id,
              sequence_no: detail.sequence_no,
              description: detail.description,
              product_id: detail.product_id || undefined,
              product_code: detail.product_code || product?.code,
              product_name: detail.product_name || product?.name,
              product_local_name: detail.product_local_name || product?.local_name,
              product_sku: detail.product_sku || product?.code,
              order_qty: detail.order_qty,
              order_unit_id: detail.order_unit_id || undefined,
              order_unit_name: detail.order_unit_name || orderUnit?.name,
              order_unit_conversion_factor: detail.order_unit_conversion_factor,
              base_qty: detail.base_qty,
              base_unit_id: detail.base_unit_id || undefined,
              base_unit_name: detail.base_unit_name || baseUnit?.name,
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
              ...calcBasePrices(detail, data.exchange_rate),
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
      if (data.details.remove) {
        for (const detailId of data.details.remove) {
          const id = detailId;
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
      if (data.details.update) {
        for (const detail of data.details.update) {
          const detailId = detail.id;

          // Look up product, order unit, base unit
          const product = detail.product_id
            ? await this.prismaService.tb_product.findUnique({ where: { id: detail.product_id } })
            : null;
          const orderUnit = detail.order_unit_id
            ? await this.prismaService.tb_unit.findUnique({ where: { id: detail.order_unit_id } })
            : null;
          const baseUnit = detail.base_unit_id
            ? await this.prismaService.tb_unit.findUnique({ where: { id: detail.base_unit_id } })
            : null;

          await this.prismaService.tb_purchase_order_detail.update({
            where: { id: detailId },
            data: {
              sequence_no: detail.sequence_no,
              description: detail.description,
              product_id: detail.product_id || undefined,
              product_code: detail.product_code || product?.code,
              product_name: detail.product_name || product?.name,
              product_local_name: detail.product_local_name || product?.local_name,
              product_sku: detail.product_sku || product?.code,
              order_qty: detail.order_qty,
              order_unit_id: detail.order_unit_id || undefined,
              order_unit_name: detail.order_unit_name || orderUnit?.name,
              order_unit_conversion_factor: detail.order_unit_conversion_factor,
              base_qty: detail.base_qty,
              base_unit_id: detail.base_unit_id || undefined,
              base_unit_name: detail.base_unit_name || baseUnit?.name,
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
              ...calcBasePrices(detail, data.exchange_rate),
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

  /**
   * Delete a purchase order and all its detail lines
   * ลบใบสั่งซื้อและรายการรายละเอียดทั้งหมด
   * @param id - Purchase order ID to delete / ID ของใบสั่งซื้อที่ต้องการลบ
   * @returns Deleted purchase order ID / ID ของใบสั่งซื้อที่ลบแล้ว
   */
  @TryCatch
  async delete(id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: { id, deleted_at: null },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    if (purchaseOrder.po_status !== enum_purchase_order_doc_status.draft) {
      return Result.error(
        'Only draft purchase orders can be deleted',
        ErrorCode.VALIDATION_FAILURE,
      );
    }

    const now = new Date().toISOString();

    await this.prismaService.$transaction(async (prisma) => {
      await prisma.tb_purchase_order_detail.updateMany({
        where: { purchase_order_id: id, deleted_at: null },
        data: { deleted_at: now, updated_by_id: this.userId },
      });
      await prisma.tb_purchase_order.update({
        where: { id },
        data: { deleted_at: now, updated_by_id: this.userId },
      });
    });

    return Result.ok({ id: purchaseOrder.id });
  }

  /**
   * Save a purchase order by updating header and managing detail lines (add, update, delete)
   * บันทึกใบสั่งซื้อโดยอัปเดตส่วนหัวและจัดการรายการรายละเอียด (เพิ่ม อัปเดต ลบ)
   * @param id - Purchase order ID / ID ของใบสั่งซื้อ
   * @param header - Header data to update / ข้อมูลส่วนหัวที่ต้องการอัปเดต
   * @param details - Detail operations (add, update, delete) / การดำเนินการรายละเอียด (เพิ่ม อัปเดต ลบ)
   * @returns Saved purchase order ID / ID ของใบสั่งซื้อที่บันทึกแล้ว
   */
  @TryCatch
   
  async save(id: string, header: Record<string, any>, details: Record<string, any>): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'save',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseOrderService.name,
    );

    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: id,
        po_status: {
          in: [
            enum_purchase_order_doc_status.draft,
            enum_purchase_order_doc_status.in_progress,
          ],
        },
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found or not editable (must be draft or in_progress)', ErrorCode.NOT_FOUND);
    }

    if (purchaseOrder.po_type === 'purchase_request') {
      return Result.error('Cannot update purchase order created from purchase request', ErrorCode.INVALID_ARGUMENT);
    }

    await this.prismaService.$transaction(async (txp) => {
      // 1. Update PO header if any header fields provided
      if (Object.keys(header).length > 0) {
        // Coerce empty-string UUID fields to null. The frontend may send
        // `""` for an unselected buyer/credit term, but Prisma rejects empty
        // strings on `String? @db.Uuid` columns with "Error creating UUID".
        const UUID_HEADER_FIELDS = [
          'workflow_id',
          'vendor_id',
          'currency_id',
          'buyer_id',
          'credit_term_id',
        ] as const;
        const sanitizedHeader: Record<string, unknown> = { ...header };
        for (const field of UUID_HEADER_FIELDS) {
          if (field in sanitizedHeader && sanitizedHeader[field] === '') {
            sanitizedHeader[field] = null;
          }
        }

        await txp.tb_purchase_order.update({
          where: { id },
          data: {
            ...sanitizedHeader,
            delivery_date: header.delivery_date
              ? new Date(header.delivery_date as string).toISOString()
              : undefined,
            order_date: header.order_date
              ? new Date(header.order_date as string).toISOString()
              : undefined,
            updated_by_id: this.userId,
          },
        });
      }

      // 2. Remove details
      if (details?.remove?.length > 0) {
        for (const item of details.remove) {
          // Delete junction records first
          await txp.tb_purchase_order_detail_tb_purchase_request_detail.deleteMany({
            where: { po_detail_id: item.id },
          });
          // Then delete the detail
          await txp.tb_purchase_order_detail.delete({
            where: { id: item.id },
          });
        }
      }

      // 3. Add new details
      if (details?.add?.length > 0) {
        for (const detail of details.add) {
          // Look up product, order unit, base unit
          const product = detail.product_id
            ? await txp.tb_product.findUnique({ where: { id: detail.product_id } })
            : null;
          const orderUnit = detail.order_unit_id
            ? await txp.tb_unit.findUnique({ where: { id: detail.order_unit_id } })
            : null;
          const baseUnit = detail.base_unit_id
            ? await txp.tb_unit.findUnique({ where: { id: detail.base_unit_id } })
            : null;

          const base_qty =
            detail.base_qty ||
            detail.order_qty * (detail.order_unit_conversion_factor || 1);

          const poDetail = await txp.tb_purchase_order_detail.create({
            data: {
              purchase_order_id: id,
              sequence_no: detail.sequence,
              description: detail.description,
              order_qty: detail.order_qty,
              order_unit_id: detail.order_unit_id || undefined,
              order_unit_name: detail.order_unit_name || orderUnit?.name,
              order_unit_conversion_factor: detail.order_unit_conversion_factor || 1,
              base_qty: base_qty,
              base_unit_id: detail.base_unit_id || undefined,
              base_unit_name: detail.base_unit_name || baseUnit?.name,
              is_foc: detail.is_foc || false,
              price: detail.price || 0,
              sub_total_price: detail.sub_total_price || 0,
              net_amount: detail.net_amount || 0,
              total_price: detail.total_price || 0,
              tax_profile_id: detail.tax_profile_id || undefined,
              tax_profile_name: detail.tax_profile_name,
              tax_rate: detail.tax_rate || 0,
              tax_amount: detail.tax_amount || 0,
              is_tax_adjustment: detail.is_tax_adjustment || false,
              discount_rate: detail.discount_rate || 0,
              discount_amount: detail.discount_amount || 0,
              is_discount_adjustment: detail.is_discount_adjustment || false,
              ...calcBasePrices(detail, header.exchange_rate ?? purchaseOrder.exchange_rate),
              note: detail.note,
              // Product info - enrich from DB if not provided
              product_id: detail.product_id,
              product_code: detail.product_code || product?.code,
              product_name: detail.product_name || product?.name,
              product_local_name: detail.product_local_name || product?.local_name,
              product_sku: detail.product_sku || product?.code,
              current_stage_status: detail.current_stage_status || null,
              is_active: true,
              doc_version: 1,
              created_by_id: this.userId,
            },
          });

          // Create PR detail linkages
          if (detail.pr_detail?.length > 0) {
            for (const prDetail of detail.pr_detail) {
              if (!prDetail.pr_detail_id || !prDetail.order_unit_id) continue;

              // Enrich missing unit names from DB
              let orderUnitName = prDetail.order_unit_name || '';
              let baseUnitName = prDetail.order_base_unit_name || '';

              if (!orderUnitName && prDetail.order_unit_id) {
                const unit = await txp.tb_unit.findFirst({ where: { id: prDetail.order_unit_id }, select: { name: true } });
                orderUnitName = unit?.name || '';
              }
              if (!baseUnitName && prDetail.order_base_unit_id) {
                const unit = await txp.tb_unit.findFirst({ where: { id: prDetail.order_base_unit_id }, select: { name: true } });
                baseUnitName = unit?.name || '';
              }

              await txp.tb_purchase_order_detail_tb_purchase_request_detail.create({
                data: {
                  po_detail_id: poDetail.id,
                  pr_detail_id: prDetail.pr_detail_id,
                  pr_detail_order_unit_id: prDetail.order_unit_id,
                  pr_detail_order_unit_name: orderUnitName,
                  pr_detail_qty: prDetail.order_qty,
                  pr_detail_base_qty: prDetail.order_base_qty,
                  pr_detail_base_unit_id: prDetail.order_base_unit_id || undefined,
                  pr_detail_base_unit_name: baseUnitName,
                  location_id: prDetail.location_id || undefined,
                  location_code: prDetail.location_code,
                  location_name: prDetail.location_name,
                  delivery_point_id: prDetail.delivery_point_id || undefined,
                  delivery_point_name: prDetail.delivery_point_name,
                  created_by_id: this.userId,
                },
              });
            }
          }
        }
      }

      // 4. Update existing details
      if (details?.update?.length > 0) {
        for (const detail of details.update) {
          // Look up product, order unit, base unit
          const product = detail.product_id
            ? await txp.tb_product.findUnique({ where: { id: detail.product_id } })
            : null;
          const orderUnit = detail.order_unit_id
            ? await txp.tb_unit.findUnique({ where: { id: detail.order_unit_id } })
            : null;
          const baseUnit = detail.base_unit_id
            ? await txp.tb_unit.findUnique({ where: { id: detail.base_unit_id } })
            : null;

          await txp.tb_purchase_order_detail.update({
            where: { id: detail.id },
            data: {
              sequence_no: detail.sequence,
              description: detail.description,
              product_id: detail.product_id || undefined,
              product_code: detail.product_code || product?.code,
              product_name: detail.product_name || product?.name,
              product_local_name: detail.product_local_name || product?.local_name,
              product_sku: detail.product_sku || product?.code,
              order_qty: detail.order_qty,
              order_unit_id: detail.order_unit_id || undefined,
              order_unit_name: detail.order_unit_name || orderUnit?.name,
              order_unit_conversion_factor: detail.order_unit_conversion_factor,
              base_qty: detail.base_qty,
              base_unit_id: detail.base_unit_id || undefined,
              base_unit_name: detail.base_unit_name || baseUnit?.name,
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
              ...calcBasePrices(detail, header.exchange_rate ?? purchaseOrder.exchange_rate),
              note: detail.note,
              current_stage_status: detail.current_stage_status !== undefined ? detail.current_stage_status : undefined,
              doc_version: { increment: 1 },
              updated_by_id: this.userId,
            },
          });
        }
      }

      // 5. Recalculate totals
      const allDetails = await txp.tb_purchase_order_detail.findMany({
        where: { purchase_order_id: id },
      });

      let total_qty = 0;
      let total_price = 0;
      let total_tax = 0;
      let total_amount = 0;

      for (const d of allDetails) {
        total_qty += Number(d.order_qty) || 0;
        total_price += Number(d.sub_total_price) || 0;
        total_tax += Number(d.tax_amount) || 0;
        total_amount += Number(d.total_price) || 0;
      }

      await txp.tb_purchase_order.update({
        where: { id },
        data: {
          total_qty,
          total_price,
          total_tax,
          total_amount,
          doc_version: { increment: 1 },
          updated_by_id: this.userId,
        },
      });

      return id;
    });

    return Result.ok({ id: purchaseOrder.id });
  }

  @TryCatch
  async saveDetailStageStatus(
    id: string,
    detailUpdates: { id: string; current_stage_status?: string }[],
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'saveDetailStageStatus', id, detailUpdates },
      PurchaseOrderService.name,
    );

    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: { id, po_status: enum_purchase_order_doc_status.in_progress },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found or not in progress', ErrorCode.NOT_FOUND);
    }

    await this.prismaService.$transaction(async (txp) => {
      for (const detail of detailUpdates) {
        await txp.tb_purchase_order_detail.update({
          where: { id: detail.id },
          data: {
            current_stage_status: detail.current_stage_status || null,
            updated_by_id: this.userId,
          },
        });
      }
    });

    return Result.ok({ id: purchaseOrder.id });
  }

  /**
   * Approve a purchase order and advance the workflow stage
   * อนุมัติใบสั่งซื้อและเลื่อนขั้นตอนการทำงานไปข้างหน้า
   * @param id - Purchase order ID / ID ของใบสั่งซื้อ
   * @param workflow - Workflow state data / ข้อมูลสถานะขั้นตอนการทำงาน
   * @param payload - Approval detail data for each line / ข้อมูลรายละเอียดการอนุมัติของแต่ละรายการ
   * @returns Approved purchase order ID / ID ของใบสั่งซื้อที่อนุมัติแล้ว
   */
  @TryCatch
  async submit(
    id: string,
    payload: { stage_role: string; details: { id: string; stage_status: string; stage_message?: string | null }[] },
    workflowHeader: Record<string, unknown>,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'submit', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id,
        OR: [
          { po_status: enum_purchase_order_doc_status.draft },
          { po_status: enum_purchase_order_doc_status.in_progress, last_action: enum_last_action.reviewed },
        ],
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found or not submittable', ErrorCode.NOT_FOUND);
    }

    const isDraft = purchaseOrder.po_status === enum_purchase_order_doc_status.draft;
    let newPoNo: string = purchaseOrder.po_no;
    await this.prismaService.$transaction(async (tx) => {
      if (isDraft) {
        newPoNo = await this.generatePONo(
          new Date(purchaseOrder.order_date || new Date()).toISOString(),
          tx,
        );
      }

      // Update PO header with workflow info and status
      await tx.tb_purchase_order.update({
        where: { id },
        data: {
          ...workflowHeader,
          workflow_history: workflowHeader.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflowHeader.user_action as unknown as Prisma.InputJsonValue,
          doc_version: { increment: 1 },
          po_status: enum_purchase_order_doc_status.in_progress,
          po_no: newPoNo,
          updated_by_id: this.userId,
        },
      });

      // Update detail history and stages_status
      const poDetails = await tx.tb_purchase_order_detail.findMany({
        where: { purchase_order_id: id, deleted_at: null },
        select: { id: true, history: true, stages_status: true },
      });

      for (const poDetail of poDetails) {
        const currentStages: StageStatus[] = Array.isArray(poDetail.stages_status)
          ? (poDetail.stages_status as unknown as StageStatus[])
          : [];

        const findDetails = payload.details?.length > 0
          ? payload.details.find((d) => d.id === poDetail.id)
          : WorkflowPersistenceHelper.autoGenerateSubmitDetail(poDetail.id, currentStages);
        if (!findDetails) continue;

        const { stages, skipped } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
          currentStages, findDetails, workflowHeader.workflow_previous_stage as string,
        );

        if (skipped) {
          const css = WorkflowPersistenceHelper.resolveCurrentStageStatus({
            payloadStatus: findDetails.stage_status,
            stages: currentStages,
            workflowCurrentStage: workflowHeader.workflow_current_stage as string,
          });
          await tx.tb_purchase_order_detail.update({
            where: { id: poDetail.id },
            data: { current_stage_status: css, doc_version: { increment: 1 }, updated_by_id: this.userId },
          });
          continue;
        }

        const history = WorkflowPersistenceHelper.appendHistory(
          Array.isArray(poDetail.history) ? (poDetail.history as any[]) : [],
          { status: findDetails.stage_status, name: workflowHeader.workflow_previous_stage as string, message: findDetails.stage_message || 'submit for approval', userId: this.userId },
        );

        await tx.tb_purchase_order_detail.update({
          where: { id: poDetail.id },
          data: {
            history: history as any,
            stages_status: stages as unknown as Prisma.InputJsonValue,
            current_stage_status: WorkflowPersistenceHelper.resolveCurrentStageStatus({
              payloadStatus: findDetails.stage_status,
              stages,
              workflowCurrentStage: workflowHeader.workflow_current_stage as string,
            }),
            doc_version: { increment: 1 },
            updated_by_id: this.userId,
          },
        });
      }
    });

    return Result.ok({ id: purchaseOrder.id, po_no: newPoNo });
  }

  @TryCatch
  async approve(id: string, workflow: Record<string, unknown>, payload: ApprovePurchaseOrderDetailDto[]): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'approve',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseOrderService.name,
    );

    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: id,
        po_status: enum_purchase_order_doc_status.in_progress,
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found or not in progress', ErrorCode.NOT_FOUND);
    }

    const PODetailDocs = await this.prismaService.tb_purchase_order_detail.findMany({
      where: {
        purchase_order_id: id,
      },
      select: {
        id: true,
        history: true,
        stages_status: true,
      },
    });

    await this.prismaService.$transaction(async (txp) => {
      for (const detail of payload) {
        const findPODoc = PODetailDocs.find((d) => d.id === detail.id);
        if (!findPODoc) continue;

        const currentStages: StageStatus[] = Array.isArray(findPODoc?.stages_status) ? findPODoc.stages_status as unknown as StageStatus[] : [];
        const isReject = detail.stage_status === stage_status.reject;
        let stages: StageStatus[];
        let stagesSkipped = false;
        if (isReject) {
          stages = WorkflowPersistenceHelper.buildRejectStagesStatus(
            currentStages, detail, (workflow as any).workflow_previous_stage,
          );
        } else {
          const result = WorkflowPersistenceHelper.buildApproveStagesStatus(
            currentStages, detail, (workflow as any).workflow_previous_stage,
          );
          stagesSkipped = result.skipped;
          stages = result.skipped ? currentStages : result.stages;
        }

        if (stagesSkipped) {
          const css = WorkflowPersistenceHelper.resolveCurrentStageStatus({
            payloadStatus: detail.stage_status,
            stages: currentStages,
            workflowCurrentStage: (workflow as any).workflow_current_stage,
          });
          await txp.tb_purchase_order_detail.update({
            where: { id: detail.id },
            data: { current_stage_status: css, doc_version: { increment: 1 }, updated_by_id: this.userId },
          });
          continue;
        }

        const history = WorkflowPersistenceHelper.appendHistory(
          (findPODoc?.history as unknown as Record<string, unknown>[]) || [],
          { status: detail.stage_status, name: (workflow as any).workflow_previous_stage, userId: this.userId, action: 'approved' },
        );

        await txp.tb_purchase_order_detail.update({
          where: { id: detail.id },
          data: {
            doc_version: { increment: 1 },
            history: history as unknown as Prisma.InputJsonValue,
            stages_status: stages as unknown as Prisma.InputJsonValue,
            current_stage_status: WorkflowPersistenceHelper.resolveCurrentStageStatus({
              payloadStatus: detail.stage_status,
              stages,
              workflowCurrentStage: (workflow as any).workflow_current_stage,
            }),
            updated_by_id: this.userId,
          },
        });
      }

      await txp.tb_purchase_order.update({
        where: { id },
        data: {
          ...workflow,
          workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
          doc_version: { increment: 1 },
          updated_by_id: this.userId,
        },
      });

      return id;
    });

    return Result.ok({ id: purchaseOrder.id });
  }

  /**
   * Reject a purchase order and update the workflow stage
   * ปฏิเสธใบสั่งซื้อและอัปเดตขั้นตอนการทำงาน
   * @param id - Purchase order ID / ID ของใบสั่งซื้อ
   * @param workflow - Workflow state data / ข้อมูลสถานะขั้นตอนการทำงาน
   * @param payload - Rejection detail data for each line / ข้อมูลรายละเอียดการปฏิเสธของแต่ละรายการ
   * @returns Rejected purchase order ID / ID ของใบสั่งซื้อที่ปฏิเสธแล้ว
   */
  @TryCatch
  async reject(id: string, workflow: Record<string, unknown>, payload: RejectPurchaseOrderDetailDto[]): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'reject',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseOrderService.name,
    );

    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: id,
        po_status: enum_purchase_order_doc_status.in_progress,
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found or not in progress', ErrorCode.NOT_FOUND);
    }

    const PODetailDocs = await this.prismaService.tb_purchase_order_detail.findMany({
      where: {
        purchase_order_id: id,
      },
      select: {
        id: true,
        history: true,
        stages_status: true,
      },
    });

    await this.prismaService.$transaction(async (txp) => {
      for (const detail of payload) {
        const findPODoc = PODetailDocs.find((d) => d.id === detail.id);
        if (!findPODoc) continue;

        const bag = WorkflowPersistenceHelper.buildRejectDetailUpdate({
          payloadDetail: detail,
          currentStages: Array.isArray(findPODoc.stages_status) ? findPODoc.stages_status as unknown as StageStatus[] : [],
          currentHistory: (findPODoc.history as unknown as Record<string, unknown>[]) || [],
          workflowCurrentStage: purchaseOrder.workflow_current_stage,
          userId: this.userId,
          action: 'rejected',
        });

        await txp.tb_purchase_order_detail.update({
          where: { id: detail.id },
          data: {
            doc_version: { increment: 1 },
            stages_status: bag.stages_status as unknown as Prisma.InputJsonValue,
            history: bag.history as unknown as Prisma.InputJsonValue,
            current_stage_status: bag.current_stage_status,
            updated_by_id: this.userId,
          },
        });
      }

      await txp.tb_purchase_order.update({
        where: { id },
        data: {
          ...workflow,
          workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
          po_status: enum_purchase_order_doc_status.voided,
          updated_by_id: this.userId,
        },
      });

      return id;
    });

    return Result.ok({ id: purchaseOrder.id });
  }

  /**
   * Review a purchase order and forward it to the next workflow stage
   * ตรวจสอบใบสั่งซื้อและส่งต่อไปยังขั้นตอนการทำงานถัดไป
   * @param id - Purchase order ID / ID ของใบสั่งซื้อ
   * @param workflow - Workflow state data / ข้อมูลสถานะขั้นตอนการทำงาน
   * @param payload - Review detail data for each line / ข้อมูลรายละเอียดการตรวจสอบของแต่ละรายการ
   * @returns Reviewed purchase order ID / ID ของใบสั่งซื้อที่ตรวจสอบแล้ว
   */
  @TryCatch
  async review(id: string, workflow: Record<string, unknown>, payload: ReviewPurchaseOrderDetailDto[]): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'review',
        id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseOrderService.name,
    );

    const purchaseOrder = await this.prismaService.tb_purchase_order.findFirst({
      where: {
        id: id,
        po_status: enum_purchase_order_doc_status.in_progress,
      },
    });

    if (!purchaseOrder) {
      return Result.error('Purchase order not found or not in progress', ErrorCode.NOT_FOUND);
    }

    const PODetailDocs = await this.prismaService.tb_purchase_order_detail.findMany({
      where: {
        purchase_order_id: id,
      },
      select: {
        id: true,
        history: true,
        stages_status: true,
      },
    });

    const desStage = (workflow as any).workflow_current_stage;

    await this.prismaService.$transaction(async (txp) => {
      for (const detail of payload) {
        const findPODoc = PODetailDocs.find((d) => d.id === detail.id);
        if (!findPODoc) continue;

        const currentStages: StageStatus[] = Array.isArray(findPODoc.stages_status)
          ? findPODoc.stages_status as unknown as StageStatus[]
          : [];

        const bag = WorkflowPersistenceHelper.buildReviewDetailUpdate({
          payloadDetail: detail,
          currentStages,
          currentHistory: (findPODoc.history as unknown as Record<string, unknown>[]) || [],
          workflowPreviousStage: desStage,
          workflowCurrentStage: desStage,
          desStage,
          userId: this.userId,
          action: 'reviewed',
        });

        if (!bag) {
          const css = WorkflowPersistenceHelper.resolveCurrentStageStatus({
            payloadStatus: detail.stage_status,
            stages: currentStages,
            workflowCurrentStage: desStage,
          });
          await txp.tb_purchase_order_detail.update({
            where: { id: detail.id },
            data: { current_stage_status: css, doc_version: { increment: 1 }, updated_by_id: this.userId },
          });
          continue;
        }

        await txp.tb_purchase_order_detail.update({
          where: { id: detail.id },
          data: {
            doc_version: { increment: 1 },
            stages_status: bag.stages_status as unknown as Prisma.InputJsonValue,
            history: bag.history as unknown as Prisma.InputJsonValue,
            current_stage_status: bag.current_stage_status,
            updated_by_id: this.userId,
          },
        });
      }

      await txp.tb_purchase_order.update({
        where: { id },
        data: {
          ...workflow,
          workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
          user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
          updated_by_id: this.userId,
        },
      });

      return id;
    });

    return Result.ok({ id: purchaseOrder.id });
  }

  /**
   * Cancel a purchase order and update its status
   * ยกเลิกใบสั่งซื้อและอัปเดตสถานะ
   * @param id - Purchase order ID to cancel / ID ของใบสั่งซื้อที่ต้องการยกเลิก
   * @returns Cancelled purchase order ID / ID ของใบสั่งซื้อที่ยกเลิกแล้ว
   */
  @TryCatch
  async cancel(id: string): Promise<Result<unknown>> {
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
          last_action_at_date: new Date().toISOString(),
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

  /**
   * Generate a running purchase order number based on date pattern configuration
   * สร้างเลขที่ใบสั่งซื้อแบบเรียงลำดับตามการตั้งค่ารูปแบบวันที่
   * @param orderDate - Order date for pattern generation / วันที่สั่งซื้อสำหรับสร้างรูปแบบ
   * @returns Generated PO number / เลขที่ใบสั่งซื้อที่สร้างแล้ว
   */
  private async generatePONo(orderDate: string, tx?: any): Promise<string> {
    this.logger.debug(
      { function: 'generatePONo', orderDate, tenant_id: this.bu_code, user_id: this.userId },
      PurchaseOrderService.name,
    );
    const db = tx || this.prismaService;

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

    if (!datePattern || !runningPattern) {
      throw new Error(`Missing running code pattern config for PO: datePattern=${!!datePattern}, runningPattern=${!!runningPattern}`);
    }

    const getDate = new Date(orderDate);
    const datePatternValue = format(getDate, datePattern.pattern);

    // Use FOR UPDATE to lock the latest row and prevent concurrent duplicates
    const latestPORows: any[] = await db.$queryRawUnsafe(
      `SELECT po_no FROM tb_purchase_order
       WHERE po_no LIKE $1
       ORDER BY po_no DESC
       LIMIT 1
       FOR UPDATE`,
      `PO${datePatternValue}%`,
    );
    const latestPO = latestPORows.length > 0 ? latestPORows[0] : null;

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
  /**
   * Group purchase requests by vendor for purchase order creation preview
   * จัดกลุ่มใบขอซื้อตามผู้ขายสำหรับแสดงตัวอย่างก่อนสร้างใบสั่งซื้อ
   * @param pr_ids - Array of purchase request IDs to group / อาร์เรย์ของ ID ใบขอซื้อที่ต้องการจัดกลุ่ม
   * @returns Grouped purchase request data by vendor / ข้อมูลใบขอซื้อที่จัดกลุ่มตามผู้ขาย
   */
  @TryCatch
  async groupPrForPo(pr_ids: string[], workflow_id?: string): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'groupPrForPo',
        pr_ids,
        workflow_id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseOrderService.name,
    );

    if (!pr_ids || pr_ids.length === 0) {
      return Result.error('PR IDs are required', ErrorCode.INVALID_ARGUMENT);
    }

    // Resolve workflow: use provided workflow_id or find default purchase_order_workflow
    let resolvedWorkflow: { id: string; name: string } | null = null;
    if (workflow_id) {
      const uuidResult = z.string().uuid().safeParse(workflow_id);
      if (!uuidResult.success) {
        return Result.error('Invalid workflow_id format', ErrorCode.INVALID_ARGUMENT);
      }
      const wf = await this.prismaService.tb_workflow.findFirst({
        where: { id: workflow_id, deleted_at: null },
        select: { id: true, name: true },
      });
      if (!wf) {
        return Result.error('Workflow not found', ErrorCode.NOT_FOUND);
      }
      resolvedWorkflow = wf;
    } else {
      const wf = await this.prismaService.tb_workflow.findFirst({
        where: { workflow_type: 'purchase_order_workflow', deleted_at: null },
        select: { id: true, name: true },
      });
      if (!wf) {
        return Result.error('No purchase order workflow configured', ErrorCode.NOT_FOUND);
      }
      resolvedWorkflow = wf;
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
        currency_code: true,
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
            code: true,
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
     
    const groupedData = new Map<string, Record<string, any>>();

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
          currency_code: prDetail.currency_code || prDetail.tb_currency?.code || '',
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
    const result: Record<string, unknown>[] = [];
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
        currency_code: group.currency_code,
        exchange_rate: group.exchange_rate,
        total_price: group.total_price,
        base_price: group.base_price,
        products: group.products,
        pr: prArray,
      });

      draftCounter++;
    }

    return Result.ok({
      workflow: resolvedWorkflow,
      groups: result,
    });
  }

  /**
   * Confirm PR and create PO(s)
   * Groups PR details by vendor_id -> delivery_date -> currency_id and creates POs
   */
  /**
   * Confirm and convert purchase requests into purchase orders, grouped by vendor
   * ยืนยันและแปลงใบขอซื้อเป็นใบสั่งซื้อ จัดกลุ่มตามผู้ขาย
   * @param pr_ids - Array of purchase request IDs to confirm / อาร์เรย์ของ ID ใบขอซื้อที่ต้องการยืนยัน
   * @returns Created purchase order IDs / ID ของใบสั่งซื้อที่สร้างแล้ว
   */
  @TryCatch
  async confirmPrToPo(pr_ids: string[], workflow_id?: string): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'confirmPrToPo',
        pr_ids,
        workflow_id,
        user_id: this.userId,
        tenant_id: this.bu_code,
      },
      PurchaseOrderService.name,
    );

    if (!pr_ids || pr_ids.length === 0) {
      return Result.error('PR IDs are required', ErrorCode.INVALID_ARGUMENT);
    }

    // Resolve workflow (include data for auto-submit navigation)
    let resolvedWorkflow: { id: string; name: string; data: any } | null = null;
    if (workflow_id) {
      const uuidResult = z.string().uuid().safeParse(workflow_id);
      if (!uuidResult.success) {
        return Result.error('Invalid workflow_id format', ErrorCode.INVALID_ARGUMENT);
      }
      const wf = await this.prismaService.tb_workflow.findFirst({
        where: { id: workflow_id, deleted_at: null },
        select: { id: true, name: true, data: true },
      });
      if (!wf) {
        return Result.error('Workflow not found', ErrorCode.NOT_FOUND);
      }
      resolvedWorkflow = wf;
    } else {
      const wf = await this.prismaService.tb_workflow.findFirst({
        where: { workflow_type: 'purchase_order_workflow', deleted_at: null },
        select: { id: true, name: true, data: true },
      });
      if (!wf) {
        return Result.error('No purchase order workflow configured', ErrorCode.NOT_FOUND);
      }
      resolvedWorkflow = wf;
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
        product_code: true,
        product_name: true,
        product_local_name: true,
        product_sku: true,
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
        currency_code: true,
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
            requestor_id: true,
            requestor_name: true,
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

    // Pre-fetch products to enrich missing fields (code, sku, local_name, base_unit)
    const productIds = [...new Set(prDetails.map((d) => d.product_id).filter(Boolean))];
    const products = await this.prismaService.tb_product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        code: true,
        name: true,
        local_name: true,
        sku: true,
        inventory_unit_id: true,
        inventory_unit_name: true,
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Group by vendor_id -> delivery_date -> currency_id
     
    const groupedData = new Map<string, Record<string, any>>();

    for (const prDetail of prDetails) {
      if (!prDetail.vendor_id || !prDetail.currency_id || !prDetail.product_id) {
        continue;
      }

      const product = productMap.get(prDetail.product_id);

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
          currency_code: prDetail.currency_code || prDetail.tb_currency?.code,
          exchange_rate: Number(prDetail.exchange_rate) || 1,
          requestor_id: prDetail.tb_purchase_request?.requestor_id || null,
          requestor_name: prDetail.tb_purchase_request?.requestor_name || null,
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
        (item) => item.product_id === prDetail.product_id,
      );

      if (existingItem) {
        existingItem.pr_details.push({
          pr_detail_id: prDetail.id,
          pr_id: prDetail.purchase_request_id,
          pr_no: prDetail.tb_purchase_request?.pr_no,
          order_qty: Number(prDetail.approved_qty) || 0,
          order_unit_id: prDetail.approved_unit_id || prDetail.inventory_unit_id,
          order_unit_name: prDetail.approved_unit_name || prDetail.inventory_unit_name,
          order_unit_conversion_factor: Number(prDetail.approved_unit_conversion_factor) || 1,
          order_base_qty: Number(prDetail.approved_base_qty) || 0,
          location_id: prDetail.location_id,
          location_code: prDetail.location_code,
          location_name: prDetail.location_name,
          delivery_point_id: prDetail.delivery_point_id,
          delivery_point_name: prDetail.delivery_point_name,
        });

        existingItem.order_qty += Number(prDetail.approved_qty) || 0;
        existingItem.base_qty += Number(prDetail.approved_base_qty) || 0;
        existingItem.sub_total_price += Number(prDetail.sub_total_price) || 0;
        existingItem.tax_amount += Number(prDetail.tax_amount) || 0;
        existingItem.total_price += Number(prDetail.total_price) || 0;
      } else {
        // Calculate base_qty: if approved_base_qty is 0 or null, derive from approved_qty * conversion_factor
        const orderQty = Number(prDetail.approved_qty) || 0;
        const conversionFactor = Number(prDetail.approved_unit_conversion_factor) || 1;
        const baseQty = Number(prDetail.approved_base_qty) || (orderQty * conversionFactor);

        group.items.push({
          sequence: group.items.length + 1,
          product_id: prDetail.product_id,
          product_code: prDetail.product_code || product?.code,
          product_name: prDetail.product_name || product?.name,
          product_local_name: prDetail.product_local_name || product?.local_name,
          product_sku: prDetail.product_sku || product?.sku || product?.code,
          order_unit_id: prDetail.approved_unit_id || prDetail.inventory_unit_id,
          order_unit_name: prDetail.approved_unit_name || prDetail.inventory_unit_name,
          order_unit_conversion_factor: conversionFactor,
          order_qty: orderQty,
          base_unit_id: prDetail.inventory_unit_id || product?.inventory_unit_id,
          base_unit_name: prDetail.inventory_unit_name || product?.inventory_unit_name,
          base_qty: baseQty,
          price: Number(prDetail.pricelist_price) || 0,
          sub_total_price: Number(prDetail.sub_total_price) || (orderQty * (Number(prDetail.pricelist_price) || 0)),
          net_amount: Number(prDetail.net_amount) || (orderQty * (Number(prDetail.pricelist_price) || 0)),
          total_price: Number(prDetail.total_price) || (orderQty * (Number(prDetail.pricelist_price) || 0)),
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
              order_unit_id: prDetail.approved_unit_id || prDetail.inventory_unit_id,
              order_unit_name: prDetail.approved_unit_name || prDetail.inventory_unit_name,
              order_unit_conversion_factor: Number(prDetail.approved_unit_conversion_factor) || 1,
              order_base_qty: Number(prDetail.approved_base_qty) || 0,
              location_id: prDetail.location_id,
              location_code: prDetail.location_code,
              location_name: prDetail.location_name,
              delivery_point_id: prDetail.delivery_point_id,
              delivery_point_name: prDetail.delivery_point_name,
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
    const createdPOs: Record<string, unknown>[] = [];

    const orderDate = new Date();

    await this.prismaService.$transaction(async (prismatx) => {
      // Generate first PO number inside transaction (FOR UPDATE lock prevents duplicates)
      const firstPoNo = await this.generatePONo(orderDate.toISOString(), prismatx);
      let poNoCounter = 0;
      for (const group of groups) {
        // Derive PO number: first one uses generated number, subsequent ones increment
        let poNo: string;
        if (poNoCounter === 0) {
          poNo = firstPoNo;
        } else {
          // Extract the running number portion and increment
          const runningDigits = firstPoNo.match(/\d+$/);
          if (runningDigits) {
            const baseNo = parseInt(runningDigits[0], 10) + poNoCounter;
            const prefix = firstPoNo.slice(0, -runningDigits[0].length);
            poNo = `${prefix}${String(baseNo).padStart(runningDigits[0].length, '0')}`;
          } else {
            poNo = `${firstPoNo}-${poNoCounter + 1}`;
          }
        }
        poNoCounter++;

        // Create PO header
        const po = await prismatx.tb_purchase_order.create({
          data: {
            po_no: poNo,
            po_status: enum_purchase_order_doc_status.in_progress,
            po_type: 'purchase_request',
            description: `PO from PR confirmation`,
            order_date: orderDate.toISOString(),
            delivery_date: group.delivery_date instanceof Date ? group.delivery_date.toISOString() : orderDate.toISOString(),
            vendor_id: group.vendor_id,
            vendor_name: group.vendor_name,
            currency_id: group.currency_id,
            currency_code: group.currency_code,
            exchange_rate: group.exchange_rate,
            total_qty: group.total_qty,
            total_price: group.total_price,
            total_tax: group.total_tax,
            total_amount: group.total_amount,
            workflow_id: resolvedWorkflow?.id,
            workflow_name: resolvedWorkflow?.name,
            buyer_id: group.requestor_id || this.userId,
            buyer_name: group.requestor_name || null,
            is_active: true,
            doc_version: 1,
            created_by_id: group.requestor_id || this.userId,
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
              ...calcBasePrices(item, group.exchange_rate),
              // Product info
              product_id: item.product_id,
              product_code: item.product_code,
              product_name: item.product_name,
              product_local_name: item.product_local_name,
              product_sku: item.product_sku || item.product_code,
              info: {
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

            // Enrich missing unit names from DB
            let orderUnitName = prDetail.order_unit_name || '';
            let baseUnitName = prDetail.order_base_unit_name || '';

            if (!orderUnitName && prDetail.order_unit_id) {
              const unit = await prismatx.tb_unit.findFirst({ where: { id: prDetail.order_unit_id }, select: { name: true } });
              orderUnitName = unit?.name || '';
            }
            if (!baseUnitName && prDetail.order_base_unit_id) {
              const unit = await prismatx.tb_unit.findFirst({ where: { id: prDetail.order_base_unit_id }, select: { name: true } });
              baseUnitName = unit?.name || '';
            }

            await prismatx.tb_purchase_order_detail_tb_purchase_request_detail.create({
              data: {
                po_detail_id: poDetail.id,
                pr_detail_id: prDetail.pr_detail_id,
                pr_detail_order_unit_id: prDetail.order_unit_id,
                pr_detail_order_unit_name: orderUnitName,
                pr_detail_qty: prDetail.order_qty,
                pr_detail_base_qty: prDetail.order_base_qty,
                pr_detail_base_unit_id: prDetail.order_base_unit_id || undefined,
                pr_detail_base_unit_name: baseUnitName,
                location_id: prDetail.location_id || undefined,
                location_code: prDetail.location_code,
                location_name: prDetail.location_name,
                delivery_point_id: prDetail.delivery_point_id || undefined,
                delivery_point_name: prDetail.delivery_point_name,
                created_by_id: this.userId,
              },
            });
          }
        }

        // Auto-submit: initialize workflow so PO appears in approver's pending list
        if (resolvedWorkflow?.data) {
          const totalAmount = Number(group.total_amount ?? 0);
          const firstStageRes = this.masterService.send(
            { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
            { workflowData: resolvedWorkflow.data, currentStatus: '', requestData: { amount: totalAmount } },
          );
          const firstStageNav = await firstValueFrom(firstStageRes);
          const currentStage = firstStageNav.navigation_info?.current_stage_info?.name;

          const navRes = this.masterService.send(
            { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
            { workflowData: resolvedWorkflow.data, currentStatus: currentStage, requestData: { amount: totalAmount } },
          );
          const workflowNav = await firstValueFrom(navRes);
          const now = new Date();

          // Build user_action from workflow stage
          const stageInfo = workflowNav.navigation_info?.current_stage_info;
          let userAction: Record<string, unknown> = {};
          if (stageInfo) {
            const executeUsers = stageInfo.approvers ?? stageInfo.execute ?? [];
            userAction = { execute: executeUsers };
          }

          await prismatx.tb_purchase_order.update({
            where: { id: po.id },
            data: {
              workflow_previous_stage: workflowNav.previous_stage,
              workflow_current_stage: workflowNav.current_stage,
              workflow_next_stage: workflowNav.navigation_info?.workflow_next_step,
              user_action: userAction as any,
              last_action: 'submitted',
              last_action_at_date: now.toISOString(),
              last_action_by_id: this.userId,
              workflow_history: [{
                action: 'submitted',
                datetime: now.toISOString(),
                user: { id: this.userId },
                current_stage: currentStage,
                next_stage: workflowNav.current_stage,
              }] as any,
            },
          });
        }

        createdPOs.push({
          id: po.id,
          po_no: po.po_no,
          vendor_id: po.vendor_id,
          vendor_name: po.vendor_name,
          delivery_date: po.delivery_date,
          currency_id: po.currency_id,
          currency_code: po.currency_code,
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
          updated_at: new Date().toISOString(),
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
  /**
   * Send a notification when a new purchase order is created
   * ส่งการแจ้งเตือนเมื่อสร้างใบสั่งซื้อใหม่
   */
  private async sendPOCreatedNotification(
    purchaseOrder: Record<string, unknown>,
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
   
  /**
   * Send a notification when purchase orders are created from purchase requests
   * ส่งการแจ้งเตือนเมื่อสร้างใบสั่งซื้อจากใบขอซื้อ
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
  /**
   * Export a purchase order to Excel spreadsheet format
   * ส่งออกใบสั่งซื้อเป็นไฟล์สเปรดชีต Excel
   * @param id - Purchase order ID to export / ID ของใบสั่งซื้อที่ต้องการส่งออก
   * @returns Excel file buffer and filename / บัฟเฟอร์ไฟล์ Excel และชื่อไฟล์
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
        currency_code: true,
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
      : purchaseOrder.currency_code || '';

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
  /**
   * Print a purchase order to PDF format
   * พิมพ์ใบสั่งซื้อเป็นไฟล์ PDF
   * @param id - Purchase order ID to print / ID ของใบสั่งซื้อที่ต้องการพิมพ์
   * @returns PDF file buffer and filename / บัฟเฟอร์ไฟล์ PDF และชื่อไฟล์
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
        currency_code: true,
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
    const currencyCode = currency?.code || purchaseOrder.currency_code || '';

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
     
    const docDefinition: any = {
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
            hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table?.body?.length) ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#aaaaaa',
            vLineColor: () => '#aaaaaa',
            fillColor: (rowIndex: number) => (rowIndex === 0 ? '#4472C4' : null),
          },
          margin: [0, 0, 0, 15],
        } as any,

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
        } as any,

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
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const PdfMake = require('pdfmake/build/pdfmake');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
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
  /**
   * Find a purchase order detail line by its ID
   * ค้นหารายละเอียดใบสั่งซื้อรายการเดียวตาม ID
   * @param detailId - Detail line ID / ID ของรายการรายละเอียด
   * @returns Purchase order detail data / ข้อมูลรายละเอียดใบสั่งซื้อ
   */
  @TryCatch
  async findDetailById(detailId: string): Promise<Result<unknown>> {
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
            currency_code: true,
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
  /**
   * Find all detail lines for a specific purchase order
   * ค้นหารายละเอียดทั้งหมดของใบสั่งซื้อที่ระบุ
   * @param purchaseOrderId - Purchase order ID / ID ของใบสั่งซื้อ
   * @returns List of purchase order details / รายการรายละเอียดใบสั่งซื้อ
   */
  @TryCatch
  async findDetailsByPurchaseOrderId(purchaseOrderId: string): Promise<Result<unknown>> {
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
      purchase_order_detail: results,
    });
  }

  /**
   * Create a new Purchase Order Detail
   */
  /**
   * Create a new purchase order detail line item and recalculate totals
   * สร้างรายการรายละเอียดใบสั่งซื้อใหม่และคำนวณยอดรวมใหม่
   * @param purchaseOrderId - Parent purchase order ID / ID ของใบสั่งซื้อหลัก
   * @param detailData - Detail line data / ข้อมูลรายการรายละเอียด
   * @returns Created detail ID / ID ของรายละเอียดที่สร้างแล้ว
   */
  @TryCatch
  async createDetail(purchaseOrderId: string, detailData: IPurchaseOrderDetail): Promise<Result<unknown>> {
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
      // Look up product, order unit, base unit
      const product = detailData.product_id
        ? await prisma.tb_product.findUnique({ where: { id: detailData.product_id } })
        : null;
      const orderUnit = detailData.order_unit_id
        ? await prisma.tb_unit.findUnique({ where: { id: detailData.order_unit_id } })
        : null;
      const baseUnit = detailData.base_unit_id
        ? await prisma.tb_unit.findUnique({ where: { id: detailData.base_unit_id } })
        : null;

      // Create detail
      const newDetail = await prisma.tb_purchase_order_detail.create({
        data: {
          purchase_order_id: purchaseOrderId,
          sequence_no: nextSequenceNo,
          description: detailData.description,
          order_qty: detailData.order_qty || 0,
          order_unit_id: detailData.order_unit_id,
          order_unit_name: detailData.order_unit_name || orderUnit?.name,
          order_unit_conversion_factor: detailData.order_unit_conversion_factor || 1,
          base_qty: detailData.base_qty || 0,
          base_unit_id: detailData.base_unit_id,
          base_unit_name: detailData.base_unit_name || baseUnit?.name,
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
          ...calcBasePrices(detailData, purchaseOrder.exchange_rate),
          note: detailData.note,
          product_id: detailData.product_id,
          product_code: detailData.product_code || product?.code,
          product_name: detailData.product_name || product?.name,
          product_local_name: detailData.product_local_name || product?.local_name,
          product_sku: detailData.product_sku || product?.code,
          info: detailData.info || {},
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
  /**
   * Update an existing purchase order detail line item and recalculate totals
   * อัปเดตรายการรายละเอียดใบสั่งซื้อที่มีอยู่และคำนวณยอดรวมใหม่
   * @param detailId - Detail line ID to update / ID ของรายการรายละเอียดที่ต้องการอัปเดต
   * @param detailData - Updated detail line data / ข้อมูลรายการรายละเอียดที่อัปเดต
   * @returns Updated detail ID / ID ของรายละเอียดที่อัปเดตแล้ว
   */
  @TryCatch
  async updateDetail(detailId: string, detailData: Partial<IPurchaseOrderDetail>): Promise<Result<unknown>> {
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
      // Look up product, order unit, base unit if changed
      const product = detailData.product_id
        ? await prisma.tb_product.findUnique({ where: { id: detailData.product_id } })
        : null;
      const orderUnit = detailData.order_unit_id
        ? await prisma.tb_unit.findUnique({ where: { id: detailData.order_unit_id } })
        : null;
      const baseUnit = detailData.base_unit_id
        ? await prisma.tb_unit.findUnique({ where: { id: detailData.base_unit_id } })
        : null;

      // Update detail
      const updatedDetail = await prisma.tb_purchase_order_detail.update({
        where: { id: detailId },
        data: {
          description: detailData.description ?? existingDetail.description,
          sequence_no: detailData.sequence_no ?? existingDetail.sequence_no,
          product_id: detailData.product_id ?? existingDetail.product_id,
          product_code: detailData.product_code || product?.code || existingDetail.product_code,
          product_name: detailData.product_name || product?.name || existingDetail.product_name,
          product_local_name: detailData.product_local_name || product?.local_name || existingDetail.product_local_name,
          product_sku: detailData.product_sku || product?.code || existingDetail.product_sku,
          order_qty: detailData.order_qty ?? existingDetail.order_qty,
          order_unit_id: detailData.order_unit_id ?? existingDetail.order_unit_id,
          order_unit_name: detailData.order_unit_name || orderUnit?.name || existingDetail.order_unit_name,
          order_unit_conversion_factor: detailData.order_unit_conversion_factor ?? existingDetail.order_unit_conversion_factor,
          base_qty: detailData.base_qty ?? existingDetail.base_qty,
          base_unit_id: detailData.base_unit_id ?? existingDetail.base_unit_id,
          base_unit_name: detailData.base_unit_name || baseUnit?.name || existingDetail.base_unit_name,
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
          ...calcBasePrices(
            {
              price: detailData.price ?? existingDetail.price,
              sub_total_price: detailData.sub_total_price ?? existingDetail.sub_total_price,
              discount_amount: detailData.discount_amount ?? existingDetail.discount_amount,
              net_amount: detailData.net_amount ?? existingDetail.net_amount,
              tax_amount: detailData.tax_amount ?? existingDetail.tax_amount,
              total_price: detailData.total_price ?? existingDetail.total_price,
            },
            existingDetail.tb_purchase_order?.exchange_rate,
          ),
          note: detailData.note ?? existingDetail.note,
          info: detailData.info ?? existingDetail.info,
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
  /**
   * Delete a purchase order detail line item and recalculate totals
   * ลบรายการรายละเอียดใบสั่งซื้อและคำนวณยอดรวมใหม่
   * @param detailId - Detail line ID to delete / ID ของรายการรายละเอียดที่ต้องการลบ
   * @returns Deleted detail ID / ID ของรายละเอียดที่ลบแล้ว
   */
  @TryCatch
  async deleteDetail(detailId: string): Promise<Result<unknown>> {
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
   
  /**
   * Recalculate and update purchase order totals (qty, price, tax, amount) from detail lines
   * คำนวณและอัปเดตยอดรวมใบสั่งซื้อ (จำนวน ราคา ภาษี ยอดรวม) จากรายการรายละเอียด
   * @param prisma - Prisma transaction client / Prisma transaction client
   * @param purchaseOrderId - Purchase order ID / ID ของใบสั่งซื้อ
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
  /**
   * Close a purchase order and update its status to closed
   * ปิดใบสั่งซื้อและอัปเดตสถานะเป็นปิด
   * @param id - Purchase order ID to close / ID ของใบสั่งซื้อที่ต้องการปิด
   * @returns Closed purchase order ID / ID ของใบสั่งซื้อที่ปิดแล้ว
   */
  @TryCatch
  async closePO(id: string): Promise<Result<unknown>> {
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
          last_action_at_date: new Date().toISOString(),
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
   
  /**
   * Send a notification when a purchase order is closed
   * ส่งการแจ้งเตือนเมื่อปิดใบสั่งซื้อ
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

  /**
   * Find all purchase orders pending approval for the current user across business units
   * ค้นหาใบสั่งซื้อทั้งหมดที่รอการอนุมัติของผู้ใช้ปัจจุบันจากทุกหน่วยธุรกิจ
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code(s) / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @returns Paginated list of pending purchase orders / รายการใบสั่งซื้อที่รออนุมัติที่แบ่งหน้าแล้ว
   */
  @TryCatch
  async findAllMyPending(
    user_id: string,
    bu_code: string | string[],
    paginate: IPaginate,
  ): Promise<Result<any>> {
    this.logger.debug(
      { function: 'findAllMyPending', user_id, bu_code, paginate },
      PurchaseOrderService.name,
    );
    const defaultSearchFields = ['po_no', 'description'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter)
        ? paginate.filter
        : {},
      paginate.sort,
      paginate.advance,
    );
    const results = [];

    let bu_codes: string[] = [];

    const isEmpty = !bu_code || (Array.isArray(bu_code) && bu_code.length === 0);
    if (isEmpty) {
      const bus = await this.prismaSystem.tb_user_tb_business_unit.findMany({
        where: { user_id, is_active: true },
        include: { tb_business_unit: true },
      });
      bu_codes = bus.map((b) => b.tb_business_unit.code);
    } else {
      bu_codes = Array.isArray(bu_code) ? bu_code : [bu_code];
    }

    for (const code of bu_codes) {
      try {
        const tenant = await this.tenantService.getdb_connection(user_id, code);

        if (!tenant) {
          this.logger.warn({
            function: 'findAllMyPending',
            message: `Tenant not found for bu_code: ${code}, skipping`,
          });
          continue;
        }

        const prisma = await this.prismaTenant(
          tenant.tenant_id,
          tenant.db_connection,
        );

        const bu_detail = await this.prismaSystem.tb_business_unit.findFirst({
          where: { code: code },
        });

        if (!bu_detail) {
          this.logger.warn({
            function: 'findAllMyPending',
            message: `Business unit ${code} not found, skipping`,
          });
          continue;
        }

        const standardQuery = q.findMany();

        const userPermissionFilter = {
          OR: [
            {
              user_action: {
                path: ['execute'],
                array_contains: [{ user_id: user_id }],
              },
            },
            {
              po_status: enum_purchase_order_doc_status.draft,
              buyer_id: user_id,
            },
          ],
        };

        const combinedWhere = {
          AND: [
            standardQuery.where,
            userPermissionFilter,
          ],
        };

        const purchaseOrders = await prisma.tb_purchase_order
          .findMany({
            ...standardQuery,
            where: combinedWhere,
            include: {
              tb_vendor: { select: { id: true, name: true, code: true } },
              tb_currency_tb_purchase_order_currency_idTotb_currency: { select: { id: true, name: true, code: true, symbol: true } },
              tb_purchase_order_detail: { select: { net_amount: true, base_net_amount: true, total_price: true, base_total_price: true } },
            },
          })
          .then((res) => {
            return res.map((po) => {
              let net_amount = 0;
              let base_net_amount = 0;
              let base_total_amount = 0;
              for (const detail of po.tb_purchase_order_detail) {
                net_amount += Number(detail.net_amount || 0);
                base_net_amount += Number(detail.base_net_amount || 0);
                base_total_amount += Number(detail.base_total_price || 0);
              }
              return {
                id: po.id,
                po_no: po.po_no,
                po_status: po.po_status,
                description: po.description,
                order_date: po.order_date,
                delivery_date: po.delivery_date,
                vendor_name: po.tb_vendor?.name ?? po.vendor_name ?? null,
                currency_code: po.tb_currency_tb_purchase_order_currency_idTotb_currency?.code ?? po.currency_code ?? null,
                exchange_rate: Number(po.exchange_rate),
                buyer_name: po.buyer_name,
                total_qty: Number(po.total_qty),
                total_price: Number(po.total_price),
                total_tax: Number(po.total_tax),
                net_amount,
                base_net_amount,
                total_amount: Number(po.total_amount),
                base_total_amount,
                workflow_current_stage: po.workflow_current_stage,
                workflow_next_stage: po.workflow_next_stage,
                workflow_previous_stage: po.workflow_previous_stage,
                last_action: po.last_action,
                doc_version: po.doc_version,
                created_at: po.created_at,
              };
            });
          });

        const total = await prisma.tb_purchase_order.count({
          where: combinedWhere,
        });

        const serializedPurchaseOrders = purchaseOrders.map((item) =>
          PurchaseOrderListItemResponseSchema.parse(item),
        );

        results.push({
          bu_code: code,
          bu_name: bu_detail.name,
          bu_alias_name: bu_detail.alias_name,
          paginate: {
            total: total,
            page: Number(paginate.page),
            perpage: Number(paginate.perpage),
            pages: total == 0 ? 1 : Math.ceil(total / Number(paginate.perpage)),
          },
          data: serializedPurchaseOrders,
        });
      } catch (error) {
        this.logger.warn({
          function: 'findAllMyPending',
          message: `Error processing bu_code: ${code}, skipping`,
          error: error instanceof Error ? error.message : error,
        });
        continue;
      }
    }

    return Result.ok(results);
  }

  /**
   * Get the count of purchase orders pending approval for the current user
   * นับจำนวนใบสั่งซื้อที่รอการอนุมัติของผู้ใช้ปัจจุบัน
   * @param user_id - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @returns Count of pending purchase orders / จำนวนใบสั่งซื้อที่รออนุมัติ
   */
  async findAllMyPendingCount(user_id: string, bu_code: string | string[]): Promise<any> {
    this.logger.debug(
      { function: 'findAllMyPendingCount', user_id, bu_code },
      PurchaseOrderService.name,
    );

    const paginate: IPaginate = {
      page: 1,
      perpage: 1,
      search: '',
      searchfields: ['po_no', 'description'],
      filter: {},
      sort: [],
      advance: {},
    };
    const defaultSearchFields = ['po_no', 'description'];

    const q = new QueryParams(
      paginate.page,
      paginate.perpage,
      paginate.search,
      paginate.searchfields,
      defaultSearchFields,
      typeof paginate.filter === 'object' && !Array.isArray(paginate.filter)
        ? paginate.filter
        : {},
      paginate.sort,
      paginate.advance,
    );
    const results = [];

    let bu_codes: string[] = [];

    const isEmpty = !bu_code || (Array.isArray(bu_code) && bu_code.length === 0);
    if (isEmpty) {
      const bus = await this.prismaSystem.tb_user_tb_business_unit.findMany({
        where: { user_id, is_active: true },
        include: { tb_business_unit: true },
      });
      bu_codes = bus.map((b) => b.tb_business_unit.code);
    } else {
      bu_codes = Array.isArray(bu_code) ? bu_code : [bu_code];
    }

    for (const code of bu_codes) {
      try {
        const tenant = await this.tenantService.getdb_connection(user_id, code);

        if (!tenant) {
          this.logger.warn({
            function: 'findAllMyPendingCount',
            message: `Tenant not found for bu_code: ${code}, skipping`,
          });
          continue;
        }

        const prisma = await this.prismaTenant(
          tenant.tenant_id,
          tenant.db_connection,
        );

        const bu_detail = await this.prismaSystem.tb_business_unit.findFirst({
          where: { code: code },
        });

        if (!bu_detail) {
          this.logger.warn({
            function: 'findAllMyPendingCount',
            message: `Business unit ${code} not found, skipping`,
          });
          continue;
        }

        const standardQuery = q.findMany();

        const total = await prisma.tb_purchase_order.count({
          where: {
            ...standardQuery.where,
            OR: [
              {
                user_action: {
                  path: ['execute'],
                  array_contains: [{ user_id: user_id }],
                },
              },
              {
                po_status: enum_purchase_order_doc_status.draft,
                buyer_id: user_id,
              },
            ],
          },
        });

        results.push({
          total: total,
        });
      } catch (error) {
        this.logger.warn({
          function: 'findAllMyPendingCount',
          message: `Error processing bu_code: ${code}, skipping`,
          error: error instanceof Error ? error.message : error,
        });
        continue;
      }
    }

    const total = results.reduce((acc, curr) => acc + curr.total, 0);
    this.logger.debug({
      function: 'findAllMyPendingCount',
      user_id,
      total,
    });

    return Result.ok({ pending: total });
  }

  /**
   * Get previous workflow stages for a purchase order
   * ดึงขั้นตอนอนุมัติก่อนหน้า current_stage ของใบสั่งซื้อ
   */
  @TryCatch
  async getPreviousStages(po_id: string): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'getPreviousStages', po_id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const po = await this.prismaService.tb_purchase_order.findFirst({
      where: { id: po_id, deleted_at: null },
      select: {
        id: true,
        workflow_id: true,
        workflow_current_stage: true,
      },
    });

    if (!po) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    if (!po.workflow_id || !po.workflow_current_stage) {
      return Result.error('No workflow assigned to this purchase order', ErrorCode.NOT_FOUND);
    }

    const numberedStages = await this.workflowOrchestrator.getPreviousStages(
      po.workflow_id, po.workflow_current_stage, this.userId, this.bu_code,
    );

    return Result.ok(numberedStages);
  }

  /**
   * Get all workflow stages for purchase orders owned by the user (for stage filter dropdown)
   * ดึงขั้นตอนทั้งหมดของ workflow ที่ใช้ในใบสั่งซื้อของผู้ใช้
   */
  @TryCatch
  async findAllWorkflowStagesByPo(
    user_id: string,
    bu_code: string,
  ): Promise<Result<unknown>> {
    const tenant = await this.tenantService.getdb_connection(user_id, bu_code);

    if (!tenant) {
      return Result.error('Tenant not found', ErrorCode.NOT_FOUND);
    }

    const prisma = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const results = await prisma.tb_purchase_order.findMany({
      where: { created_by_id: user_id },
      select: { workflow_id: true },
      distinct: ['workflow_id'],
    });

    const stages = await this.workflowOrchestrator.findAllWorkflowStages(
      results.map((r) => r.workflow_id),
      user_id,
      bu_code,
    );

    return Result.ok(stages);
  }

  /**
   * Get distinct workflow stages where user has pending actions
   * ดึงขั้นตอนที่ผู้ใช้มีงานรออนุมัติ
   */
  @TryCatch
  async findAllMyPendingStages(): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAllMyPendingStages', user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const stages = await this.prismaService.tb_purchase_order.findMany({
      where: {
        workflow_current_stage: { not: null },
        OR: [
          {
            po_status: enum_purchase_order_doc_status.draft,
            created_by_id: this.userId,
          },
          {
            user_action: {
              path: ['execute'],
              array_contains: [{ user_id: this.userId }],
            },
          },
        ],
      },
      select: { workflow_current_stage: true },
      distinct: ['workflow_current_stage'],
    });

    return Result.ok(stages.map((s) => s.workflow_current_stage));
  }

  // ─── Print via micro-report (FastReport Viewer) ───

  /**
   * Build PO data + send to micro-report for FastReport viewer rendering.
   * Returns { viewer_url } that the frontend opens in an iframe/tab.
   * Template designer maps POHeader/PODetail dataset columns → template fields.
   */
  @TryCatch
  async printToReport(id: string): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id, user_id: this.userId, tenant_id: this.bu_code },
      PurchaseOrderService.name,
    );

    const po = await this.prismaService.tb_purchase_order.findFirst({
      where: { id },
      include: {
        tb_purchase_order_detail: { orderBy: { sequence_no: 'asc' } },
      },
    });
    if (!po) {
      return Result.error('Purchase order not found', ErrorCode.NOT_FOUND);
    }

    return renderViaMicroReport({
      prismaSystem: this.prismaSystem,
      bu_code: this.bu_code,
      documentType: 'PO',
      datasetPrefix: 'PO',
      buildHeader: () => ({
        PoNo: po.po_no || '',
        PoDate: formatReportDate(po.order_date),
        DeliveryDate: formatReportDate(po.delivery_date),
        VendorName: po.vendor_name || '',
        Currency: po.currency_code || '',
        Description: po.description || '',
        PoStatus: po.po_status || '',
        WorkflowName: po.workflow_name || '',
        TotalAmount: Number(po.total_amount) || 0,
      }),
      buildDetail: () =>
        po.tb_purchase_order_detail.map((d, i) => ({
          No: String(i + 1),
          ProductName: d.product_name || '',
          OrderQty: Number(d.order_qty) || 0,
          UnitName: d.order_unit_name || '',
          UnitPrice: Number(d.price) || 0,
          NetAmount: Number(d.net_amount) || 0,
        })),
    });
  }
}

// Force reload at Wed Jan 28 09:54:59 AM +07 2026
