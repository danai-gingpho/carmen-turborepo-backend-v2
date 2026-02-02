import { BadRequestException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PurchaseRequestService } from '../purchase-request.service';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { IUpdatePurchaseRequest, PurchaseRequest } from '../interface/purchase-request.interface';
import { UserActionProfile, WorkflowHeader, StageStatus } from '../interface/workflow.interface';
import { CreatePurchaseRequest, creatorAccess, NavigateForwardResult, NotificationService, NotificationType, PurchaseRoleApprovePurchaseRequestDetail, ReviewPurchaseRequestDto, state_status, SubmitPurchaseRequest } from '@/common'
import { enum_last_action, enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { ValidatePRBeforeSubmitSchema } from '../dto/purchase-request.dto';

// Re-export for backward compatibility
export { UserActionProfile, WorkflowHeader, StageStatus } from '../interface/workflow.interface';
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
    @Inject('AUTH_SERVICE')
    private readonly authService: ClientProxy,
    private readonly notificationService: NotificationService,
  ) { }

  async create(payload: CreatePurchaseRequest, user_id: string, tenant_id: string) {
    this.logger.debug({ function: 'create', data: payload, user_id, tenant_id }, PurchaseRequestLogic.name);
    await this.purchaseRequestService.initializePrismaService(tenant_id, user_id);
    const data = payload.details
    const extractId = this.populateData(data)
    const foreignValue: any = await this.mapperLogic.populate(extractId, user_id, tenant_id)

    // Validate HOD requirement when workflow is being assigned
    if (data?.workflow_id && data?.department_id) {
      const workflowData = foreignValue?.workflow_id?.data;
      const stagesWithHod = workflowData?.stages?.filter((stage: any) => stage.is_hod === true) || [];
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
      const detailAny = detail as any;
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
        product_local_name: product?.local_name,
        requested_unit_name: requestedUnit?.name,
        location_name: location?.name,
        location_code: location?.code,
        delivery_point_id: deliveryPoint?.id,
        delivery_point_name: deliveryPoint?.name,
        currency_name: currency?.name,
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
    { state_role, details: data }: {
      state_role: enum_stage_role,
      details: any
    },
    user_id: string,
    tenant_id: string) {
    this.logger.debug({ function: 'save', data, user_id, tenant_id }, PurchaseRequestLogic.name);
    await this.purchaseRequestService.initializePrismaService(tenant_id, user_id);
    let updatePR = {}
    let updatePRDetail: any = {}
    if (state_role === enum_stage_role.create) {
      const extractId = this.populateData(data)
      const foreignValue: any = await this.mapperLogic.populate(extractId, user_id, tenant_id)

      // Validate HOD requirement when workflow is being assigned
      if (data?.workflow_id && data?.department_id) {
        const workflowData = foreignValue?.workflow_id?.data;
        const stagesWithHod = workflowData?.stages?.filter((stage: any) => stage.is_hod === true) || [];
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
            detail.currency_name = foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.name
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
            detail.currency_name = foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.name
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
    } else if (state_role === enum_stage_role.purchase || state_role === enum_stage_role.approve) {
      const extractIds = this.populateDetail(data)
      const foreignValue: any = await this.mapperLogic.populate(extractIds, user_id, tenant_id)
      updatePRDetail = []
      for (const detail of data as PurchaseRoleApprovePurchaseRequestDetail[]) {
        updatePRDetail.push(
          JSON.parse(
            JSON.stringify({
              ...detail,
              vendor_name: foreignValue?.vendor_ids?.find((vendor) => vendor?.id === detail?.vendor_id)?.name,
              foc_unit_name: foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.foc_unit_id)?.name,
              approved_unit_name: foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.approved_unit_id)?.name,
              currency_name: foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.name,
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
      throw new Error('Purchase Request not found');
    }
    const purchaseRequestData = purchaseRequestResult.value;

    this.validateBeforeSubmit(purchaseRequestData)

    const total_amount = purchaseRequestData?.purchase_request_detail?.reduce((curr, acc) => curr + acc.total_price, 0)
    const populateData: any = await this.mapperLogic.populate({
      workflow_id: purchaseRequestData?.workflow_id,
      user_id: user_id,
    }, user_id, bu_code)

    const workflowData = (populateData as any)?.workflow_id?.data

    // Determine current stage - if empty (old data), get first stage then navigate to stage 2
    let currentStageForNavigation = purchaseRequestData?.workflow_current_stage
    let previousStage = purchaseRequestData?.workflow_current_stage

    if (!currentStageForNavigation) {
      // Get first stage (draft) then use it to navigate to stage 2
      const firstStageRes = this.masterService.send(
        { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
        {
          workflowData,
          currentStatus: '',
          requestData: { amount: total_amount },
        },
      );
      const firstStageNav: NavigateForwardResult = await firstValueFrom(firstStageRes);
      currentStageForNavigation = firstStageNav.navigation_info.current_stage_info?.name
      previousStage = currentStageForNavigation
    }

    const res = this.masterService.send(
      { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
      {
        workflowData,
        currentStatus: currentStageForNavigation,
        requestData: {
          amount: total_amount
        },
      },
    );
    const workflowHeader: NavigateForwardResult = await firstValueFrom(res);
    const lastActionAtDate = new Date()

    const workflow_history = purchaseRequestData?.workflow_history?.length > 0 ? purchaseRequestData?.workflow_history : []
    workflow_history.push({
      action: enum_last_action.submitted,
      datetime: lastActionAtDate,
      user: {
        id: user_id,
        name: populateData?.user_id?.name
      },
      current_stage: previousStage,
      next_stage: workflowHeader.navigation_info.current_stage_info.name
    })

    const userAction = await this.buildUserAction(
      workflowHeader.navigation_info.current_stage_info,
      purchaseRequestData.department_id,
      purchaseRequestData.department_name,
      user_id,
      bu_code
    )

    const workflow: WorkflowHeader = {
      workflow_previous_stage: workflowHeader.navigation_info.workflow_previous_step,
      workflow_current_stage: workflowHeader.navigation_info.current_stage_info.name,
      workflow_next_stage: workflowHeader.navigation_info.next_stage_info?.name,
      user_action: userAction,
      last_action: enum_last_action.submitted,
      last_action_at_date: lastActionAtDate.toISOString(),
      last_action_by_id: user_id,
      last_action_by_name: populateData?.user_id?.name,
      workflow_history
    }

    const result = await this.purchaseRequestService.submit(id, payload, workflow);

    // Send notification to approvers
    if (result.isOk()) {
      this.sendSubmitNotification(
        result.value,
        workflow,
        user_id,
        populateData?.user_id?.name,
      );
    }

    return result;
  }

  async approve(
    id: string,
    {
      state_role,
      details
    }:
      {
        state_role: enum_stage_role,
        details: any
      },
    user_id: string,
    tenant_id: string
  ) {
    await this.purchaseRequestService.initializePrismaService(tenant_id, user_id);
    const updatePRDetail = []
    const extractIds = this.populateDetail(details)
    const foreignValue: any = await this.mapperLogic.populate(extractIds, user_id, tenant_id)
    for (const detail of details as PurchaseRoleApprovePurchaseRequestDetail[]) {
      updatePRDetail.push(
        JSON.parse(
          JSON.stringify({
            ...detail,
            vendor_name: foreignValue?.vendor_ids?.find((vendor) => vendor?.id === detail?.vendor_id)?.name,
            foc_unit_name: foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.foc_unit_id)?.name,
            approved_unit_name: foreignValue?.unit_ids?.find((unit) => unit?.id === detail?.approved_unit_id)?.name,
            currency_name: foreignValue?.currency_ids?.find((currency) => currency?.id === detail?.currency_id)?.name,
            tax_profile_name: foreignValue?.tax_profile_ids?.find((tp) => tp?.id === detail?.tax_profile_id)?.name,
            pricelist_no: foreignValue?.pricelist_detail_ids?.find((priceListDetail) => priceListDetail?.id === detail?.pricelist_detail_id)?.tb_pricelist.pricelist_no
          }))
      )
    }

    /* Workflow Station */
    const purchaseRequestResult = await this.purchaseRequestService.findById(id)
    if (purchaseRequestResult.isError()) {
      throw new Error('Purchase Request not found');
    }
    const purchaseRequestData = purchaseRequestResult.value;
    const total_amount = purchaseRequestData?.purchase_request_detail?.reduce((curr, acc) => curr + acc.total_price, 0)
    const populateData: any = await this.mapperLogic.populate({
      workflow_id: purchaseRequestData?.workflow_id,
      user_id: user_id,
    }, user_id, tenant_id)


    const workflowData = (populateData as any)?.workflow_id?.data

    const res = this.masterService.send(
      { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
      {
        workflowData,
        currentStatus: purchaseRequestData?.workflow_current_stage,
        previousStatus: purchaseRequestData?.workflow_previous_stage,
        requestData: {
          amount: total_amount
        },
      },
    );
    const workflowHeader: NavigateForwardResult = await firstValueFrom(res);

    const workflow_history = purchaseRequestData?.workflow_history
    const lastActionAtDate = new Date();
    let workflow = {}

    if (!workflowHeader.navigation_info.workflow_next_step) {
      workflow_history.push({
        action: enum_last_action.approved,
        datetime: lastActionAtDate,
        user: {
          id: user_id,
          name: populateData?.user_id?.name
        },
        current_stage: workflowHeader.navigation_info.current_stage_info.name,
        next_stage: '-'
      })
      workflow = {
        workflow_previous_stage: purchaseRequestData.workflow_current_stage,
        workflow_current_stage: workflowHeader.navigation_info.current_stage_info.name,
        workflow_next_stage: '-',
        user_action: [],
        last_action: enum_last_action.approved,
        last_action_at_date: lastActionAtDate.toISOString(),
        last_action_by_id: user_id,
        last_action_by_name: populateData?.user_id?.name,
        workflow_history: workflow_history
      }
    } else {
      workflow_history.push({
        action: enum_last_action.approved,
        datetime: lastActionAtDate,
        user: {
          id: user_id,
          name: populateData?.user_id?.name
        },
        current_stage: purchaseRequestData?.workflow_current_stage,
        next_stage: workflowHeader.navigation_info.current_stage_info.name
      })
      const userAction = await this.buildUserAction(
        workflowHeader.navigation_info.current_stage_info,
        purchaseRequestData.department_id,
        purchaseRequestData.department_name,
        user_id,
        tenant_id
      )

      workflow = {
        workflow_previous_stage: workflowHeader.navigation_info.workflow_previous_step,
        workflow_current_stage: workflowHeader.navigation_info.current_stage_info.name,
        workflow_next_stage: workflowHeader.navigation_info.next_stage_info?.name,
        user_action: userAction,
        last_action: enum_last_action.approved,
        last_action_at_date: lastActionAtDate.toISOString(),
        last_action_by_id: user_id,
        last_action_by_name: populateData?.user_id?.name,
        workflow_history: workflow_history
      }
    }

    this.logger.debug({ function: 'approve', id, state_role, details, user_id, tenant_id }, PurchaseRequestLogic.name);
    const result = await this.purchaseRequestService.approve(id, workflow, updatePRDetail)

    // Send notification for approval
    this.sendApproveNotification(
      purchaseRequestData,
      workflow as WorkflowHeader,
      user_id,
      populateData?.user_id?.name,
    );

    return result
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

    const userRes: Observable<any> = await this.authService.send(
      {
        cmd: 'get-user-by-id',
        service: 'auth',
      },
      {
        id: user_id,
      },
    );
    const userResponse = await firstValueFrom(userRes);

    const workflowRes = this.masterService.send(
      { cmd: 'workflows.findOne', service: 'workflows' },
      {
        id: purchaseRequest.workflow_id,
        user_id,
        bu_code,
      },
    );

    const workflowResponse = await firstValueFrom(workflowRes);
    if (workflowResponse.response.status !== HttpStatus.OK) {
      throw new Error(workflowResponse.response.message);
    }

    // const workflowData = workflowResponse.data
    const total_amount = purchaseRequest?.purchase_request_detail?.reduce((curr, acc) => curr + acc.total_price, 0)

    const workflowNavRes = this.masterService.send(
      { cmd: 'workflows.navigate-back-to-stage', service: 'workflows' },
      {
        workflow_id: purchaseRequest.workflow_id,
        user_id: user_id,
        bu_code: bu_code,
        stage: body.des_stage,  // Target stage to go back to
        current_stage: purchaseRequest.workflow_current_stage,  // Where you are now
        requestData: {  // Optional
          amount: total_amount
        }
      },
    );
    const backToStageRes = await firstValueFrom(workflowNavRes);
    const workflowHeader: NavigateForwardResult = backToStageRes.data;

    const workflow_history = purchaseRequest?.workflow_history || []
    const lastActionAtDate = new Date();
    let workflow = {}

    workflow_history.push({
      action: enum_last_action.reviewed,
      datetime: lastActionAtDate,
      user: {
        id: user_id,
        name: userResponse?.data?.name
      },
      current_stage: purchaseRequest?.workflow_current_stage,
      next_stage: workflowHeader.navigation_info.workflow_next_step
    })

    const userAction = await this.buildUserAction(
      workflowHeader.navigation_info.current_stage_info,
      purchaseRequest.department_id,
      purchaseRequest.department_name,
      user_id,
      bu_code
    )

    workflow = {
      workflow_previous_stage: purchaseRequest.workflow_current_stage,
      workflow_current_stage: workflowHeader.navigation_info.current_stage_info.name,
      workflow_next_stage: workflowHeader.navigation_info.workflow_next_step,
      user_action: userAction,
      last_action: enum_last_action.approved,
      last_action_at_date: lastActionAtDate.toISOString(),
      last_action_by_id: user_id,
      last_action_by_name: userResponse?.data?.name,
      workflow_history: workflow_history
    }
    const result = await this.purchaseRequestService.review(id, body, workflow as any)

    // Send notification for review (send back)
    this.sendReviewNotification(
      purchaseRequest,
      workflow as WorkflowHeader,
      user_id,
      userResponse?.data?.name,
    );

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
    }

    return {
      product_ids,
      vendor_ids,
      location_ids,
      unit_ids,
      currency_ids,
      delivery_point_ids,
      tax_profile_ids
    }
  }

  private validateBeforeSubmit(purchaseRequest: PurchaseRequest) {
    ValidatePRBeforeSubmitSchema.parse(purchaseRequest);
  }

  private distinctData(d: any[]): any[] {
    return [...new Set(d)];
  }

  private async buildUserAction(
    currentStageInfo: any,
    department_id: string,
    department_name: string,
    user_id: string,
    bu_code: string
  ): Promise<{ execute: any[] } | null> {
    const userIdsToAssign: string[] = []

    // Always add assigned_users from workflow stage
    // assigned_users can be either string[] (IDs) or object[] (full profiles)
    const assignedUsers = currentStageInfo?.assigned_users || []
    for (const user of assignedUsers) {
      if (typeof user === 'string') {
        userIdsToAssign.push(user)
      } else if (user?.user_id) {
        userIdsToAssign.push(user.user_id)
      }
    }

    // Add all users in department if creator_access flag is set
    if (currentStageInfo?.creator_access === creatorAccess.ALL_PEOPLE_IN_DEPARTMENT_CAN_ACTION) {
      const res = this.masterService.send(
        { cmd: 'department-users.find-by-department', service: 'department-users' },
        { department_id, user_id, bu_code },
      );
      const usersInDepartment: { data: { user_id: string }[] } = await firstValueFrom(res);
      userIdsToAssign.push(...usersInDepartment.data.map(u => u.user_id))
    }

    // Add HOD users if is_hod flag is set
    if (currentStageInfo?.is_hod === true) {
      const hodRes = this.masterService.send(
        { cmd: 'department-users.get-hod-in-department', service: 'department-users' },
        { department_id, user_id, bu_code },
      );
      const hodUsers: { data: string[] } = await firstValueFrom(hodRes);
      userIdsToAssign.push(...hodUsers.data)
    }

    if (userIdsToAssign.length === 0) {
      return null
    }

    // Get distinct user IDs
    const distinctUserIds = this.distinctData(userIdsToAssign) as string[]

    // Fetch full user profiles from auth service
    const profilesRes = this.authService.send(
      { cmd: 'get-user-profiles-by-ids', service: 'auth' },
      {
        user_ids: distinctUserIds,
        department: { id: department_id, name: department_name }
      },
    );
    const profilesResult: { data: any[] } = await firstValueFrom(profilesRes);

    return { execute: profilesResult.data || [] }
  }

  /**
   * Send notification when PR is submitted
   */
  private async sendSubmitNotification(
    purchaseRequest: any,
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
    purchaseRequest: any,
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
    purchaseRequest: any,
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
