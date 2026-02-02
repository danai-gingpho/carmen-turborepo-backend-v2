import { Inject, Injectable } from '@nestjs/common';
import { StoreRequisitionService } from '../store-requisition.service';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { IUpdateStoreRequisition, StoreRequisition } from '../interface/store-requisition.interface';
import { WorkflowHeader, StageStatus } from '../interface/workflow.interface';
import { CreateStoreRequisition, creatorAccess, NavigateForwardResult, NotificationService, NotificationType, state_status, SubmitStoreRequisition } from '@/common';
import { enum_last_action, enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ValidateSRBeforeSubmitSchema } from '../dto/store-requisition.dto';

// Re-export for backward compatibility
export { WorkflowHeader, StageStatus } from '../interface/workflow.interface';

@Injectable()
export class StoreRequisitionLogic {
  private readonly logger: BackendLogger = new BackendLogger(
    StoreRequisitionLogic.name,
  );
  constructor(
    private readonly storeRequisitionService: StoreRequisitionService,
    private readonly mapperLogic: MapperLogic,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    private readonly notificationService: NotificationService,
  ) {}

  async create(payload: CreateStoreRequisition, user_id: string, tenant_id: string) {
    this.logger.debug({ function: 'create', data: payload, user_id, tenant_id }, StoreRequisitionLogic.name);
    await this.storeRequisitionService.initializePrismaService(tenant_id, user_id);
    const data = payload.details;
    const extractId = this.populateData(data);
    const foreignValue: any = await this.mapperLogic.populate(extractId, user_id, tenant_id);
    const createSR = JSON.parse(JSON.stringify({
      ...data,
      workflow_name: foreignValue?.workflow_id?.name,
      department_name: foreignValue?.department_id?.name,
      requestor_name: foreignValue?.user_id?.name,
      from_location_name: foreignValue?.from_location_id?.name,
      from_location_code: foreignValue?.from_location_id?.code,
      to_location_name: foreignValue?.to_location_id?.name,
      to_location_code: foreignValue?.to_location_id?.code,
    }));
    delete createSR.store_requisition_detail;

    const createStoreRequisitionDetail = [];

    for (const detail of data?.store_requisition_detail?.add ?? []) {
      const product = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id);

      createStoreRequisitionDetail.push({
        ...detail,
        product_name: product?.name,
        product_local_name: product?.local_name,
      });
    }

    const result = await this.storeRequisitionService.create(createSR, createStoreRequisitionDetail);
    return result;
  }

  async save(
    id,
    { state_role, details: data }: {
      state_role: enum_stage_role;
      details: any;
    },
    user_id: string,
    tenant_id: string
  ) {
    this.logger.debug({ function: 'save', data, user_id, tenant_id }, StoreRequisitionLogic.name);
    await this.storeRequisitionService.initializePrismaService(tenant_id, user_id);
    let updateSR = {};
    let updateSRDetail: any = {};

    if (state_role === enum_stage_role.create) {
      const extractId = this.populateData(data);
      const foreignValue: any = await this.mapperLogic.populate(extractId, user_id, tenant_id);

      updateSR = JSON.parse(JSON.stringify({
        ...data,
        workflow_name: foreignValue?.workflow_id?.name,
        department_name: foreignValue?.department_id?.name,
        requestor_name: foreignValue?.user_id?.name,
        from_location_name: foreignValue?.from_location_id?.name,
        from_location_code: foreignValue?.from_location_id?.code,
        to_location_name: foreignValue?.to_location_id?.name,
        to_location_code: foreignValue?.to_location_id?.code,
      }));

      updateSRDetail = {
        store_requisition_detail: {
          add: [],
          update: [],
          remove: []
        }
      };

      if (data?.store_requisition_detail?.add && data?.store_requisition_detail?.add.length > 0) {
        updateSRDetail.store_requisition_detail.add = data?.store_requisition_detail?.add;
        updateSRDetail?.store_requisition_detail?.add.forEach((detail) => {
          if (detail?.product_id) {
            detail.product_name = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.name;
            detail.product_local_name = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.local_name;
          }
        });
      }

      if (data?.store_requisition_detail?.update && data?.store_requisition_detail?.update.length > 0) {
        updateSRDetail.store_requisition_detail.update = data?.store_requisition_detail?.update;
        updateSRDetail?.store_requisition_detail?.update.forEach((detail) => {
          if (detail?.product_id) {
            detail.product_name = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.name;
            detail.product_local_name = foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.local_name;
          }
        });
      }

      if (data?.store_requisition_detail?.remove && data?.store_requisition_detail?.remove.length > 0) {
        updateSRDetail.store_requisition_detail.remove = data?.store_requisition_detail?.remove;
      }
    } else if (state_role === enum_stage_role.approve) {
      const extractIds = this.populateDetail(data);
      const foreignValue: any = await this.mapperLogic.populate(extractIds, user_id, tenant_id);
      updateSRDetail = [];
      for (const detail of data as any[]) {
        updateSRDetail.push(
          JSON.parse(
            JSON.stringify({
              ...detail,
              product_name: foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.name,
              product_local_name: foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.local_name,
            })
          )
        );
      }
    }

    const result = await this.storeRequisitionService.update(id, updateSR, updateSRDetail);
    return result;
  }

  async submit(id: string, payload: SubmitStoreRequisition, user_id: string, bu_code: string) {
    this.logger.debug({ function: 'submit', id, user_id, bu_code }, StoreRequisitionLogic.name);
    await this.storeRequisitionService.initializePrismaService(bu_code, user_id);
    const storeRequisitionResult = await this.storeRequisitionService.findById(id);
    if (storeRequisitionResult.isError()) {
      throw new Error('Store Requisition not found');
    }
    const storeRequisitionData = storeRequisitionResult.value;

    this.validateBeforeSubmit(storeRequisitionData);

    const populateData: any = await this.mapperLogic.populate({
      workflow_id: storeRequisitionData?.workflow_id,
      user_id: user_id,
    }, user_id, bu_code);

    const workflowData = (populateData as any)?.workflow_id?.data;

    const res = this.masterService.send(
      { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
      {
        workflowData,
        currentStatus: '',
        requestData: {},
      },
    );
    const workflowHeader: NavigateForwardResult = await firstValueFrom(res);
    const lastActionAtDate = new Date();

    const workflow_history = storeRequisitionData?.workflow_history?.length > 0 ? storeRequisitionData?.workflow_history : [];
    workflow_history.push({
      action: enum_last_action.submitted,
      datetime: lastActionAtDate,
      user: {
        id: user_id,
        name: populateData?.user_id?.name
      },
      current_stage: workflowHeader.navigation_info.current_stage_info.name,
      next_stage: workflowHeader.navigation_info.next_stage_info?.name
    });

    let userAction = null;

    if (workflowHeader.navigation_info.current_stage_info.creator_access === creatorAccess.ALL_PEOPLE_IN_DEPARTMENT_CAN_ACTION) {
      const res = this.masterService.send(
        { cmd: 'department-users.find-by-department', service: 'department-users' },
        {
          department_id: storeRequisitionData.department_id,
          user_id,
          bu_code
        },
      );
      const usersInDepartment: { data: string[] } = await firstValueFrom(res);
      const distinctUsers = this.distinctData([...workflowHeader?.navigation_info?.current_stage_info?.assigned_users || [], ...usersInDepartment.data]);
      userAction = { execute: distinctUsers };
    }

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
    };

    const result = await this.storeRequisitionService.submit(id, payload, workflow);

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
    }: {
      state_role: enum_stage_role;
      details: any;
    },
    user_id: string,
    tenant_id: string
  ) {
    await this.storeRequisitionService.initializePrismaService(tenant_id, user_id);
    const updateSRDetail = [];
    const extractIds = this.populateDetail(details);
    const foreignValue: any = await this.mapperLogic.populate(extractIds, user_id, tenant_id);

    for (const detail of details as any[]) {
      updateSRDetail.push(
        JSON.parse(
          JSON.stringify({
            ...detail,
            product_name: foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.name,
            product_local_name: foreignValue?.product_ids?.find((product) => product?.id === detail?.product_id)?.local_name,
          })
        )
      );
    }

    const storeRequisitionResult = await this.storeRequisitionService.findById(id);
    if (storeRequisitionResult.isError()) {
      throw new Error('Store Requisition not found');
    }
    const storeRequisitionData = storeRequisitionResult.value;

    const populateData: any = await this.mapperLogic.populate({
      workflow_id: storeRequisitionData?.workflow_id,
      user_id: user_id,
    }, user_id, tenant_id);

    const workflowData = (populateData as any)?.workflow_id?.data;

    const res = this.masterService.send(
      { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
      {
        workflowData,
        currentStatus: storeRequisitionData?.workflow_current_stage,
        previousStatus: storeRequisitionData?.workflow_previous_stage,
        requestData: {},
      },
    );
    const workflowHeader: NavigateForwardResult = await firstValueFrom(res);

    const workflow_history = storeRequisitionData?.workflow_history;
    const lastActionAtDate = new Date();
    let workflow = {};

    if (!workflowHeader.navigation_info.workflow_next_step) {
      workflow_history.push({
        action: enum_last_action.approved,
        datetime: lastActionAtDate,
        user: {
          id: user_id,
          name: populateData?.user_id?.name
        },
        current_stage: workflowHeader.current_stage,
        next_stage: '-'
      });
      workflow = {
        workflow_previous_stage: storeRequisitionData.workflow_current_stage,
        workflow_current_stage: workflowHeader.current_stage,
        workflow_next_stage: '-',
        user_action: [],
        last_action: enum_last_action.approved,
        last_action_at_date: lastActionAtDate.toISOString(),
        last_action_by_id: user_id,
        last_action_by_name: populateData?.user_id?.name,
        workflow_history: workflow_history
      };
    } else {
      workflow_history.push({
        action: enum_last_action.approved,
        datetime: lastActionAtDate,
        user: {
          id: user_id,
          name: populateData?.user_id?.name
        },
        current_stage: storeRequisitionData?.workflow_current_stage,
        next_stage: workflowHeader.navigation_info.workflow_next_step
      });
      let userAction = null;

      if (workflowHeader.navigation_info.current_stage_info.creator_access === creatorAccess.ALL_PEOPLE_IN_DEPARTMENT_CAN_ACTION) {
        const res = this.masterService.send(
          { cmd: 'department-users.find-by-department', service: 'department-users' },
          {
            department_id: storeRequisitionData.department_id,
            user_id,
            tenant_id
          },
        );
        const usersInDepartment: { data: string[] } = await firstValueFrom(res);
        const distinctUsers = this.distinctData([...workflowHeader?.navigation_info?.current_stage_info?.assigned_users || [], ...usersInDepartment.data]);
        userAction = { execute: distinctUsers };
      }

      workflow = {
        workflow_previous_stage: workflowHeader.navigation_info.workflow_previous_step,
        workflow_current_stage: workflowHeader.current_stage,
        workflow_next_stage: workflowHeader.navigation_info.workflow_next_step,
        user_action: userAction,
        last_action: enum_last_action.approved,
        last_action_at_date: lastActionAtDate.toISOString(),
        last_action_by_id: user_id,
        last_action_by_name: populateData?.user_id?.name,
        workflow_history: workflow_history
      };
    }

    this.logger.debug({ function: 'approve', id, state_role, details, user_id, tenant_id }, StoreRequisitionLogic.name);
    const result = await this.storeRequisitionService.approve(id, workflow, updateSRDetail);

    this.sendApproveNotification(
      storeRequisitionData,
      workflow as WorkflowHeader,
      user_id,
      populateData?.user_id?.name,
    );

    return result;
  }

  private populateData(data) {
    const headerFields = {
      workflow_id: data?.workflow_id,
      requestor_id: data?.requestor_id,
      department_id: data?.department_id,
      user_id: data?.requestor_id,
      from_location_id: data?.from_location_id,
      to_location_id: data?.to_location_id,
    };

    const product_ids = [];

    if (data?.store_requisition_detail?.add) {
      for (const detail of data.store_requisition_detail.add) {
        if (detail?.product_id) {
          product_ids.push(detail?.product_id);
        }
      }
    }

    if ((data as IUpdateStoreRequisition)?.store_requisition_detail?.update) {
      for (const detail of (data as IUpdateStoreRequisition).store_requisition_detail.update) {
        if (detail?.product_id) {
          product_ids.push(detail?.product_id);
        }
      }
    }

    const extractId = {
      ...headerFields,
      product_ids,
    };

    return extractId;
  }

  private populateDetail(data: any[]) {
    const product_ids = [];

    for (const detail of data) {
      if (detail?.product_id) {
        product_ids.push(detail?.product_id);
      }
    }

    return {
      product_ids,
    };
  }

  private validateBeforeSubmit(storeRequisition: StoreRequisition) {
    ValidateSRBeforeSubmitSchema.parse(storeRequisition);
  }

  private distinctData(d: any[]): any[] {
    return [...new Set(d)];
  }

  private async sendSubmitNotification(
    storeRequisition: any,
    workflow: WorkflowHeader,
    submitterId: string,
    submitterName: string,
  ): Promise<void> {
    try {
      const approverIds = workflow.user_action?.execute || [];
      if (approverIds.length === 0) return;

      const srNo = storeRequisition?.sr_no || 'N/A';
      const title = `Store Requisition Submitted: ${srNo}`;
      const message = `${submitterName} has submitted Store Requisition ${srNo} for your approval.`;

      await this.notificationService.sendToUsers({
        to_user_ids: approverIds,
        from_user_id: submitterId,
        title,
        message,
        type: NotificationType.SR,
        metadata: {
          sr_id: storeRequisition?.id,
          sr_no: srNo,
          action: 'submitted',
          current_stage: workflow.workflow_current_stage,
        },
      });

      this.logger.log(`Notification sent to ${approverIds.length} approver(s) for SR ${srNo}`);
    } catch (error) {
      this.logger.error('Failed to send submit notification:', error);
    }
  }

  private async sendApproveNotification(
    storeRequisition: any,
    workflow: WorkflowHeader,
    approverId: string,
    approverName: string,
  ): Promise<void> {
    try {
      const srNo = storeRequisition?.sr_no || 'N/A';
      const requestorId = storeRequisition?.requestor_id;
      const isFullyApproved = workflow.workflow_next_stage === '-';

      if (requestorId) {
        const title = isFullyApproved
          ? `Store Requisition Approved: ${srNo}`
          : `Store Requisition Progress: ${srNo}`;
        const message = isFullyApproved
          ? `Your Store Requisition ${srNo} has been fully approved by ${approverName}.`
          : `Your Store Requisition ${srNo} has been approved by ${approverName} and moved to ${workflow.workflow_current_stage}.`;

        await this.notificationService.sendSRNotification(
          requestorId,
          title,
          message,
          {
            sr_id: storeRequisition?.id,
            sr_no: srNo,
            action: 'approved',
            current_stage: workflow.workflow_current_stage,
            is_fully_approved: isFullyApproved,
          },
          approverId,
        );
      }

      if (!isFullyApproved) {
        const nextApproverIds = workflow.user_action?.execute || [];
        if (nextApproverIds.length > 0) {
          await this.notificationService.sendToUsers({
            to_user_ids: nextApproverIds,
            from_user_id: approverId,
            title: `Store Requisition Pending Approval: ${srNo}`,
            message: `Store Requisition ${srNo} requires your approval at stage: ${workflow.workflow_current_stage}.`,
            type: NotificationType.SR,
            metadata: {
              sr_id: storeRequisition?.id,
              sr_no: srNo,
              action: 'pending_approval',
              current_stage: workflow.workflow_current_stage,
            },
          });
        }
      }

      this.logger.log(`Approval notification sent for SR ${srNo}`);
    } catch (error) {
      this.logger.error('Failed to send approve notification:', error);
    }
  }
}
