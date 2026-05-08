import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PurchaseRequestService } from '../purchase-request.service';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { IUpdatePurchaseRequest, PurchaseRequest } from '../interface/purchase-request.interface';
import { WorkflowHeader, StageStatus } from '@/common/workflow/workflow.interfaces';
import { WorkflowOrchestratorService } from '@/common/workflow/workflow-orchestrator.service';
import { prToWorkflowDocument } from '../workflow/pr-workflow.mapper';
import { CreatePurchaseRequest, NavigateForwardResult, NotificationService, NotificationType, PurchaseRoleApprovePurchaseRequestDetail, PurchaseRoleSavePurchaseRequestDetail, RejectPurchaseRequestDto, ReviewPurchaseRequestDto, stage_status, SubmitPurchaseRequest, PR_ERROR, ErrorDetail } from '@/common'
import { Result, ErrorCode } from '@/common/result';
import { enum_stage_role, enum_pricelist_compare_type } from '@repo/prisma-shared-schema-tenant';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { trace } from '@opentelemetry/api';
import { ValidatePRBeforeSubmitSchema } from '../dto/purchase-request.dto';

// Re-export for backward compatibility
export { WorkflowHeader, StageStatus } from '@/common/workflow/workflow.interfaces';
@Injectable()
export class PurchaseRequestLogic {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestLogic.name,
  );
  constructor(
    private readonly purchaseRequestService: PurchaseRequestService,
    private readonly mapperLogic: MapperLogic,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly notificationService: NotificationService,
    private readonly workflowOrchestrator: WorkflowOrchestratorService,
  ) { }

  private readonly tracer = trace.getTracer('micro-business.purchase-request');

  async create(payload: CreatePurchaseRequest, user_id: string, tenant_id: string) {
    this.logger.debug({ function: 'create', data: payload, user_id, tenant_id }, PurchaseRequestLogic.name);
    await this.purchaseRequestService.initializePrismaService(tenant_id, user_id);
    const data = payload.details
    const extractId = this.populateData(data)

     
    const foreignValue: Record<string, any> = await this.tracer.startActiveSpan('pr.create.populate-foreign-keys', async (span) => {
      try {
        return await this.mapperLogic.populate(extractId, user_id, tenant_id);
      } finally {
        span.end();
      }
    });

    // Validate HOD requirement and initialize workflow
    let workflowFirstStage = null;
    await this.tracer.startActiveSpan('pr.create.workflow-init', async (span) => {
      try {
        if (data?.workflow_id && data?.department_id) {
          const workflowData = foreignValue?.workflow_id?.data;
          const stagesWithHod = workflowData?.stages?.filter((stage: Record<string, unknown>) => stage.is_hod === true) || [];
          if (stagesWithHod.length > 0) {
            const hodCheckRes = this.masterService.send(
              { cmd: 'department-users.has-hod-in-department', service: 'department-users' },
              {
                department_id: data.department_id,
                user_id,
                bu_code: tenant_id
              },
            );
            const hodCheckResult: { data: boolean; response: { status: number; message: string } } = await firstValueFrom(hodCheckRes);
            if (hodCheckResult.response.status !== HttpStatus.OK) {
              throw new BadRequestException(
                hodCheckResult.response.message || 'Failed to check HOD status for department'
              );
            }
            if (!hodCheckResult.data) {
              throw new BadRequestException(
                `Cannot create PR with this workflow: The workflow requires HOD approval, but department "${foreignValue?.department_id?.name}" does not have a Head of Department (HOD) assigned. Please assign an HOD to this department or select a different workflow.`
              );
            }
          }
        }

        if (data?.workflow_id) {
          const workflowData = foreignValue?.workflow_id?.data
          const res = this.masterService.send(
            { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
            {
              workflowData,
              currentStatus: '',
              requestData: { amount: 0 },
            },
          );
          const workflowNav: NavigateForwardResult = await firstValueFrom(res);
          workflowFirstStage = workflowNav.navigation_info.current_stage_info?.name
        }
      } finally {
        span.end();
      }
    });

    const createPR = JSON.parse(JSON.stringify({
      ...data,
      workflow_name: foreignValue?.workflow_id?.name,
      workflow_current_stage: workflowFirstStage,
      department_name: foreignValue?.department_id?.name,
      requestor_name: foreignValue?.user_id?.name,
    }))
    delete createPR.purchase_request_detail

    const createPurchaseRequestDetail = []

    for (const detail of data?.purchase_request_detail?.add ?? []) {
      const detailAny = detail as unknown as Record<string, unknown>;
      const product = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id);
      const location = foreignValue?.location_ids?.find((location) => location?.id === detail?.location_id);
      const requestedUnit = foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.requested_unit_id);
      const deliveryPoint = foreignValue?.delivery_point_ids?.find((dp) => dp?.id === detail?.delivery_point_id);
      const currency = foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id);
      const focUnit = foreignValue?.unit_ids?.find((unit) => unit?.id === detailAny?.foc_unit_id);
      const inventoryUnit = foreignValue?.unit_ids?.find((unit) => unit?.id === detailAny?.inventory_unit_id);

      createPurchaseRequestDetail.push({
        ...detail,
        product_name: product?.name,
        product_code: product?.code,
        product_sku: product?.code,
        product_local_name: product?.local_name,
        requested_unit_name: requestedUnit?.name,
        location_name: location?.name,
        location_code: location?.code,
        delivery_point_id: deliveryPoint?.id,
        delivery_point_name: deliveryPoint?.name,
        currency_code: currency?.code,
        exchange_rate: currency?.exchange_rate,
        exchange_rate_date: currency?.exchange_rate_at,
        foc_unit_name: focUnit?.name,
        inventory_unit_name: inventoryUnit?.name,
      })
    }

    const result = await this.purchaseRequestService.create(createPR, createPurchaseRequestDetail)
    return result
  }

  async save(
    id,
    { stage_role, details: data }: {
      stage_role: enum_stage_role,
       
      details: any
    },
    user_id: string,
    tenant_id: string) {
    this.logger.debug({ function: 'save', data, user_id, tenant_id }, PurchaseRequestLogic.name);
    await this.purchaseRequestService.initializePrismaService(tenant_id, user_id);
    let updatePR = {}
     
    let updatePRDetail: any = {}
    if (stage_role === enum_stage_role.create) {
      const extractId = this.populateData(data)
       
    const foreignValue: Record<string, any> = await this.mapperLogic.populate(extractId, user_id, tenant_id)

      // Validate HOD requirement when workflow is being assigned
      if (data?.workflow_id && data?.department_id) {
        const workflowData = foreignValue?.workflow_id?.data;
        const stagesWithHod = workflowData?.stages?.filter((stage: Record<string, unknown>) => stage.is_hod === true) || [];
        if (stagesWithHod.length > 0) {
          const hodCheckRes = this.masterService.send(
            { cmd: 'department-users.has-hod-in-department', service: 'department-users' },
            {
              department_id: data.department_id,
              user_id,
              bu_code: tenant_id
            },
          );
          const hodCheckResult: { data: boolean; response: { status: number; message: string } } = await firstValueFrom(hodCheckRes);
          if (hodCheckResult.response.status !== HttpStatus.OK) {
            throw new BadRequestException(
              hodCheckResult.response.message || 'Failed to check HOD status for department'
            );
          }
          if (!hodCheckResult.data) {
            throw new BadRequestException(
              `Cannot save PR with this workflow: The workflow requires HOD approval, but department "${foreignValue?.department_id?.name}" does not have a Head of Department (HOD) assigned. Please assign an HOD to this department or select a different workflow.`
            );
          }
        }
      }

      // Initialize workflow first stage if workflow_id is provided
      let workflowFirstStage = null
      if (data?.workflow_id) {
        const workflowData = foreignValue?.workflow_id?.data
        const res = this.masterService.send(
          { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
          {
            workflowData,
            currentStatus: '',
            requestData: { amount: 0 },
          },
        );
        const workflowNav: NavigateForwardResult = await firstValueFrom(res);
        workflowFirstStage = workflowNav.navigation_info.current_stage_info?.name
      }

      updatePR = JSON.parse(JSON.stringify({
        ...data,
        workflow_name: foreignValue?.workflow_id?.name,
        workflow_current_stage: workflowFirstStage,
        department_name: foreignValue?.department_id?.name,
        requestor_name: foreignValue?.user_id?.name,
      }))

      updatePRDetail = {
        purchase_request_detail: {
          add: [],
          update: [],
          remove: []
        }
      }
      if (data?.purchase_request_detail?.add && data?.purchase_request_detail?.add.length > 0) {
        updatePRDetail.purchase_request_detail.add = data?.purchase_request_detail?.add
        updatePRDetail?.purchase_request_detail?.add.forEach((detail) => {
          if (detail?.product_id) {
            detail.product_name = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.name
            detail.product_code = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.code
            detail.product_sku = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.code
          }
          if (detail?.vendor_id) {
            detail.vendor_name = foreignValue?.vendor_ids?.find((vendor) => vendor?.id === detail?.vendor_id)?.name
          }
          if (detail?.location_id) {
            detail.location_name = foreignValue?.location_ids?.find((location) => location?.id === detail?.location_id)?.name
            detail.location_code = foreignValue?.location_ids?.find((location) => location?.id === detail?.location_id)?.code
          }
          if (detail?.foc_unit_id) {
            detail.foc_unit_name = foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.foc_unit_id)?.name
          }
          if (detail?.approved_unit_id) {
            detail.approved_unit_name = foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.approved_unit_id)?.name
          }
          if (detail?.requested_unit_id) {
            detail.requested_unit_name = foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.requested_unit_id)?.name
          }
          if (detail?.inventory_unit_id) {
            detail.inventory_unit_name = foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.inventory_unit_id)?.name
          }
          if (detail?.currency_id) {
            detail.currency_code = foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.code
            detail.exchange_rate = foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.exchange_rate
            detail.exchange_rate_date = foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.exchange_rate_at
          }
          if (detail?.delivery_point_id) {
            detail.delivery_point_name = foreignValue?.delivery_point_ids?.find((deliveryPoint) => deliveryPoint?.id === detail?.delivery_point_id)?.name
          }
          if (detail?.pricelist_detail_id) {
            detail.pricelist_no = foreignValue?.pricelist_detail_ids?.find((priceListDetail) => priceListDetail?.id === detail?.pricelist_detail_id)?.tb_pricelist.pricelist_no
          }
        })
      }

      if (data?.purchase_request_detail?.update && data?.purchase_request_detail?.update.length > 0) {
        updatePRDetail.purchase_request_detail.update = data?.purchase_request_detail?.update
        updatePRDetail?.purchase_request_detail?.update.forEach((detail) => {
          if (detail?.product_id) {
            detail.product_name = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.name
            detail.product_code = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.code
            detail.product_sku = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.code
          }
          if (detail?.vendor_id) {
            detail.vendor_name = foreignValue?.vendor_ids?.find((vendor) => vendor?.id === detail?.vendor_id)?.name
          }
          if (detail?.location_id) {
            detail.location_name = foreignValue?.location_ids?.find((location) => location?.id === detail?.location_id)?.name
            detail.location_code = foreignValue?.location_ids?.find((location) => location?.id === detail?.location_id)?.code
          }
          if (detail?.foc_unit_id) {
            detail.foc_unit_name = foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.foc_unit_id)?.name
          }
          if (detail?.approved_unit_id) {
            detail.approved_unit_name = foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.approved_unit_id)?.name
          }
          if (detail?.requested_unit_id) {
            detail.requested_unit_name = foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.requested_unit_id)?.name
          }
          if (detail?.inventory_unit_id) {
            detail.inventory_unit_name = foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.inventory_unit_id)?.name
          }
          if (detail?.currency_id) {
            detail.currency_code = foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.code
            detail.exchange_rate = foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.exchange_rate
            detail.exchange_rate_date = foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.exchange_rate_at
          }
          if (detail?.delivery_point_id) {
            detail.delivery_point_name = foreignValue?.delivery_point_ids?.find((deliveryPoint) => deliveryPoint?.id === detail?.delivery_point_id)?.name
          }
          if (detail?.pricelist_detail_id) {
            detail.pricelist_no = foreignValue?.pricelist_detail_ids?.find((priceListDetail) => priceListDetail?.id === detail?.pricelist_detail_id)?.tb_pricelist.pricelist_no
          }
        })
      }

      if (data?.purchase_request_detail?.remove && data?.purchase_request_detail?.remove.length > 0) {
        updatePRDetail.purchase_request_detail.remove = data?.purchase_request_detail?.remove
      }
    } else if (stage_role === enum_stage_role.purchase || stage_role === enum_stage_role.approve) {
      const extractIds = this.populateDetail(data)
       
    const foreignValue: Record<string, any> = await this.mapperLogic.populate(extractIds, user_id, tenant_id)
      updatePRDetail = []
      for (const detail of data as PurchaseRoleSavePurchaseRequestDetail[]) {
        updatePRDetail.push(
          JSON.parse(
            JSON.stringify({
              ...detail,
              vendor_name: foreignValue?.vendor_ids?.find((vendor) => vendor?.id === detail?.vendor_id)?.name,
              foc_unit_name: foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.foc_unit_id)?.name,
              approved_unit_name: foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.approved_unit_id)?.name,
              currency_code: foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.code,
              tax_profile_name: foreignValue?.tax_profile_ids?.find((tp) => tp?.id === detail?.tax_profile_id)?.name,
              pricelist_no: foreignValue?.pricelist_detail_ids?.find((priceListDetail) => priceListDetail?.id === detail?.pricelist_detail_id)?.tb_pricelist.pricelist_no
            }))
        )
      }
    }
    const result = await this.purchaseRequestService.update(id, updatePR, updatePRDetail)

    return result
  }

  async submit(id: string, payload: SubmitPurchaseRequest, user_id: string, bu_code: string) {
    this.logger.debug({ function: 'submit', id, user_id, bu_code }, PurchaseRequestLogic.name);
    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);
    const purchaseRequestResult = await this.purchaseRequestService.findById(id)
    if (purchaseRequestResult.isError()) {
      return Result.error<ErrorDetail>(
        'Purchase Request not found',
        ErrorCode.NOT_FOUND,
        { error_code: PR_ERROR.NOT_FOUND, service: 'micro-business', id, error: 'Purchase request not found' },
      );
    }
    const purchaseRequestData = purchaseRequestResult.value;

    const validationError = this.validateBeforeSubmit(purchaseRequestData);
    if (validationError) return validationError;

    // Auto price compare for each detail
    const pricelistMap = await this.lookupPricelistForDetails(
      purchaseRequestData.purchase_request_detail || purchaseRequestData.tb_purchase_request_detail || [],
      bu_code,
      user_id,
    );

    const workflow = await this.workflowOrchestrator.buildSubmitWorkflow(
      prToWorkflowDocument(purchaseRequestData), user_id, bu_code,
    );

    const result = await this.purchaseRequestService.submit(id, payload, workflow, pricelistMap);

    if (result.isOk()) {
      this.sendSubmitNotification(result.value, workflow, user_id, workflow.last_action_by_name);
    }

    return result;
  }

  async approve(
    id: string,
    {
      stage_role,
      details
    }:
      {
        stage_role: enum_stage_role,
        details: any[]
      },
    user_id: string,
    tenant_id: string
  ) {
    await this.purchaseRequestService.initializePrismaService(tenant_id, user_id);

    // Enrich detail data with vendor, unit, currency names
    const updatePRDetail = []
    const extractIds = this.populateDetail(details)
    const foreignValue: Record<string, any> = await this.mapperLogic.populate(extractIds, user_id, tenant_id)
    for (const detail of details as PurchaseRoleApprovePurchaseRequestDetail[]) {
      updatePRDetail.push(
        JSON.parse(
          JSON.stringify({
            ...detail,
            vendor_name: foreignValue?.vendor_ids?.find((vendor) => vendor?.id === detail?.vendor_id)?.name,
            foc_unit_name: foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.foc_unit_id)?.name,
            approved_unit_name: foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.approved_unit_id)?.name,
            currency_code: foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.code,
            tax_profile_name: foreignValue?.tax_profile_ids?.find((tp) => tp?.id === detail?.tax_profile_id)?.name,
            pricelist_no: foreignValue?.pricelist_detail_ids?.find((priceListDetail) => priceListDetail?.id === detail?.pricelist_detail_id)?.tb_pricelist.pricelist_no
          }))
      )
    }

    const purchaseRequestResult = await this.purchaseRequestService.findById(id)
    if (purchaseRequestResult.isError()) {
      throw new Error('Purchase Request not found');
    }
    const purchaseRequestData = purchaseRequestResult.value;

    const { workflow } = await this.workflowOrchestrator.buildApproveWorkflow(
      prToWorkflowDocument(purchaseRequestData), user_id, tenant_id,
    );

    this.logger.debug({ function: 'approve', id, stage_role, details, user_id, tenant_id }, PurchaseRequestLogic.name);
    const result = await this.purchaseRequestService.approve(id, workflow, updatePRDetail)

    this.sendApproveNotification(purchaseRequestData, workflow, user_id, workflow.last_action_by_name);

    return result
  }

  async swipeApprove(
    pr_ids: string[],
    user_id: string,
    tenant_id: string,
  ) {
    this.logger.debug({ function: 'swipeApprove', pr_ids, user_id, tenant_id }, PurchaseRequestLogic.name);
    await this.purchaseRequestService.initializePrismaService(tenant_id, user_id);

    const results: { id: string; success: boolean; message?: string }[] = [];

    for (const id of pr_ids) {
      try {
        // Fetch PR data
        const purchaseRequestResult = await this.purchaseRequestService.findById(id);
        if (purchaseRequestResult.isError()) {
          results.push({ id, success: false, message: 'Purchase request not found' });
          continue;
        }
        const prData = purchaseRequestResult.value;

        // Check PR status — only in_progress can be swipe approved
        if (prData.pr_status !== 'in_progress') {
          results.push({ id, success: false, message: `PR status is "${prData.pr_status}", only in_progress can be swipe approved` });
          continue;
        }

        // Check user is in user_action.execute
        const userActionExecute = (prData.user_action as { execute: any[] })?.execute || [];
        const actionUserIds: string[] = userActionExecute.map((u) =>
          typeof u === 'string' ? u : u?.user_id
        ).filter(Boolean);

        if (!actionUserIds.includes(user_id)) {
          results.push({ id, success: false, message: 'User is not an action user for this PR' });
          continue;
        }

        // Check role — purchase role cannot swipe approve
        const { workflow } = await this.workflowOrchestrator.buildApproveWorkflow(
          prToWorkflowDocument(prData), user_id, tenant_id,
        );

        // Check current stage role — purchase role cannot use swipe approve
        const populateData: Record<string, any> = await this.mapperLogic.populate({
          workflow_id: prData.workflow_id,
          user_id,
        }, user_id, tenant_id);
        const workflowData = populateData?.workflow_id?.data;
        const total_amount = prData.purchase_request_detail?.reduce((curr, acc) => curr + acc.total_price, 0) || 0;
        const navRes = this.masterService.send(
          { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
          {
            workflowData,
            currentStatus: prData.workflow_current_stage,
            previousStatus: prData.workflow_previous_stage,
            requestData: { amount: total_amount },
          },
        );
        const navResult: NavigateForwardResult = await firstValueFrom(navRes);
        const stageInfo = navResult.navigation_info.current_stage_info;
        if (stageInfo?.role === enum_stage_role.purchase) {
          results.push({ id, success: false, message: 'Purchase role cannot use swipe approve' });
          continue;
        }

        // Build details — approve all with stage_status = approve
        const details = (prData.purchase_request_detail || []).map((d) => ({
          id: d.id,
          purchase_request_id: id,
          stage_status: stage_status.approve,
          stage_message: null,
        }));

        const result = await this.purchaseRequestService.approve(id, workflow, details);

        if (result.isOk()) {
          this.sendApproveNotification(prData, workflow, user_id, workflow.last_action_by_name);
          results.push({ id, success: true });
        } else {
          results.push({ id, success: false, message: 'Failed to approve' });
        }
      } catch (error: any) {
        results.push({ id, success: false, message: error?.message || 'Unexpected error' });
      }
    }

    return results;
  }

  async reject(
    id: string,
    body: RejectPurchaseRequestDto,
    user_id: string,
    tenant_id: string,
  ) {
    this.logger.debug({ function: 'reject', id, user_id, tenant_id }, PurchaseRequestLogic.name);
    await this.purchaseRequestService.initializePrismaService(tenant_id, user_id);

    const purchaseRequestResult = await this.purchaseRequestService.findById(id);
    if (purchaseRequestResult.isError()) {
      throw new Error('Purchase Request not found');
    }
    const purchaseRequestData = purchaseRequestResult.value;

    const workflow = await this.workflowOrchestrator.buildRejectWorkflow(
      prToWorkflowDocument(purchaseRequestData), user_id, tenant_id,
    );

    const result = await this.purchaseRequestService.reject(id, workflow, body);

    return result;
  }

  async swipeReject(
    pr_ids: string[],
    reject_message: string,
    user_id: string,
    tenant_id: string,
  ) {
    this.logger.debug({ function: 'swipeReject', pr_ids, user_id, tenant_id }, PurchaseRequestLogic.name);
    await this.purchaseRequestService.initializePrismaService(tenant_id, user_id);

    const results: { id: string; success: boolean; message?: string }[] = [];

    for (const id of pr_ids) {
      try {
        const purchaseRequestResult = await this.purchaseRequestService.findById(id);
        if (purchaseRequestResult.isError()) {
          results.push({ id, success: false, message: 'Purchase request not found' });
          continue;
        }
        const prData = purchaseRequestResult.value;

        // Check PR status — only in_progress can be swipe rejected
        if (prData.pr_status !== 'in_progress') {
          results.push({ id, success: false, message: `PR status is "${prData.pr_status}", only in_progress can be swipe rejected` });
          continue;
        }

        // Check user is in user_action.execute
        const userActionExecute = (prData.user_action as { execute: any[] })?.execute || [];
        const actionUserIds: string[] = userActionExecute.map((u) =>
          typeof u === 'string' ? u : u?.user_id
        ).filter(Boolean);

        if (!actionUserIds.includes(user_id)) {
          results.push({ id, success: false, message: 'User is not an action user for this PR' });
          continue;
        }

        // Check role — purchase role cannot swipe reject
        const populateData: Record<string, any> = await this.mapperLogic.populate({
          workflow_id: prData.workflow_id,
          user_id,
        }, user_id, tenant_id);

        const workflowData = populateData?.workflow_id?.data;
        const total_amount = prData.purchase_request_detail?.reduce((curr, acc) => curr + acc.total_price, 0) || 0;

        const navRes = this.masterService.send(
          { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
          {
            workflowData,
            currentStatus: prData.workflow_current_stage,
            previousStatus: prData.workflow_previous_stage,
            requestData: { amount: total_amount },
          },
        );
        const workflowHeader: NavigateForwardResult = await firstValueFrom(navRes);

        const stageInfo = workflowHeader.navigation_info.current_stage_info;

        // Build reject workflow
        const workflow = await this.workflowOrchestrator.buildRejectWorkflow(
          prToWorkflowDocument(prData), user_id, tenant_id,
        );

        // Build reject payload — reject all details
        const rejectPayload: { stage_role: enum_stage_role; details: { id: string; stage_status: stage_status; stage_message: string }[] } = {
          stage_role: (stageInfo?.role as enum_stage_role) || enum_stage_role.approve,
          details: (prData.purchase_request_detail || []).map((d: any) => ({
            id: d.id,
            stage_status: stage_status.reject,
            stage_message: reject_message,
          })),
        };

        const result = await this.purchaseRequestService.reject(id, workflow, rejectPayload);

        if (result.isOk()) {
          results.push({ id, success: true });
        } else {
          results.push({ id, success: false, message: 'Failed to reject' });
        }
      } catch (error: any) {
        results.push({ id, success: false, message: error?.message || 'Unexpected error' });
      }
    }

    return results;
  }

  async review(
    id: string,
    body: ReviewPurchaseRequestDto,
    user_id: string,
    bu_code: string
  ) {
    this.logger.debug({ function: 'review', id, body, user_id, bu_code }, PurchaseRequestLogic.name);
    await this.purchaseRequestService.initializePrismaService(bu_code, user_id);

    const purchaseRequestResult = await this.purchaseRequestService.findById(id)
    if (purchaseRequestResult.isError()) {
      throw new Error('Purchase Request not found');
    }
    const purchaseRequest = purchaseRequestResult.value;

    const workflow = await this.workflowOrchestrator.buildReviewWorkflow(
      prToWorkflowDocument(purchaseRequest), body.des_stage, user_id, bu_code,
    );

    const result = await this.purchaseRequestService.review(id, body, workflow)

    this.sendReviewNotification(purchaseRequest, workflow, user_id, workflow.last_action_by_name);

    return result
  }

  private populateData(data) {
    const headerFields = {
      workflow_id: data?.workflow_id,
      requestor_id: data?.requestor_id,
      department_id: data?.department_id,
      user_id: data?.requestor_id,
    }

    const product_ids = []
    const vendor_ids = []
    const location_ids = []
    const unit_ids = []
    const pricelist_detail_ids = []
    const tax_type_inventory_ids = []
    const currency_ids = []
    const delivery_point_ids = []

    if (data?.purchase_request_detail?.add) {
      for (const detail of data.purchase_request_detail.add) {
        if (detail?.product_id) {
          product_ids.push(detail?.product_id)
        }
        if (detail?.vendor_id) {
          vendor_ids.push(detail?.vendor_id)
        }
        if (detail?.location_id) {
          location_ids.push(detail?.location_id)
        }
        if (detail?.foc_unit_id) {
          unit_ids.push(detail?.foc_unit_id)
        }
        if (detail?.approved_unit_id) {
          unit_ids.push(detail?.approved_unit_id)
        }
        if (detail?.requested_unit_id) {
          unit_ids.push(detail?.requested_unit_id)
        }
        if (detail?.inventory_unit_id) {
          unit_ids.push(detail?.inventory_unit_id)
        }
        if (detail?.pricelist_detail_id) {
          pricelist_detail_ids.push(detail?.pricelist_detail_id)
        }
        if (detail?.currency_id) {
          currency_ids.push(detail?.currency_id)
        }
        if (detail?.delivery_point_id) {
          delivery_point_ids.push(detail?.delivery_point_id)
        }
      }
    }

    if ((data as IUpdatePurchaseRequest)?.purchase_request_detail?.update) {
      for (const detail of (data as IUpdatePurchaseRequest).purchase_request_detail.update) {
        if (detail?.product_id) {
          product_ids.push(detail?.product_id)
        }
        if (detail?.vendor_id) {
          vendor_ids.push(detail?.vendor_id)
        }
        if (detail?.location_id) {
          location_ids.push(detail?.location_id)
        }
        if (detail?.foc_unit_id) {
          unit_ids.push(detail?.foc_unit_id)
        }
        if (detail?.approved_unit_id) {
          unit_ids.push(detail?.approved_unit_id)
        }
        if (detail?.requested_unit_id) {
          unit_ids.push(detail?.requested_unit_id)
        }
        if (detail?.inventory_unit_id) {
          unit_ids.push(detail?.inventory_unit_id)
        }
        if (detail?.pricelist_detail_id) {
          pricelist_detail_ids.push(detail?.pricelist_detail_id)
        }
        if (detail?.currency_id) {
          currency_ids.push(detail?.currency_id)
        }
        if (detail?.delivery_point_id) {
          delivery_point_ids.push(detail?.delivery_point_id)
        }
      }
    }

    const extractId = {
      ...headerFields,
      product_ids,
      vendor_ids,
      location_ids,
      unit_ids,
      pricelist_detail_ids,
      tax_type_inventory_ids,
      currency_ids,
      delivery_point_ids,
    }

    return extractId
  }

  private populateDetail(
    data: PurchaseRoleApprovePurchaseRequestDetail[]
  ) {
    const product_ids = []
    const vendor_ids = []
    const location_ids = []
    const unit_ids = []
    const currency_ids = []
    const delivery_point_ids = []
    const tax_profile_ids = []
    const pricelist_detail_ids = []

    for (const detail of data) {
      if (detail?.vendor_id) {
        vendor_ids.push(detail?.vendor_id)
      }
      if (detail?.foc_unit_id) {
        unit_ids.push(detail?.foc_unit_id)
      }
      if (detail?.approved_unit_id) {
        unit_ids.push(detail?.approved_unit_id)
      }
      if (detail?.currency_id) {
        currency_ids.push(detail?.currency_id)
      }
      if (detail?.tax_profile_id) {
        tax_profile_ids.push(detail?.tax_profile_id)
      }
      if (detail?.pricelist_detail_id) {
        pricelist_detail_ids.push(detail?.pricelist_detail_id)
      }
    }

    return {
      product_ids,
      vendor_ids,
      location_ids,
      unit_ids,
      currency_ids,
      delivery_point_ids,
      tax_profile_ids,
      pricelist_detail_ids,
    }
  }

  private validateBeforeSubmit(purchaseRequest: PurchaseRequest): Result<true, ErrorDetail> | null {
    const SERVICE_NAME = 'micro-business';
    const prId = purchaseRequest.id;

    if (!purchaseRequest.workflow_id) {
      return Result.error<ErrorDetail>(
        'Workflow is required before submitting PR',
        ErrorCode.VALIDATION_FAILURE,
        { error_code: PR_ERROR.WORKFLOW_REQUIRED, service: SERVICE_NAME, id: prId, error: 'workflow_id is missing' },
      );
    }

    if (!purchaseRequest.requestor_id) {
      return Result.error<ErrorDetail>(
        'Requestor is required',
        ErrorCode.VALIDATION_FAILURE,
        { error_code: PR_ERROR.REQUESTOR_REQUIRED, service: SERVICE_NAME, id: prId, error: 'requestor_id is missing' },
      );
    }

    if (!purchaseRequest.department_id) {
      return Result.error<ErrorDetail>(
        'Department is required',
        ErrorCode.VALIDATION_FAILURE,
        { error_code: PR_ERROR.DEPARTMENT_REQUIRED, service: SERVICE_NAME, id: prId, error: 'department_id is missing' },
      );
    }

    if (!purchaseRequest.pr_date) {
      return Result.error<ErrorDetail>(
        'PR date is required',
        ErrorCode.VALIDATION_FAILURE,
        { error_code: PR_ERROR.PR_DATE_REQUIRED, service: SERVICE_NAME, id: prId, error: 'pr_date is missing' },
      );
    }

    const details = purchaseRequest.purchase_request_detail || [];
    if (details.length === 0) {
      return Result.error<ErrorDetail>(
        'PR must have at least one detail line',
        ErrorCode.VALIDATION_FAILURE,
        { error_code: PR_ERROR.DETAIL_REQUIRED, service: SERVICE_NAME, id: prId, error: 'purchase_request_detail is empty' },
      );
    }

    for (let i = 0; i < details.length; i++) {
      const d = details[i];
      if (!d.product_id) {
        return Result.error<ErrorDetail>(
          `Detail line ${i + 1}: product_id is required`,
          ErrorCode.VALIDATION_FAILURE,
          { error_code: PR_ERROR.PRODUCT_REQUIRED, service: SERVICE_NAME, id: prId, error: `detail[${i}].product_id is missing` },
        );
      }
      if (!d.requested_qty || d.requested_qty <= 0) {
        return Result.error<ErrorDetail>(
          `Detail line ${i + 1}: requested_qty must be positive`,
          ErrorCode.VALIDATION_FAILURE,
          { error_code: PR_ERROR.REQUESTED_QTY_INVALID, service: SERVICE_NAME, id: prId, error: `detail[${i}].requested_qty is invalid (${d.requested_qty})` },
        );
      }
      if (!d.requested_unit_id) {
        return Result.error<ErrorDetail>(
          `Detail line ${i + 1}: requested_unit_id is required`,
          ErrorCode.VALIDATION_FAILURE,
          { error_code: PR_ERROR.REQUESTED_UNIT_REQUIRED, service: SERVICE_NAME, id: prId, error: `detail[${i}].requested_unit_id is missing` },
        );
      }
    }

    return null; // validation passed
  }

  // buildUserAction and distinctData removed — now handled by WorkflowOrchestratorService

  /**
   * Lookup pricelist for each detail line using price-compare.
   * Returns a map of detail_id → pricelist data (only for details that have a match).
   */
  private async lookupPricelistForDetails(
    details: any[],
    bu_code: string,
    user_id: string,
  ): Promise<Map<string, { pricelist_detail_id: string | null; pricelist_no: string | null; pricelist_price: number; pricelist_type: enum_pricelist_compare_type; vendor_id: string | null; vendor_name: string | null }>> {
    const pricelistMap = new Map<string, any>();

    for (const detail of details) {
      if (!detail.product_id || !detail.currency_id) continue;

      const dueDate = detail.delivery_date || new Date().toISOString();

      try {
        const res = this.masterService.send(
          { cmd: 'price-list.price-compare', service: 'price-list' },
          {
            user_id,
            bu_code,
            data: {
              product_id: detail.product_id,
              due_date: new Date(dueDate),
              unit_id: detail.requested_unit_id,
              currency_id: detail.currency_id,
            },
          },
        );
        const result: any = await firstValueFrom(res);

        if (result?.data?.selected) {
          const selected = result.data.selected;
          pricelistMap.set(detail.id, {
            pricelist_detail_id: selected.pricelist_detail_id,
            pricelist_no: selected.pricelist_no,
            pricelist_price: selected.price,
            pricelist_type: enum_pricelist_compare_type.automatic,
            vendor_id: selected.vendor_id,
            vendor_name: selected.vendor_name,
          });
        }
      } catch (err: any) {
        this.logger.warn(
          { function: 'lookupPricelistForDetails', detail_id: detail.id, error: err?.message },
          PurchaseRequestLogic.name,
        );
        // If price lookup fails, skip — don't block submit
      }

      if (!pricelistMap.has(detail.id)) {
        const grnPrice = await this.lookupLatestGrnPrice(detail.product_id);
        if (grnPrice) {
          pricelistMap.set(detail.id, {
            pricelist_detail_id: null,
            pricelist_no: null,
            pricelist_price: grnPrice.unit_price,
            pricelist_type: enum_pricelist_compare_type.automatic,
            vendor_id: grnPrice.vendor_id,
            vendor_name: grnPrice.vendor_name,
          });
        }
      }
    }

    return pricelistMap;
  }

  /**
   * Fallback price source: unit price from the latest received GRN detail item
   * for the given product. Returns null if no usable GRN record is found.
   */
  private async lookupLatestGrnPrice(
    product_id: string,
  ): Promise<{ unit_price: number; vendor_id: string | null; vendor_name: string | null } | null> {
    try {
      const grnItem = await this.purchaseRequestService.prismaService.tb_good_received_note_detail_item.findFirst({
        where: {
          deleted_at: null,
          received_qty: { gt: 0 },
          tb_good_received_note_detail: {
            product_id,
          },
        },
        orderBy: { created_at: 'desc' },
        include: {
          tb_good_received_note_detail: {
            include: { tb_good_received_note: true },
          },
        },
      });
      if (!grnItem) return null;

      const receivedQty = Number(grnItem.received_qty ?? 0);
      const subTotal = Number(grnItem.sub_total_price ?? 0);
      if (receivedQty <= 0 || subTotal <= 0) return null;

      const unitPrice = subTotal / receivedQty;
      const header = grnItem.tb_good_received_note_detail.tb_good_received_note;
      return {
        unit_price: unitPrice,
        vendor_id: header?.vendor_id ?? null,
        vendor_name: header?.vendor_name ?? null,
      };
    } catch (err: any) {
      this.logger.warn(
        { function: 'lookupLatestGrnPrice', product_id, error: err?.message },
        PurchaseRequestLogic.name,
      );
      return null;
    }
  }

  /**
   * Send notification when PR is submitted
   */
  private async sendSubmitNotification(
     
    purchaseRequest: Record<string, any>,
    workflow: WorkflowHeader,
    submitterId: string,
    submitterName: string,
  ): Promise<void> {
    try {
      const approverProfiles = workflow.user_action?.execute || [];
      if (approverProfiles.length === 0) return;

      const approverIds = approverProfiles.map(p => p.user_id);
      const prNo = purchaseRequest?.pr_no || 'N/A';
      const title = `Purchase Request Submitted: ${prNo}`;
      const message = `${submitterName} has submitted Purchase Request ${prNo} for your approval.`;

      await this.notificationService.sendToUsers({
        to_user_ids: approverIds,
        from_user_id: submitterId,
        title,
        message,
        type: NotificationType.PR,
        metadata: {
          pr_id: purchaseRequest?.id,
          pr_no: prNo,
          action: 'submitted',
          current_stage: workflow.workflow_current_stage,
        },
      });

      this.logger.log(`Notification sent to ${approverIds.length} approver(s) for PR ${prNo}`);
    } catch (error) {
      this.logger.error('Failed to send submit notification:', error);
    }
  }

  /**
   * Send notification when PR is approved
   */
  private async sendApproveNotification(
     
    purchaseRequest: Record<string, any>,
    workflow: WorkflowHeader,
    approverId: string,
    approverName: string,
  ): Promise<void> {
    try {
      const prNo = purchaseRequest?.pr_no || 'N/A';
      const requestorId = purchaseRequest?.requestor_id;
      const isFullyApproved = workflow.workflow_next_stage === '-';

      // Notify requestor
      if (requestorId) {
        const title = isFullyApproved
          ? `Purchase Request Approved: ${prNo}`
          : `Purchase Request Progress: ${prNo}`;
        const message = isFullyApproved
          ? `Your Purchase Request ${prNo} has been fully approved by ${approverName}.`
          : `Your Purchase Request ${prNo} has been approved by ${approverName} and moved to ${workflow.workflow_current_stage}.`;

        await this.notificationService.sendPRNotification(
          requestorId,
          title,
          message,
          {
            pr_id: purchaseRequest?.id,
            pr_no: prNo,
            action: 'approved',
            current_stage: workflow.workflow_current_stage,
            is_fully_approved: isFullyApproved,
          },
          approverId,
        );
      }

      // Notify next approvers if workflow continues
      if (!isFullyApproved) {
        const nextApproverProfiles = workflow.user_action?.execute || [];
        if (nextApproverProfiles.length > 0) {
          const nextApproverIds = nextApproverProfiles.map(p => p.user_id);
          await this.notificationService.sendToUsers({
            to_user_ids: nextApproverIds,
            from_user_id: approverId,
            title: `Purchase Request Pending Approval: ${prNo}`,
            message: `Purchase Request ${prNo} requires your approval at stage: ${workflow.workflow_current_stage}.`,
            type: NotificationType.PR,
            metadata: {
              pr_id: purchaseRequest?.id,
              pr_no: prNo,
              action: 'pending_approval',
              current_stage: workflow.workflow_current_stage,
            },
          });
        }
      }

      this.logger.log(`Approval notification sent for PR ${prNo}`);
    } catch (error) {
      this.logger.error('Failed to send approve notification:', error);
    }
  }

  /**
   * Send notification when PR is reviewed (sent back)
   */
  private async sendReviewNotification(
     
    purchaseRequest: Record<string, any>,
    workflow: WorkflowHeader,
    reviewerId: string,
    reviewerName: string,
  ): Promise<void> {
    try {
      const prNo = purchaseRequest?.pr_no || 'N/A';
      const requestorId = purchaseRequest?.requestor_id;

      // Notify requestor that PR was sent back
      if (requestorId) {
        const title = `Purchase Request Returned: ${prNo}`;
        const message = `Your Purchase Request ${prNo} has been returned by ${reviewerName} to stage: ${workflow.workflow_current_stage}.`;

        await this.notificationService.sendPRNotification(
          requestorId,
          title,
          message,
          {
            pr_id: purchaseRequest?.id,
            pr_no: prNo,
            action: 'reviewed',
            current_stage: workflow.workflow_current_stage,
          },
          reviewerId,
        );
      }

      // Notify users who need to take action
      const actionUserProfiles = workflow.user_action?.execute || [];
      if (actionUserProfiles.length > 0) {
        const actionUserIds = actionUserProfiles.map(p => p.user_id).filter(id => id !== requestorId);
        await this.notificationService.sendToUsers({
          to_user_ids: actionUserIds,
          from_user_id: reviewerId,
          title: `Purchase Request Needs Attention: ${prNo}`,
          message: `Purchase Request ${prNo} has been returned and requires action at stage: ${workflow.workflow_current_stage}.`,
          type: NotificationType.PR,
          metadata: {
            pr_id: purchaseRequest?.id,
            pr_no: prNo,
            action: 'review_pending',
            current_stage: workflow.workflow_current_stage,
          },
        });
      }

      this.logger.log(`Review notification sent for PR ${prNo}`);
    } catch (error) {
      this.logger.error('Failed to send review notification:', error);
    }
  }
}
