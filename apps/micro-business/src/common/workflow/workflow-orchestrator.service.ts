import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { enum_last_action, enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { creatorAccess, NavigateForwardResult } from '@/common/workflow/workflow.types';
import { BackendLogger } from '@/common/helpers/backend.logger';
import {
  UserActionProfile,
  WorkflowDocument,
  WorkflowHeader,
} from './workflow.interfaces';

/**
 * Shared workflow orchestration logic.
 *
 * Extracts the duplicated "navigate → build history → build user_action → construct WorkflowHeader"
 * pattern that was copy-pasted across PR, PO, and SR logic layers.
 *
 * Every consumer constructs a canonical `WorkflowDocument` via a per-service
 * mapper before calling these build* methods. The orchestrator never reads
 * fields outside `WorkflowDocument`, so adding a new workflow consumer
 * requires zero changes here.
 */
@Injectable()
export class WorkflowOrchestratorService {
  private readonly logger = new BackendLogger(WorkflowOrchestratorService.name);

  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
    @Inject('AUTH_SERVICE')
    private readonly authService: ClientProxy,
    private readonly mapperLogic: MapperLogic,
  ) {}

  // ===========================================================================
  // Public: build WorkflowHeader for each action
  // ===========================================================================

  /**
   * Build a WorkflowHeader for the SUBMIT action.
   *
   * Handles the "if no current stage, get first stage then navigate forward" pattern.
   */
  async buildSubmitWorkflow(
    document: WorkflowDocument,
    userId: string,
    buCode: string,
  ): Promise<WorkflowHeader> {
    const workflowData = await this.resolveWorkflowData(document.workflow_id, userId, buCode);
    const requestData = document.navigation_request_data;

    // Determine current stage for navigation
    let currentStageForNavigation = document.workflow_current_stage;
    let previousStage = currentStageForNavigation;

    if (!currentStageForNavigation) {
      const firstNav = await this.navigateForward(workflowData, '', requestData);
      currentStageForNavigation = firstNav.navigation_info.current_stage_info?.name;
      previousStage = currentStageForNavigation;
    }

    const nav = await this.navigateForward(workflowData, currentStageForNavigation, requestData);
    const lastActionAtDate = new Date();
    const userName = await this.resolveUserName(userId, buCode);

    const workflowHistory = [...document.workflow_history];
    workflowHistory.push({
      action: enum_last_action.submitted,
      datetime: lastActionAtDate.toISOString(),
      user: { id: userId, name: userName },
      current_stage: previousStage,
      next_stage: nav.current_stage,
    });

    const dept = document.department;
    const userAction = await this.buildUserAction(
      nav.navigation_info.current_stage_info,
      dept?.id ?? null,
      dept?.name ?? null,
      userId,
      buCode,
    );

    return {
      workflow_previous_stage: nav.previous_stage,
      workflow_current_stage: nav.current_stage,
      workflow_next_stage: nav.navigation_info.workflow_next_step,
      user_action: userAction,
      last_action: enum_last_action.submitted,
      last_action_at_date: lastActionAtDate.toISOString(),
      last_action_by_id: userId,
      last_action_by_name: userName,
      workflow_history: workflowHistory,
    };
  }

  /**
   * Build a WorkflowHeader for the APPROVE action.
   *
   * Returns `isFinalApproval` so the caller can set the correct document status.
   */
  async buildApproveWorkflow(
    document: WorkflowDocument,
    userId: string,
    buCode: string,
  ): Promise<{ workflow: WorkflowHeader; isFinalApproval: boolean }> {
    const workflowData = await this.resolveWorkflowData(document.workflow_id, userId, buCode);
    const requestData = document.navigation_request_data;

    const nav = await this.navigateForward(
      workflowData,
      document.workflow_current_stage,
      requestData,
      document.workflow_previous_stage,
    );

    const lastActionAtDate = new Date();
    const userName = await this.resolveUserName(userId, buCode);
    const isFinalApproval = !nav.navigation_info.workflow_next_step;
    const workflowHistory = [...document.workflow_history];

    workflowHistory.push({
      action: enum_last_action.approved,
      datetime: lastActionAtDate.toISOString(),
      user: { id: userId, name: userName },
      current_stage: nav.previous_stage,
      next_stage: isFinalApproval ? '-' : nav.current_stage,
    });

    if (isFinalApproval) {
      workflowHistory.push({
        action: 'completed',
        datetime: lastActionAtDate.toISOString(),
        user: { id: userId, name: userName },
        current_stage: nav.current_stage,
        next_stage: '-',
      });
    }

    let userAction: { execute: UserActionProfile[] } | null = null;
    if (!isFinalApproval) {
      const dept = document.department;
      userAction = await this.buildUserAction(
        nav.navigation_info.current_stage_info,
        dept?.id ?? null,
        dept?.name ?? null,
        userId,
        buCode,
      );
    }

    const workflow: WorkflowHeader = {
      workflow_previous_stage: nav.previous_stage,
      workflow_current_stage: nav.current_stage,
      workflow_next_stage: isFinalApproval ? '-' : nav.navigation_info.workflow_next_step,
      user_action: isFinalApproval ? { execute: [] } : userAction,
      last_action: enum_last_action.approved,
      last_action_at_date: lastActionAtDate.toISOString(),
      last_action_by_id: userId,
      last_action_by_name: userName,
      workflow_history: workflowHistory,
    };

    return { workflow, isFinalApproval };
  }

  /**
   * Build a WorkflowHeader for the REJECT action.
   *
   * Rejection terminates the workflow — sets next_stage to '-', user_action to [].
   */
  async buildRejectWorkflow(
    document: WorkflowDocument,
    userId: string,
    buCode: string,
  ): Promise<WorkflowHeader> {
    const userName = await this.resolveUserName(userId, buCode);
    const lastActionAtDate = new Date();
    const workflowHistory = [...document.workflow_history];
    const currentStage = document.workflow_current_stage;

    workflowHistory.push({
      action: enum_last_action.rejected,
      datetime: lastActionAtDate.toISOString(),
      user: { id: userId, name: userName },
      current_stage: currentStage,
      next_stage: '-',
    });

    return {
      workflow_previous_stage: currentStage,
      workflow_current_stage: currentStage,
      workflow_next_stage: '-',
      user_action: { execute: [] },
      last_action: enum_last_action.rejected,
      last_action_at_date: lastActionAtDate.toISOString(),
      last_action_by_id: userId,
      last_action_by_name: userName,
      workflow_history: workflowHistory,
    };
  }

  /**
   * Build a WorkflowHeader for the REVIEW (send-back) action.
   *
   * Throws when the destination is the create stage but the document has no
   * `requestor_id`. That guard exists because the previous adapter pattern
   * silently produced `user_action.execute = []` in this case, leaving the
   * buyer/creator with `role: "view_only"` and unable to act on their own
   * document. Failing loudly makes the upstream data shape problem visible
   * before bad data lands in the database.
   */
  async buildReviewWorkflow(
    document: WorkflowDocument,
    desStage: string,
    userId: string,
    buCode: string,
  ): Promise<WorkflowHeader> {
    const userName = await this.resolveUserNameFromAuth(userId);

    const backRes = this.masterService.send(
      { cmd: 'workflows.navigate-back-to-stage', service: 'workflows' },
      {
        workflow_id: document.workflow_id,
        user_id: userId,
        bu_code: buCode,
        stage: desStage,
        current_stage: document.workflow_current_stage,
        requestData: document.navigation_request_data,
      },
    );
    const backToStageRes = await firstValueFrom(backRes);
    const nav: NavigateForwardResult = backToStageRes.data;

    const lastActionAtDate = new Date();
    const workflowHistory = [...document.workflow_history];

    workflowHistory.push({
      action: enum_last_action.reviewed,
      datetime: lastActionAtDate.toISOString(),
      user: { id: userId, name: userName },
      current_stage: document.workflow_current_stage,
      next_stage: nav.current_stage,
    });

    const dept = document.department;
    const destStageInfo = nav.navigation_info.current_stage_info;

    // The destination is the first/create stage when there is no previous step
    // in the navigation history. The workflow service returns workflow_previous_step
    // = null only when currentIndex has been moved back to position 0.
    const isCreateStage = !nav.navigation_info.workflow_previous_step;
    const isCreatorOnlyStage =
      destStageInfo?.creator_access === creatorAccess.ONLY_CREATOR || isCreateStage;

    let userAction: { execute: UserActionProfile[] } | null;
    if (isCreatorOnlyStage) {
      // When reviewing back to a creator-only stage (e.g., "Create Request"),
      // only the original requestor should act — not all assigned_users.
      // Also covers the case where the workflow's first stage isn't explicitly
      // tagged with creator_access: 'only_creator' but is still the create stage.
      if (!document.requestor_id) {
        throw new Error(
          `buildReviewWorkflow: cannot resolve requestor for document ${document.id}. ` +
          `requestor_id is null but the destination stage "${nav.current_stage}" requires ` +
          `the original creator to act. The mapper likely received schema-stripped data ` +
          `that no longer carries buyer_id/created_by_id/requestor_id.`,
        );
      }

      const profilesRes = this.authService.send(
        { cmd: 'get-user-profiles-by-ids', service: 'auth' },
        {
          user_ids: [document.requestor_id],
          department: dept ? { id: dept.id, name: dept.name } : undefined,
        },
      );
      const profilesResult: { data: UserActionProfile[] } = await firstValueFrom(profilesRes);
      userAction = { execute: profilesResult.data || [] };
    } else {
      userAction = await this.buildUserAction(
        destStageInfo,
        dept?.id ?? null,
        dept?.name ?? null,
        userId,
        buCode,
      );
    }

    return {
      workflow_previous_stage: nav.previous_stage,
      workflow_current_stage: nav.current_stage,
      workflow_next_stage: nav.navigation_info.workflow_next_step,
      user_action: userAction,
      last_action: enum_last_action.reviewed,
      last_action_at_date: lastActionAtDate.toISOString(),
      last_action_by_id: userId,
      last_action_by_name: userName,
      workflow_history: workflowHistory,
    };
  }

  // ===========================================================================
  // Public: buildUserAction (previously duplicated identically in PR, PO, SR)
  // ===========================================================================

  async buildUserAction(
    currentStageInfo: any,
    departmentId: string | null,
    departmentName: string | null,
    userId: string,
    buCode: string,
  ): Promise<{ execute: UserActionProfile[] } | null> {
    const userIdsToAssign: string[] = [];

    const assignedUsers: any[] = currentStageInfo?.assigned_users || [];
    for (const user of assignedUsers) {
      if (typeof user === 'string') {
        userIdsToAssign.push(user);
      } else if (user?.user_id) {
        userIdsToAssign.push(user.user_id);
      }
    }

    if (currentStageInfo?.creator_access === creatorAccess.ALL_PEOPLE_IN_DEPARTMENT_CAN_ACTION && departmentId) {
      const res = this.masterService.send(
        { cmd: 'department-users.find-by-department', service: 'department-users' },
        { department_id: departmentId, user_id: userId, bu_code: buCode },
      );
      const result: { data: { user_id: string }[] } = await firstValueFrom(res);
      userIdsToAssign.push(...result.data.map((u) => u.user_id));
    }

    if (currentStageInfo?.is_hod === true && departmentId) {
      const hodRes = this.masterService.send(
        { cmd: 'department-users.get-hod-in-department', service: 'department-users' },
        { department_id: departmentId, user_id: userId, bu_code: buCode },
      );
      const hodResult: { data: string[] } = await firstValueFrom(hodRes);
      userIdsToAssign.push(...hodResult.data);
    }

    if (userIdsToAssign.length === 0) {
      return null;
    }

    const distinctUserIds = [...new Set(userIdsToAssign)];

    const profilesRes = this.authService.send(
      { cmd: 'get-user-profiles-by-ids', service: 'auth' },
      {
        user_ids: distinctUserIds,
        department: departmentId ? { id: departmentId, name: departmentName } : undefined,
      },
    );
    const profilesResult: { data: UserActionProfile[] } = await firstValueFrom(profilesRes);

    return { execute: profilesResult.data || [] };
  }

  // ===========================================================================
  // Public: resolveUserRole (used by findById in PR, PO, SR)
  // ===========================================================================

  /**
   * Determine the user's role for a workflow document.
   *
   * Shared logic from findById across PR, PO, SR:
   * 1. If document is in draft and user is the creator → 'create'
   * 2. Otherwise, look up the current stage detail from the workflow service
   * 3. If user is in user_action.execute → use the stage's role
   * 4. Otherwise → 'view_only'
   *
   * @param isDraft - Whether the document is in draft status
   * @param isCreator - Whether the current user created the document
   * @param workflowId - The workflow ID on the document
   * @param currentStage - The current workflow stage name
   * @param userAction - The user_action JSON field from the document
   * @param userId - Current user ID
   * @param buCode - Business unit code
   */
  async resolveUserRole(
    isDraft: boolean,
    isCreator: boolean,
    workflowId: string | null,
    currentStage: string | null,
    userAction: any,
    userId: string,
    buCode: string,
  ): Promise<enum_stage_role> {
    if (isDraft && isCreator) {
      return enum_stage_role.create;
    }

    if (!workflowId || !currentStage) {
      return enum_stage_role.view_only;
    }

    try {
      const workflowCallReq = this.masterService.send(
        { cmd: 'workflows.get-workflow-stage-detail', service: 'workflows' },
        {
          workflow_id: workflowId,
          stage: currentStage,
          user_id: userId,
          bu_code: buCode,
        },
      );
      const callResult = await firstValueFrom(workflowCallReq);
      const stageDetail = callResult.data;

      const userActionExecute = userAction?.execute || [];
      const userIds: string[] = userActionExecute
        .map((u: any) => (typeof u === 'string' ? u : u?.user_id))
        .filter(Boolean);

      return userIds.includes(userId)
        ? (stageDetail.role as enum_stage_role)
        : enum_stage_role.view_only;
    } catch {
      return enum_stage_role.view_only;
    }
  }

  // ===========================================================================
  // Public: workflow query helpers (used by findById, myPending, review endpoints)
  // ===========================================================================

  /**
   * Get previous workflow stages for a document (used by review/sendback UI).
   *
   * Calls `workflows.get-previous-stages` and returns a numbered map.
   * Previously duplicated in PR and PO services.
   */
  async getPreviousStages(
    workflowId: string,
    currentStage: string,
    userId: string,
    buCode: string,
  ): Promise<Record<string, string>> {
    const res = this.masterService.send(
      { cmd: 'workflows.get-previous-stages', service: 'workflows' },
      {
        workflow_id: workflowId,
        stage: currentStage,
        user_id: userId,
        bu_code: buCode,
      },
    );

    const response = await firstValueFrom(res);

    if (response.response?.status !== 200) {
      throw new Error(response.response?.message || 'Failed to get previous stages');
    }

    const stages = Array.isArray(response.data) ? response.data : [];
    const numberedStages: Record<string, string> = {};
    stages.forEach((name: string, index: number) => {
      numberedStages[String(index + 1)] = name;
    });

    return numberedStages;
  }

  /**
   * Get all workflow stages across multiple workflow IDs.
   *
   * Used by the "filter by stage" dropdown in list views.
   * Previously only in PR service.
   */
  async findAllWorkflowStages(
    workflowIds: string[],
    userId: string,
    buCode: string,
  ): Promise<string[]> {
    const res = this.masterService.send(
      { cmd: 'workflows.get-all-workflows-stages', service: 'workflows' },
      {
        workflow_ids: workflowIds,
        user_id: userId,
        bu_code: buCode,
      },
    );
    const response = await firstValueFrom(res);
    return response.data || [];
  }

  // ===========================================================================
  // Private: internal helpers
  // ===========================================================================

  private async resolveWorkflowData(
    workflowId: string,
    userId: string,
    buCode: string,
  ): Promise<any> {
    const populateData: Record<string, any> = await this.mapperLogic.populate(
      { workflow_id: workflowId },
      userId,
      buCode,
    );
    return populateData?.workflow_id?.data;
  }

  async resolveUserName(userId: string, buCode: string): Promise<string> {
    const populateData: Record<string, any> = await this.mapperLogic.populate(
      { user_id: userId },
      userId,
      buCode,
    );
    return populateData?.user_id?.name || '';
  }

  private async resolveUserNameFromAuth(userId: string): Promise<string> {
    const res: Observable<any> = this.authService.send(
      { cmd: 'get-user-by-id', service: 'auth' },
      { id: userId },
    );
    const result = await firstValueFrom(res);
    return result?.data?.name || '';
  }

  private async navigateForward(
    workflowData: any,
    currentStatus: string,
    requestData: Record<string, any>,
    previousStatus?: string,
  ): Promise<NavigateForwardResult> {
    const res = this.masterService.send(
      { cmd: 'workflows.get-workflow-navigation', service: 'workflows' },
      {
        workflowData,
        currentStatus,
        ...(previousStatus ? { previousStatus } : {}),
        requestData,
      },
    );
    return firstValueFrom(res);
  }
}
