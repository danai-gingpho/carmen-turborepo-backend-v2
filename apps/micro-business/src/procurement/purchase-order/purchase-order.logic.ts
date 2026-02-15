import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { creatorAccess, NavigateForwardResult, NotificationService, NotificationType } from '@/common';
import { enum_last_action, enum_purchase_order_doc_status, enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ApprovePurchaseOrderDto } from './dto/approve-purchase-order.dto';

export interface UserActionProfile {
  user_id: string;
  email: string;
  firstname: string;
  middlename: string;
  lastname: string;
  initials: string;
  department: {
    id: string;
    name: string;
  } | null;
}

export interface WorkflowHeader {
  workflow_previous_stage: string;
  workflow_current_stage: string;
  workflow_next_stage: string;
  user_action: { execute: UserActionProfile[] };
  last_action: enum_last_action;
  last_action_at_date: string | Date;
  last_action_by_id: string;
  last_action_by_name: string;
  workflow_history: WorkflowHistory[];
}

interface WorkflowHistory {
  action: enum_last_action;
  datetime: string | Date;
  user: {
    id: string;
    name: string;
  };
  current_stage: string;
  next_stage: string;
}

@Injectable()
export class PurchaseOrderLogic {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseOrderLogic.name,
  );

  constructor(
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly mapperLogic: MapperLogic,
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    @Inject('AUTH_SERVICE')
    private readonly authService: ClientProxy,
    private readonly notificationService: NotificationService,
  ) {}

  async approve(
    id: string,
    { state_role, details }: ApprovePurchaseOrderDto,
    user_id: string,
    tenant_id: string,
  ) {
    await this.purchaseOrderService.initializePrismaService(tenant_id, user_id);

    // Validate user's role matches the payload's state_role
    await this.validateUserStateRole(id, state_role);

    // Enrich detail data with foreign values
    const extractIds = this.populateDetail(details);
    const foreignValue: any = await this.mapperLogic.populate(extractIds, user_id, tenant_id);
    const updatePODetail = [];
    for (const detail of details) {
      updatePODetail.push(this.enrichApproveDetail(detail, foreignValue));
    }

    /* Workflow Station */
    const purchaseOrderResult = await this.purchaseOrderService.findById(id);
    if (purchaseOrderResult.isError()) {
      throw new Error('Purchase Order not found');
    }
    const purchaseOrderData = purchaseOrderResult.value;
    const total_amount = purchaseOrderData?.tb_purchase_order_detail?.reduce(
      (curr, acc) => curr + Number(acc.total_price || 0),
      0,
    );

    const populateData: any = await this.mapperLogic.populate(
      {
        workflow_id: purchaseOrderData?.workflow_id,
        user_id: user_id,
      },
      user_id,
      tenant_id,
    );

    const workflowData = (populateData as any)?.workflow_id?.data;

    const res = this.masterService.send(
      { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
      {
        workflowData,
        currentStatus: purchaseOrderData?.workflow_current_stage,
        previousStatus: purchaseOrderData?.workflow_previous_stage,
        requestData: {
          amount: total_amount,
        },
      },
    );
    const workflowHeader: NavigateForwardResult = await firstValueFrom(res);

    const workflow_history = purchaseOrderData?.workflow_history || [];
    const lastActionAtDate = new Date();
    let workflow = {};

    if (!workflowHeader.navigation_info.workflow_next_step) {
      // Final approval - no next stage
      workflow_history.push({
        action: enum_last_action.approved,
        datetime: lastActionAtDate,
        user: {
          id: user_id,
          name: populateData?.user_id?.name,
        },
        current_stage: workflowHeader.navigation_info.current_stage_info.name,
        next_stage: '-',
      });
      workflow = {
        workflow_previous_stage: purchaseOrderData.workflow_current_stage,
        workflow_current_stage: workflowHeader.navigation_info.current_stage_info.name,
        workflow_next_stage: '-',
        user_action: [],
        last_action: enum_last_action.approved,
        last_action_at_date: lastActionAtDate.toISOString(),
        last_action_by_id: user_id,
        last_action_by_name: populateData?.user_id?.name,
        workflow_history: workflow_history,
        po_status: enum_purchase_order_doc_status.sent,
        approval_date: lastActionAtDate,
      };
    } else {
      // More stages to go
      workflow_history.push({
        action: enum_last_action.approved,
        datetime: lastActionAtDate,
        user: {
          id: user_id,
          name: populateData?.user_id?.name,
        },
        current_stage: purchaseOrderData?.workflow_current_stage,
        next_stage: workflowHeader.navigation_info.current_stage_info.name,
      });

      const userAction = await this.buildUserAction(
        workflowHeader.navigation_info.current_stage_info,
        user_id,
        tenant_id,
      );

      workflow = {
        workflow_previous_stage: workflowHeader.navigation_info.workflow_previous_step,
        workflow_current_stage: workflowHeader.navigation_info.current_stage_info.name,
        workflow_next_stage: workflowHeader.navigation_info.next_stage_info?.name,
        user_action: userAction,
        last_action: enum_last_action.approved,
        last_action_at_date: lastActionAtDate.toISOString(),
        last_action_by_id: user_id,
        last_action_by_name: populateData?.user_id?.name,
        workflow_history: workflow_history,
        po_status: enum_purchase_order_doc_status.in_progress,
      };
    }

    this.logger.debug(
      { function: 'approve', id, state_role, details, user_id, tenant_id },
      PurchaseOrderLogic.name,
    );
    const result = await this.purchaseOrderService.approve(id, workflow, updatePODetail);

    // Send notification for approval
    this.sendApproveNotification(
      purchaseOrderData,
      workflow as WorkflowHeader,
      user_id,
      populateData?.user_id?.name,
      tenant_id,
    );

    return result;
  }

  private populateDetail(details: any[]) {
    const unit_ids = [];
    const tax_profile_ids = [];

    for (const detail of details) {
      if (detail?.order_unit_id) {
        unit_ids.push(detail?.order_unit_id);
      }
      if (detail?.base_unit_id) {
        unit_ids.push(detail?.base_unit_id);
      }
      if (detail?.tax_profile_id) {
        tax_profile_ids.push(detail?.tax_profile_id);
      }
    }

    return {
      unit_ids,
      tax_profile_ids,
    };
  }

  private enrichApproveDetail(detail: any, foreignValue: any): any {
    return JSON.parse(
      JSON.stringify({
        ...detail,
        order_unit_name: this.findById(foreignValue?.unit_ids, detail?.order_unit_id)?.name || detail?.order_unit_name,
        base_unit_name: this.findById(foreignValue?.unit_ids, detail?.base_unit_id)?.name || detail?.base_unit_name,
        tax_profile_name: this.findById(foreignValue?.tax_profile_ids, detail?.tax_profile_id)?.name || detail?.tax_profile_name,
      }),
    );
  }

  private findById(arr: any[], id: string): any {
    if (!arr || !id) return null;
    return arr.find((item) => item.id === id);
  }

  private async validateUserStateRole(
    id: string,
    payloadStateRole: enum_stage_role,
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

    if (payloadStateRole !== userActualRole) {
      throw new BadRequestException(
        `Invalid state_role. Expected: ${userActualRole}, Received: ${payloadStateRole}`,
      );
    }
  }

  private async buildUserAction(
    currentStageInfo: any,
    user_id: string,
    bu_code: string,
  ): Promise<{ execute: any[] } | null> {
    const userIdsToAssign: string[] = [];

    // Always add assigned_users from workflow stage
    const assignedUsers = currentStageInfo?.assigned_users || [];
    for (const user of assignedUsers) {
      if (typeof user === 'string') {
        userIdsToAssign.push(user);
      } else if (user?.user_id) {
        userIdsToAssign.push(user.user_id);
      }
    }

    // Add all users in department if creator_access flag is set
    if (currentStageInfo?.creator_access === creatorAccess.ALL_PEOPLE_IN_DEPARTMENT_CAN_ACTION) {
      // For PO, we don't have department_id in the same way as PR
      // This might need adjustment based on your business logic
    }

    if (userIdsToAssign.length === 0) {
      return null;
    }

    // Get distinct user IDs
    const distinctUserIds = [...new Set(userIdsToAssign)];

    // Fetch full user profiles from auth service
    const profilesRes = this.authService.send(
      { cmd: 'get-user-profiles-by-ids', service: 'auth' },
      { user_ids: distinctUserIds, bu_code },
    );
    const profilesResult: { data: UserActionProfile[] } = await firstValueFrom(profilesRes);

    return { execute: profilesResult.data || [] };
  }

  private async sendApproveNotification(
    purchaseOrder: any,
    workflow: WorkflowHeader,
    user_id: string,
    user_name: string,
    bu_code: string,
  ): Promise<void> {
    try {
      // Determine if this is final approval
      const isFinalApproval = workflow.workflow_next_stage === '-';
      const poNo = purchaseOrder.po_no;

      if (isFinalApproval) {
        // Send notification to buyer/creator that PO is approved
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
        // Send notification to next approvers
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
}
