import { BadRequestException, Injectable } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { NotificationService, NotificationType, Result } from '@/common';
import { WorkflowHeader } from '@/common/workflow/workflow.interfaces';
import { WorkflowOrchestratorService } from '@/common/workflow/workflow-orchestrator.service';
import { poToWorkflowDocument } from './workflow/po-workflow.mapper';
import { IPaginate } from '@/common/shared-interface/paginate.interface';
import { enum_purchase_order_doc_status, enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import {
  ApprovePurchaseOrderDto,
  RejectPurchaseOrderDto,
  ReviewPurchaseOrderDto,
  SavePurchaseOrderDto,
  SavePurchaseOrderDataDto,
} from './dto/approve-purchase-order.dto';
import { CreatePurchaseOrderDto, CreatePurchaseOrderDataDto } from './dto/create-purchase-order.dto';
import { ICreatePurchaseOrder } from './interface/purchase-order.interface';

// Re-export for backward compatibility
export { WorkflowHeader } from '@/common/workflow/workflow.interfaces';
export type { UserActionProfile } from '@/common/workflow/workflow.interfaces';

@Injectable()
export class PurchaseOrderLogic {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseOrderLogic.name,
  );

  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly mapperLogic: MapperLogic,
    private readonly notificationService: NotificationService,
    private readonly workflowOrchestrator: WorkflowOrchestratorService,
  ) { }

  async submit(
    id: string,
    payload: { stage_role: string; details: { id: string; stage_status: string; stage_message?: string | null }[] },
    user_id: string,
    tenant_id: string,
  ) {
    this.logger.debug({ function: 'submit', id, user_id, tenant_id }, PurchaseOrderLogic.name);
    this.purchaseOrderService.userId = user_id;
    this.purchaseOrderService.bu_code = tenant_id;
    await this.purchaseOrderService.initializePrismaService(tenant_id, user_id);

    const poResult = await this.purchaseOrderService.findById(id);
    if (poResult.isError()) throw new Error('Purchase Order not found');
    const poData = poResult.value;

    if (!poData?.workflow_id) {
      throw new Error('Cannot submit PO: workflow not found. Please set workflow_id on the purchase order before submitting.');
    }
    if (!poData?.purchase_order_detail?.length) {
      throw new Error('Cannot submit PO: PO must have at least one detail line.');
    }

    const creatorDept = await this.getCreatorDepartment(poData.created_by_id);
    const workflowDoc = poToWorkflowDocument(poData, creatorDept);
    const workflow = await this.workflowOrchestrator.buildSubmitWorkflow(
      workflowDoc, user_id, tenant_id,
    );

    const result = await this.purchaseOrderService.submit(id, payload, workflow as unknown as Record<string, unknown>);

    if (result.isOk()) {
      this.sendSubmitNotification(poData, workflow, user_id, workflow.last_action_by_name);
    }

    return result;
  }

  private async sendSubmitNotification(poData: any, workflow: any, userId: string, userName: string) {
    try {
      const poNo = poData.po_no || 'N/A';
      const assignedUsers = workflow.user_action?.execute || [];
      for (const assignedUser of assignedUsers) {
        const targetUserId = typeof assignedUser === 'string' ? assignedUser : assignedUser?.id;
        if (!targetUserId || targetUserId === userId) continue;
        await this.notificationService.sendPONotification(
          targetUserId,
          `Purchase Order Submitted: ${poNo}`,
          `Purchase Order ${poNo} has been submitted for approval.`,
          { po_id: poData.id, po_no: poNo, action: 'submitted' },
          userId,
        );
      }
    } catch (error) {
      this.logger.error({ function: 'sendSubmitNotification', error: (error as Error).message }, PurchaseOrderLogic.name);
    }
  }

  async create(
    payload: CreatePurchaseOrderDto,
    user_id: string,
    tenant_id: string,
  ) {
    const data = payload.details;
    this.purchaseOrderService.userId = user_id;
    this.purchaseOrderService.bu_code = tenant_id;
    await this.purchaseOrderService.initializePrismaService(tenant_id, user_id);

    // Extract IDs for bulk population
    const extractIds = this.populateCreateData(data);
     
    const foreignValue: Record<string, any> = await this.mapperLogic.populate(extractIds, user_id, tenant_id);

    // Enrich header
    const enrichedData = {
      ...data,
      workflow_name: foreignValue?.workflow_id?.name,
    } as ICreatePurchaseOrder;

    // Enrich location data in details
    if (enrichedData.purchase_order_detail?.add) {
      for (const detail of enrichedData.purchase_order_detail.add) {
        if (!detail.locations) continue;
        for (const loc of detail.locations) {
          if (loc.location_id) {
            const location = this.findByIdInArray(foreignValue?.location_ids, loc.location_id);
            if (location) {
              loc.location_code = loc.location_code || location.code;
              loc.location_name = loc.location_name || location.name;
            }
          }
          if (loc.delivery_point_id) {
            const dp = this.findByIdInArray(foreignValue?.delivery_point_ids, loc.delivery_point_id);
            if (dp) {
              loc.delivery_point_name = loc.delivery_point_name || dp.name;
            }
          }
        }
      }
    }

    return this.purchaseOrderService.create(enrichedData);
  }

  async save(
    id: string,
    payload: SavePurchaseOrderDto,
    user_id: string,
    tenant_id: string,
  ) {
    this.purchaseOrderService.userId = user_id;
    this.purchaseOrderService.bu_code = tenant_id;
    await this.purchaseOrderService.initializePrismaService(tenant_id, user_id);

    const { stage_role, details: data } = payload;

    if (stage_role === enum_stage_role.create) {
      // Creator can edit everything: header + details (add/update/remove)
      const extractIds = this.populateSaveData(data);
       
      const foreignValue: Record<string, any> = await this.mapperLogic.populate(extractIds, user_id, tenant_id);

      const header = this.enrichSaveHeader(data, foreignValue);

       
      const details: Record<string, any> = {};
      if (data.purchase_order_detail?.add) {
        details.add = data.purchase_order_detail.add.map((d) => this.enrichSaveDetail(d, foreignValue));
      }
      if (data.purchase_order_detail?.update) {
        details.update = data.purchase_order_detail.update.map((d) => ({
          ...this.enrichSaveDetail(d, foreignValue),
          id: (d as { id: string }).id,
        }));
      }
      if (data.purchase_order_detail?.remove) {
        details.remove = data.purchase_order_detail.remove;
      }

      this.logger.debug(
        { function: 'save', id, stage_role, header, details, user_id, tenant_id },
        PurchaseOrderLogic.name,
      );

      return this.purchaseOrderService.save(id, header, details);
    } else {
      // Non-creator roles (approve, purchase, etc.) — details is a flat array like submit/reject
      const detailUpdates = (data as { id: string; current_stage_status?: string }[]).map((d) => ({
        id: d.id,
        current_stage_status: d.current_stage_status,
      }));

      this.logger.debug(
        { function: 'save', id, stage_role, detailUpdates, user_id, tenant_id },
        PurchaseOrderLogic.name,
      );

      return this.purchaseOrderService.saveDetailStageStatus(id, detailUpdates);
    }
  }

  async approve(
    id: string,
    { stage_role, details }: ApprovePurchaseOrderDto,
    user_id: string,
    tenant_id: string,
  ) {
    this.purchaseOrderService.userId = user_id;
    this.purchaseOrderService.bu_code = tenant_id;
    await this.purchaseOrderService.initializePrismaService(tenant_id, user_id);

    await this.validateUserStageRole(id, stage_role);

    const purchaseOrderResult = await this.purchaseOrderService.findById(id);
    if (purchaseOrderResult.isError()) {
      throw new Error('Purchase Order not found');
    }
    const purchaseOrderData = purchaseOrderResult.value;

    const creatorDept = await this.getCreatorDepartment(purchaseOrderData.created_by_id);
    const workflowDoc = poToWorkflowDocument(purchaseOrderData, creatorDept);
    const { workflow, isFinalApproval } = await this.workflowOrchestrator.buildApproveWorkflow(
      workflowDoc, user_id, tenant_id,
    );

    // PO-specific: add po_status and approval_date to the workflow object
    const poWorkflow = {
      ...workflow,
      po_status: isFinalApproval
        ? enum_purchase_order_doc_status.sent
        : enum_purchase_order_doc_status.in_progress,
      ...(isFinalApproval ? { approval_date: workflow.last_action_at_date } : {}),
    };

    this.logger.debug(
      { function: 'approve', id, stage_role, details, user_id, tenant_id },
      PurchaseOrderLogic.name,
    );
    const result = await this.purchaseOrderService.approve(id, poWorkflow, details);

    this.sendApproveNotification(purchaseOrderData, workflow, user_id, workflow.last_action_by_name, tenant_id);

    return result;
  }

  async reject(
    id: string,
    { stage_role, details }: RejectPurchaseOrderDto,
    user_id: string,
    tenant_id: string,
  ) {
    this.purchaseOrderService.userId = user_id;
    this.purchaseOrderService.bu_code = tenant_id;
    await this.purchaseOrderService.initializePrismaService(tenant_id, user_id);

    await this.validateUserStageRole(id, stage_role);

    const purchaseOrderResult = await this.purchaseOrderService.findById(id);
    if (purchaseOrderResult.isError()) {
      throw new Error('Purchase Order not found');
    }
    const purchaseOrderData = purchaseOrderResult.value;

    const workflowDoc = poToWorkflowDocument(purchaseOrderData, null);
    const workflow = await this.workflowOrchestrator.buildRejectWorkflow(
      workflowDoc, user_id, tenant_id,
    );

    this.logger.debug(
      { function: 'reject', id, stage_role, details, user_id, tenant_id },
      PurchaseOrderLogic.name,
    );
    const result = await this.purchaseOrderService.reject(id, workflow as unknown as Record<string, unknown>, details);

    this.sendRejectNotification(purchaseOrderData, user_id, workflow.last_action_by_name, tenant_id);

    return result;
  }

  async review(
    id: string,
    body: ReviewPurchaseOrderDto,
    user_id: string,
    tenant_id: string,
  ) {
    this.purchaseOrderService.userId = user_id;
    this.purchaseOrderService.bu_code = tenant_id;
    await this.purchaseOrderService.initializePrismaService(tenant_id, user_id);

    await this.validateUserStageRole(id, body.stage_role);

    const purchaseOrderResult = await this.purchaseOrderService.findById(id);
    if (purchaseOrderResult.isError()) {
      throw new Error('Purchase Order not found');
    }
    const purchaseOrderData = purchaseOrderResult.value;

    const creatorDept = await this.getCreatorDepartment(purchaseOrderData.created_by_id);
    const workflowDoc = poToWorkflowDocument(purchaseOrderData, creatorDept);
    const workflow = await this.workflowOrchestrator.buildReviewWorkflow(
      workflowDoc, body.des_stage, user_id, tenant_id,
    );

    this.logger.debug(
      { function: 'review', id, body, user_id, tenant_id },
      PurchaseOrderLogic.name,
    );
    const result = await this.purchaseOrderService.review(id, workflow as unknown as Record<string, unknown>, body.details);

    this.sendReviewNotification(purchaseOrderData, workflow, user_id, workflow.last_action_by_name, tenant_id);

    return result;
  }

   
  private populateCreateData(data: CreatePurchaseOrderDataDto): Record<string, any> {
    const workflow_id = data.workflow_id;
    const location_ids: string[] = [];
    const delivery_point_ids: string[] = [];

    const allDetails = data.purchase_order_detail?.add || [];
    for (const detail of allDetails) {
      for (const loc of detail.locations || []) {
        if (loc.location_id) location_ids.push(loc.location_id);
        if (loc.delivery_point_id) delivery_point_ids.push(loc.delivery_point_id);
      }
    }

    return { workflow_id, location_ids, delivery_point_ids };
  }

   
  private populateSaveData(data: SavePurchaseOrderDataDto): Record<string, any> {
    const unit_ids: string[] = [];
    const tax_profile_ids: string[] = [];
    const product_ids: string[] = [];
    const vendor_ids: string[] = [];
    const currency_ids: string[] = [];
    // Header IDs
    if (data.vendor_id) vendor_ids.push(data.vendor_id);
    if (data.currency_id) currency_ids.push(data.currency_id);

    // Collect IDs from add and update details
    const allDetails = [...(data.purchase_order_detail?.add || []), ...(data.purchase_order_detail?.update || [])];
    for (const detail of allDetails) {
      if (detail.product_id) product_ids.push(detail.product_id);
      if (detail.order_unit_id) unit_ids.push(detail.order_unit_id);
      if (detail.base_unit_id) unit_ids.push(detail.base_unit_id);
      if (detail.tax_profile_id) tax_profile_ids.push(detail.tax_profile_id);
    }

    return {
      unit_ids,
      tax_profile_ids,
      product_ids,
      vendor_ids,
      currency_ids,
      workflow_id: data.workflow_id,
      buyer_id: data.buyer_id,
    };
  }

   
  private enrichSaveHeader(data: SavePurchaseOrderDataDto, foreignValue: Record<string, any>): Partial<SavePurchaseOrderDataDto> {
    const header: Record<string, unknown> = {};
    if (data.vendor_id !== undefined) header.vendor_id = data.vendor_id;
    if (data.vendor_id) {
      header.vendor_name = this.findByIdInArray(foreignValue?.vendor_ids, data.vendor_id)?.name || data.vendor_name;
    }
    if (data.delivery_date !== undefined) header.delivery_date = data.delivery_date;
    if (data.currency_id !== undefined) header.currency_id = data.currency_id;
    if (data.currency_id) {
      header.currency_code = this.findByIdInArray(foreignValue?.currency_ids, data.currency_id)?.code || data.currency_code;
    }
    if (data.exchange_rate !== undefined) header.exchange_rate = data.exchange_rate;
    if (data.description !== undefined) header.description = data.description;
    if (data.order_date !== undefined) header.order_date = data.order_date;
    if (data.credit_term_id !== undefined) header.credit_term_id = data.credit_term_id;
    if (data.credit_term_name !== undefined) header.credit_term_name = data.credit_term_name;
    if (data.credit_term_value !== undefined) header.credit_term_value = data.credit_term_value;
    if (data.buyer_id !== undefined) header.buyer_id = data.buyer_id;
    if (data.buyer_id) {
      // Resolve full name from auth service via userMapper. Falls back to the
      // client-supplied name only if the lookup returned nothing.
      const buyer = foreignValue?.buyer_id;
      const lookedUpName = buyer?.name || buyer?.username;
      header.buyer_name = lookedUpName || data.buyer_name;
    } else if (data.buyer_name !== undefined) {
      header.buyer_name = data.buyer_name;
    }
    if (data.email !== undefined) header.email = data.email;
    if (data.remarks !== undefined) header.remarks = data.remarks;
    if (data.note !== undefined) header.note = data.note;
    if (data.workflow_id !== undefined) header.workflow_id = data.workflow_id;
    if (data.workflow_id) {
      header.workflow_name = foreignValue?.workflow_id?.name;
    }
    return header;
  }

   
  private enrichSaveDetail(detail: Record<string, any>, foreignValue: Record<string, any>): Record<string, any> {
    const product = this.findByIdInArray(foreignValue?.product_ids, detail.product_id);
    return JSON.parse(
      JSON.stringify({
        ...detail,
        product_code: product?.code || detail.product_code,
        product_name: product?.name || detail.product_name,
        product_local_name: product?.local_name || detail.product_local_name,
        product_sku: product?.code || detail.product_sku,
        order_unit_name:
          this.findByIdInArray(foreignValue?.unit_ids, detail.order_unit_id)?.name || detail.order_unit_name,
        base_unit_name:
          this.findByIdInArray(foreignValue?.unit_ids, detail.base_unit_id)?.name || detail.base_unit_name,
        tax_profile_name:
          this.findByIdInArray(foreignValue?.tax_profile_ids, detail.tax_profile_id)?.name || detail.tax_profile_name,
      }),
    );
  }

   
  private findByIdInArray(arr: Record<string, any>[] | undefined, id: string | undefined): Record<string, any> | null {
    if (!arr || !id) return null;
    return arr.find((item) => item.id === id) || null;
  }

  private async validateUserStageRole(
    id: string,
    payloadStageRole: enum_stage_role,
  ): Promise<void> {
    const purchaseOrderResult = await this.purchaseOrderService.findById(id);
    if (purchaseOrderResult.isError()) {
      throw new BadRequestException('Purchase Order not found');
    }

    const purchaseOrder = purchaseOrderResult.value;
    const userActualRole = purchaseOrder.role;

    if (userActualRole === enum_stage_role.view_only) {
      throw new BadRequestException(
        `User does not have permission to perform this action. User role: ${userActualRole}`,
      );
    }

    if (payloadStageRole !== userActualRole) {
      throw new BadRequestException(
        `Invalid stage_role. Expected: ${userActualRole}, Received: ${payloadStageRole}`,
      );
    }
  }

  private async getCreatorDepartment(
    created_by_id: string,
  ): Promise<{ id: string; name: string } | null> {
    try {
      const prisma = this.purchaseOrderService.prismaService;
      const departmentUser = await prisma.tb_department_user.findFirst({
        where: {
          user_id: created_by_id,
          deleted_at: null,
          OR: [{ is_hod: false }, { is_hod: null }],
        },
        select: {
          department_id: true,
          tb_department: {
            select: { name: true },
          },
        },
      });
      if (!departmentUser) return null;
      return {
        id: departmentUser.department_id,
        name: departmentUser.tb_department?.name ?? null,
      };
    } catch {
      return null;
    }
  }

   
  // buildUserAction removed — now handled by WorkflowOrchestratorService

  private async sendApproveNotification(
     
    purchaseOrder: Record<string, any>,
    workflow: WorkflowHeader,
    user_id: string,
    user_name: string,
    bu_code: string,
  ): Promise<void> {
    try {
      const isFinalApproval = workflow.workflow_next_stage === '-';
      const poNo = purchaseOrder.po_no;

      if (isFinalApproval) {
        const recipientId = purchaseOrder.buyer_id || purchaseOrder.created_by_id;
        if (recipientId) {
          await this.notificationService.sendToUsers({
            to_user_ids: [recipientId],
            from_user_id: user_id,
            title: `Purchase Order Approved: ${poNo}`,
            message: `PO ${poNo} has been approved by ${user_name}`,
            type: NotificationType.PO,
            metadata: {
              type: 'purchase-order',
              id: purchaseOrder.id,
              bu_code: bu_code,
              action: 'approved',
            },
          });
        }
      } else {
        const nextApproverIds = workflow.user_action?.execute?.map((u) => u.user_id) || [];
        if (nextApproverIds.length > 0) {
          await this.notificationService.sendToUsers({
            to_user_ids: nextApproverIds,
            from_user_id: user_id,
            title: `Purchase Order Pending Approval: ${poNo}`,
            message: `PO ${poNo} requires your approval at stage: ${workflow.workflow_current_stage}`,
            type: NotificationType.PO,
            metadata: {
              type: 'purchase-order',
              id: purchaseOrder.id,
              bu_code: bu_code,
              action: 'pending_approval',
            },
          });
        }
      }

      this.logger.log(`Notification sent for PO ${poNo}`);
    } catch (error) {
      this.logger.error(
        { function: 'sendApproveNotification', error: (error as Error).message },
        PurchaseOrderLogic.name,
      );
    }
  }

  private async sendRejectNotification(
     
    purchaseOrder: Record<string, any>,
    user_id: string,
    user_name: string,
    bu_code: string,
  ): Promise<void> {
    try {
      const poNo = purchaseOrder.po_no;
      const recipientId = purchaseOrder.buyer_id || purchaseOrder.created_by_id;
      if (recipientId) {
        await this.notificationService.sendToUsers({
          to_user_ids: [recipientId],
          from_user_id: user_id,
          title: `Purchase Order Rejected: ${poNo}`,
          message: `PO ${poNo} has been rejected by ${user_name}`,
          type: NotificationType.PO,
          metadata: {
            type: 'purchase-order',
            id: purchaseOrder.id,
            bu_code: bu_code,
            action: 'rejected',
          },
        });
      }

      this.logger.log(`Reject notification sent for PO ${poNo}`);
    } catch (error) {
      this.logger.error(
        { function: 'sendRejectNotification', error: (error as Error).message },
        PurchaseOrderLogic.name,
      );
    }
  }

  private async sendReviewNotification(
     
    purchaseOrder: Record<string, any>,
    workflow: WorkflowHeader,
    user_id: string,
    user_name: string,
    bu_code: string,
  ): Promise<void> {
    try {
      const poNo = purchaseOrder.po_no;

      // Notify buyer/creator that PO was sent back for review
      const recipientId = purchaseOrder.buyer_id || purchaseOrder.created_by_id;
      if (recipientId) {
        await this.notificationService.sendToUsers({
          to_user_ids: [recipientId],
          from_user_id: user_id,
          title: `Purchase Order Reviewed: ${poNo}`,
          message: `PO ${poNo} has been sent back for review by ${user_name}`,
          type: NotificationType.PO,
          metadata: {
            type: 'purchase-order',
            id: purchaseOrder.id,
            bu_code: bu_code,
            action: 'reviewed',
          },
        });
      }

      // Notify users at the target stage
      const actionUserIds = workflow.user_action?.execute?.map((u) => u.user_id) || [];
      if (actionUserIds.length > 0) {
        await this.notificationService.sendToUsers({
          to_user_ids: actionUserIds,
          from_user_id: user_id,
          title: `Purchase Order Requires Action: ${poNo}`,
          message: `PO ${poNo} has been sent back to stage: ${workflow.workflow_current_stage}`,
          type: NotificationType.PO,
          metadata: {
            type: 'purchase-order',
            id: purchaseOrder.id,
            bu_code: bu_code,
            action: 'review_action_required',
          },
        });
      }

      this.logger.log(`Review notification sent for PO ${poNo}`);
    } catch (error) {
      this.logger.error(
        { function: 'sendReviewNotification', error: (error as Error).message },
        PurchaseOrderLogic.name,
      );
    }
  }

  /**
   * Find all POs for GRN: query from service, enrich missing data, return result.
   */
  async findAllForGrn(paginate: IPaginate): Promise<Result<unknown>> {
    const result = await this.purchaseOrderService.findAllForGrn(paginate);
    if (!result.isOk) return result;

    const val = result.value as { data: unknown; rawPurchaseOrders: any[]; paginate: unknown };
    if (!val?.rawPurchaseOrders) return result;

    await this.enrichGrnData(val.rawPurchaseOrders);
    return Result.ok({
      data: val.data,
      paginate: val.paginate,
    });
  }

  async findVendorsForGrn(paginate: IPaginate): Promise<Result<unknown>> {
    return this.purchaseOrderService.findVendorsForGrn(paginate);
  }

  async findAllForGrnByVendorId(vendorId: string, paginate: IPaginate): Promise<Result<unknown>> {
    return this.purchaseOrderService.findAllForGrnByVendorId(vendorId, paginate);
  }

  /**
   * Enrich null/empty denormalized fields on PO details, PR details, and junction rows.
   * Batch-fetches from tb_product, tb_location, tb_unit then updates the DB rows.
   */
  async enrichGrnData(purchaseOrders: any[]): Promise<void> {
    const prisma = this.purchaseOrderService.prismaService;

    // Collect IDs that need enrichment
    const productIdsToEnrich = new Set<string>();
    const locationIdsToEnrich = new Set<string>();
    const unitIdsToEnrich = new Set<string>();

    // Track which rows need updating
    const poDetailUpdates: { id: string; data: Record<string, string> }[] = [];
    const prDetailUpdates: { id: string; data: Record<string, string> }[] = [];
    const junctionUpdates: { id: string; data: Record<string, string> }[] = [];

    for (const po of purchaseOrders) {
      for (const detail of po.tb_purchase_order_detail) {
        if (detail.product_id && (!detail.product_name?.trim() || !detail.product_code?.trim())) {
          productIdsToEnrich.add(detail.product_id);
        }
        if (detail.order_unit_id && !detail.order_unit_name?.trim()) {
          unitIdsToEnrich.add(detail.order_unit_id);
        }
        if (detail.base_unit_id && !detail.base_unit_name?.trim()) {
          unitIdsToEnrich.add(detail.base_unit_id);
        }

        for (const prLink of detail.tb_purchase_order_detail_tb_purchase_request_detail) {
          if (prLink.pr_detail_order_unit_id && !prLink.pr_detail_order_unit_name?.trim()) {
            unitIdsToEnrich.add(prLink.pr_detail_order_unit_id);
          }
          if (prLink.pr_detail_base_unit_id && !prLink.pr_detail_base_unit_name?.trim()) {
            unitIdsToEnrich.add(prLink.pr_detail_base_unit_id);
          }

          const prDetail = prLink.tb_purchase_request_detail;
          if (prDetail?.location_id && (!prDetail.location_name?.trim() || !prDetail.location_code?.trim())) {
            locationIdsToEnrich.add(prDetail.location_id);
          }
          if (prDetail?.requested_unit_id && !prDetail.requested_unit_name?.trim()) {
            unitIdsToEnrich.add(prDetail.requested_unit_id);
          }
        }
      }
    }

    if (productIdsToEnrich.size === 0 && locationIdsToEnrich.size === 0 && unitIdsToEnrich.size === 0) {
      return;
    }

    // Batch fetch from foreign tables
    const [products, locations, units] = await Promise.all([
      productIdsToEnrich.size > 0
        ? prisma.tb_product.findMany({
          where: { id: { in: Array.from(productIdsToEnrich) } },
          select: { id: true, code: true, name: true, local_name: true },
        })
        : [],
      locationIdsToEnrich.size > 0
        ? prisma.tb_location.findMany({
          where: { id: { in: Array.from(locationIdsToEnrich) } },
          select: { id: true, code: true, name: true },
        })
        : [],
      unitIdsToEnrich.size > 0
        ? prisma.tb_unit.findMany({
          where: { id: { in: Array.from(unitIdsToEnrich) } },
          select: { id: true, name: true },
        })
        : [],
    ]);

    const productMap = new Map(products.map((p) => [p.id, p] as const));
    const locationMap = new Map(locations.map((l) => [l.id, l] as const));
    const unitMap = new Map(units.map((u) => [u.id, u] as const));

    // Enrich in-memory objects and collect DB updates
    for (const po of purchaseOrders) {
      for (const detail of po.tb_purchase_order_detail) {
        const poDetailPatch: Record<string, string> = {};

        if (detail.product_id && (!detail.product_name?.trim() || !detail.product_code?.trim())) {
          const product = productMap.get(detail.product_id);
          if (product) {
            if (!detail.product_name?.trim()) { detail.product_name = product.name; poDetailPatch.product_name = product.name ?? ''; }
            if (!detail.product_code?.trim()) { detail.product_code = product.code; poDetailPatch.product_code = product.code ?? ''; }
            if (!detail.product_local_name?.trim()) { detail.product_local_name = product.local_name; poDetailPatch.product_local_name = product.local_name ?? ''; }
          }
        }

        if (detail.order_unit_id && !detail.order_unit_name?.trim()) {
          const unit = unitMap.get(detail.order_unit_id);
          if (unit) { detail.order_unit_name = unit.name; poDetailPatch.order_unit_name = unit.name ?? ''; }
        }

        if (detail.base_unit_id && !detail.base_unit_name?.trim()) {
          const unit = unitMap.get(detail.base_unit_id);
          if (unit) { detail.base_unit_name = unit.name; poDetailPatch.base_unit_name = unit.name ?? ''; }
        }

        if (Object.keys(poDetailPatch).length > 0) {
          poDetailUpdates.push({ id: detail.id, data: poDetailPatch });
        }

        for (const prLink of detail.tb_purchase_order_detail_tb_purchase_request_detail) {
          const junctionPatch: Record<string, string> = {};

          if (prLink.pr_detail_order_unit_id && !prLink.pr_detail_order_unit_name?.trim()) {
            const unit = unitMap.get(prLink.pr_detail_order_unit_id);
            if (unit) { prLink.pr_detail_order_unit_name = unit.name; junctionPatch.pr_detail_order_unit_name = unit.name ?? ''; }
          }
          if (prLink.pr_detail_base_unit_id && !prLink.pr_detail_base_unit_name?.trim()) {
            const unit = unitMap.get(prLink.pr_detail_base_unit_id);
            if (unit) { prLink.pr_detail_base_unit_name = unit.name; junctionPatch.pr_detail_base_unit_name = unit.name ?? ''; }
          }

          if (Object.keys(junctionPatch).length > 0) {
            junctionUpdates.push({ id: prLink.id, data: junctionPatch });
          }

          const prDetail = prLink.tb_purchase_request_detail;
          if (prDetail?.location_id && (!prDetail.location_name?.trim() || !prDetail.location_code?.trim())) {
            const location = locationMap.get(prDetail.location_id);
            if (location) {
              const prPatch: Record<string, string> = {};
              if (!prDetail.location_name?.trim()) { prDetail.location_name = location.name; prPatch.location_name = location.name ?? ''; }
              if (!prDetail.location_code?.trim()) { prDetail.location_code = location.code; prPatch.location_code = location.code ?? ''; }
              if (Object.keys(prPatch).length > 0) {
                prDetailUpdates.push({ id: prDetail.id, data: prPatch });
              }
            }
          }

          if (prDetail?.requested_unit_id && !prDetail.requested_unit_name?.trim()) {
            const unit = unitMap.get(prDetail.requested_unit_id);
            if (unit) {
              prDetail.requested_unit_name = unit.name;
              prDetailUpdates.push({ id: prDetail.id, data: { requested_unit_name: unit.name ?? '' } });
            }
          }
        }
      }
    }

    // Persist enriched data back to DB
    const updates: Promise<unknown>[] = [];

    for (const { id, data } of poDetailUpdates) {
      updates.push(prisma.tb_purchase_order_detail.update({ where: { id }, data }));
    }
    for (const { id, data } of junctionUpdates) {
      updates.push(prisma.tb_purchase_order_detail_tb_purchase_request_detail.update({ where: { id }, data }));
    }
    for (const { id, data } of prDetailUpdates) {
      updates.push(prisma.tb_purchase_request_detail.update({ where: { id }, data }));
    }

    if (updates.length > 0) {
      await Promise.allSettled(updates);
    }
  }
}
