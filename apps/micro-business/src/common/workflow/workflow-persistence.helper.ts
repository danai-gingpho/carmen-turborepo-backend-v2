import { stage_status } from '@/procurement/purchase-request/dto/purchase-request-detail.dto';
import { StageStatus, WorkflowHeader } from './workflow.interfaces';
import { Prisma } from '@repo/prisma-shared-schema-tenant';

/**
 * Pure-function helpers for the repeated stages_status / history array
 * manipulations that every workflow-enabled service performs inside its
 * Prisma transaction.
 *
 * These are intentionally static so they can be called inside transactions
 * without requiring DI.
 */
export class WorkflowPersistenceHelper {
  // ---------------------------------------------------------------------------
  // stages_status builders
  // ---------------------------------------------------------------------------

  /**
   * Build stages_status for SUBMIT.
   *
   * Logic (from PR/PO/SR):
   * - If detail.stage_status is 'approve' → skip (return original)
   * - If detail.stage_status is 'submit' → push first entry (seq 1)
   * - If latest is pending at the same stage → replace it
   * - Otherwise → push new entry
   */
  static buildSubmitStagesStatus(
    current: StageStatus[],
    detail: { stage_status: string; stage_message?: string | null },
    workflowPreviousStage: string,
  ): { stages: StageStatus[]; skipped: boolean } {
    const stages: StageStatus[] = [...current];

    if (detail.stage_status === stage_status.approve) {
      return { stages, skipped: true };
    }

    // Reject is terminal: once any stage is reject, the row is dead — never
    // resubmit, never re-review, never re-approve.
    if (stages.some((s) => s.status === stage_status.reject)) {
      return { stages, skipped: true };
    }

    // Once an item has been approved at any stage, resubmits must not push
    // another entry — the item has already moved past the submit step.
    if (stages.some(s => s.status === stage_status.approve)) {
      return { stages, skipped: true };
    }

    const latest = stages[stages.length - 1];

    if (
      (latest?.status === stage_status.pending || latest?.status === stage_status.submit) &&
      latest?.name === workflowPreviousStage
    ) {
      stages[stages.length - 1] = {
        seq: stages.length,
        status: detail.stage_status as stage_status,
        name: workflowPreviousStage,
        message: detail.stage_message || (detail.stage_status === stage_status.submit ? 'submit for approval' : ''),
      };
    } else if (detail.stage_status === stage_status.submit) {
      stages.push({
        seq: stages.length + 1,
        status: detail.stage_status as stage_status,
        name: workflowPreviousStage,
        message: detail.stage_message || 'submit for approval',
      });
    } else {
      stages.push({
        seq: stages.length + 1,
        status: detail.stage_status as stage_status,
        name: workflowPreviousStage,
        message: detail.stage_message || '',
      });
    }

    return { stages, skipped: false };
  }

  /**
   * Build stages_status for APPROVE.
   *
   * Logic (from PR/SR — PO is slightly different but same structure):
   * - If latest is 'reject' → skip
   * - If latest is 'pending' at the same stage → replace
   * - Otherwise → push new entry
   *
   * Returns { stages, skipped } so the caller knows whether to skip the detail update.
   */
  static buildApproveStagesStatus(
    current: StageStatus[],
    detail: { stage_status?: string; stage_message?: string | null },
    workflowPreviousStage: string,
  ): { stages: StageStatus[]; skipped: boolean } {
    const stages: StageStatus[] = [...current];
    const latest = stages[stages.length - 1];

    // Reject is terminal: never re-approve a rejected row.
    if (stages.some((s) => s.status === stage_status.reject)) {
      return { stages, skipped: true };
    }

    if (stages.some(s => s.status === stage_status.approve && s.name === workflowPreviousStage)) {
      return { stages, skipped: true };
    }

    if (
      latest?.status === stage_status.pending &&
      latest?.name === workflowPreviousStage
    ) {
      stages[stages.length - 1] = {
        ...latest,
        status: (detail.stage_status || '') as stage_status,
        message: detail.stage_message || '',
      };
    } else {
      stages.push({
        seq: stages.length + 1,
        status: (detail.stage_status || '') as stage_status,
        name: workflowPreviousStage,
        message: detail.stage_message || '',
      });
    }

    return { stages, skipped: false };
  }

  /**
   * Build stages_status for REJECT.
   *
   * Logic (identical across PR/PO/SR):
   * - Mark ALL existing stages as 'reject'
   * - Append the rejection entry
   */
  static buildRejectStagesStatus(
    current: StageStatus[],
    detail: { stage_status: string; stage_message?: string | null },
    workflowCurrentStage: string,
  ): StageStatus[] {
    const stages: StageStatus[] = current.map((s) => ({
      ...s,
      status: stage_status.reject,
    }));

    stages.push({
      seq: stages.length + 1,
      status: detail.stage_status as stage_status,
      name: workflowCurrentStage,
      message: detail.stage_message || '',
    });

    return stages;
  }

  /**
   * Build stages_status for REVIEW (send back).
   *
   * Logic:
   * - If any stage has been rejected, the row is terminal — return unchanged.
   * - Find the LAST entry whose name === desStage.
   * - Preserve approve entries past it (permanent achievements survive rollback).
   * - If the row has any downstream approve, mark the target stage 'approve'
   *   too so the row continues to display approved while sitting at the
   *   rolled-back stage. Otherwise mark the target 'pending'.
   * - Drop other entries past the target (pending/submit/review become invalid).
   */
  static buildReviewStagesStatus(
    current: StageStatus[],
    desStage: string,
    message?: string,
  ): StageStatus[] {
    if (current.some((s) => s.status === stage_status.reject)) {
      return current.map((s) => ({ ...s }));
    }

    let targetIdx = -1;
    for (let i = current.length - 1; i >= 0; i--) {
      if (current[i].name === desStage) { targetIdx = i; break; }
    }
    if (targetIdx === -1) return current.map((s) => ({ ...s }));

    const before = current.slice(0, targetIdx).map((s) => ({ ...s }));
    const afterApproves = current
      .slice(targetIdx + 1)
      .filter((s) => s.status === stage_status.approve)
      .map((s) => ({ ...s }));
    const hasDownstreamApprove = afterApproves.length > 0;
    const target: StageStatus = {
      ...current[targetIdx],
      status: hasDownstreamApprove ? stage_status.approve : stage_status.pending,
      message: message || '',
    };
    return [...before, target, ...afterApproves];
  }

  /**
   * Build stages_status for REVIEW action.
   * Maps each detail to the correct builder based on its stage_status:
   * - 'approve' → buildApproveStagesStatus
   * - 'reject'  → buildRejectStagesStatus
   * - 'review'  → buildReviewStagesStatus (roll back)
   */
  static buildReviewDetailStagesStatus(
    current: StageStatus[],
    detail: { stage_status: string; stage_message?: string | null },
    stageName: string,
    desStage: string,
  ): StageStatus[] {
    switch (detail.stage_status) {
      case stage_status.approve:
        return this.buildApproveStagesStatus(current, detail, stageName).stages;
      case stage_status.reject:
        return this.buildRejectStagesStatus(current, detail, stageName);
      default:
        return this.buildReviewStagesStatus(current, desStage, detail.stage_message);
    }
  }

  /**
   * Auto-generate a submit detail entry based on current stages_status.
   * Used when the frontend doesn't send details in the submit payload.
   *
   * - Items with latest status 'approve' or 'reject' → null (skip)
   * - Otherwise → { stage_status: 'submit' }
   */
  static autoGenerateSubmitDetail(
    detailId: string,
    currentStages: StageStatus[],
  ): { id: string; stage_status: stage_status; stage_message: string } | null {
    const latest = currentStages[currentStages.length - 1];
    if (latest?.status === stage_status.approve || latest?.status === stage_status.reject) {
      return null;
    }
    return { id: detailId, stage_status: stage_status.submit, stage_message: '' };
  }

  // ---------------------------------------------------------------------------
  // history builder
  // ---------------------------------------------------------------------------

  /**
   * Append a history entry. Works for all actions (submit, approve, reject, review).
   */
  static appendHistory(
    current: Record<string, unknown>[],
    entry: {
      status: string;
      name: string;
      message?: string;
      userId: string;
      userName?: string;
      action?: string;
      datetime?: string;
    },
  ): Record<string, unknown>[] {
    const history = [...(current || [])];
    const now = entry.datetime || new Date().toISOString();

    history.push({
      seq: history.length + 1,
      status: entry.status,
      name: entry.name,
      message: entry.message || '',
      user: {
        id: entry.userId,
        ...(entry.userName ? { name: entry.userName } : {}),
      },
      ...(entry.action ? { action: entry.action } : {}),
      datetime: now,
    });

    return history;
  }

  // ---------------------------------------------------------------------------
  // current_stage_status resolver
  //
  // Single source of truth for the per-row `current_stage_status` field.
  // Rule: look up the doc's post-action workflow_current_stage in the row's
  // stages_status. If the entry is 'approve' → 'approve'. If 'reject' → 'reject'.
  // Otherwise (missing / pending / submit) → ''. Reject in payload always wins.
  // ---------------------------------------------------------------------------

  static resolveCurrentStageStatus(input: {
    payloadStatus: string;
    stages: StageStatus[];
    workflowCurrentStage: string;
  }): string {
    if (input.payloadStatus === stage_status.reject) return stage_status.reject;
    // Reject is terminal: any reject anywhere in the stage history wins.
    if (input.stages.some((s) => s.status === stage_status.reject)) return stage_status.reject;
    for (let i = input.stages.length - 1; i >= 0; i--) {
      const s = input.stages[i];
      if (s.name !== input.workflowCurrentStage) continue;
      if (s.status === stage_status.approve || s.status === stage_status.submit) return stage_status.approve;
      return '';
    }
    return '';
  }

  // ---------------------------------------------------------------------------
  // Composite detail-update builders
  //
  // These methods compose the low-level stage/history helpers above and return
  // a uniform `DetailUpdateBag` that every service can write directly into
  // `tx.tb_X_detail.update({ data: bag })`. The key business rules that MUST
  // live here (not in individual services):
  //
  // - current_stage_status: always computed via resolveCurrentStageStatus
  //   against the doc's post-action workflow_current_stage.
  // - skip logic: stages helpers signal `skipped` when the row's stages_status
  //   shouldn't change (already-approved rows on submit/approve, etc.). The
  //   composite returns `null`; callers must STILL refresh current_stage_status
  //   via the resolver (see service caller pattern).
  //
  // Service-specific extra fields (SR's reject_by_id, review_by_id, etc.)
  // are spread ON TOP of this bag by the caller.
  // ---------------------------------------------------------------------------

  /**
   * Return shape from composite detail-update builders.
   * `null` when the detail should be skipped (not updated).
   */
  static buildSubmitDetailUpdate(input: {
    payloadDetail: { stage_status: string; stage_message?: string | null };
    currentStages: StageStatus[];
    currentHistory: Record<string, unknown>[];
    workflowPreviousStage: string;
    workflowCurrentStage: string;
    userId: string;
    userName?: string;
    action?: string;
  }): { stages_status: StageStatus[]; history: Record<string, unknown>[]; current_stage_status: string } | null {
    const { stages, skipped } = this.buildSubmitStagesStatus(
      input.currentStages,
      input.payloadDetail,
      input.workflowPreviousStage,
    );
    if (skipped) return null;

    const history = this.appendHistory(input.currentHistory, {
      status: input.payloadDetail.stage_status,
      name: input.workflowPreviousStage,
      message: input.payloadDetail.stage_message || (input.payloadDetail.stage_status === stage_status.submit ? 'submit for approval' : ''),
      userId: input.userId,
      userName: input.userName,
      action: input.action,
    });

    return {
      stages_status: stages,
      history,
      current_stage_status: this.resolveCurrentStageStatus({
        payloadStatus: input.payloadDetail.stage_status,
        stages,
        workflowCurrentStage: input.workflowCurrentStage,
      }),
    };
  }

  static buildApproveDetailUpdate(input: {
    payloadDetail: { stage_status?: string; stage_message?: string | null };
    currentStages: StageStatus[];
    currentHistory: Record<string, unknown>[];
    workflowPreviousStage: string;
    workflowCurrentStage: string;
    userId: string;
    userName?: string;
    action?: string;
  }): { stages_status: StageStatus[]; history: Record<string, unknown>[]; current_stage_status: string } | null {
    const isReject = input.payloadDetail.stage_status === stage_status.reject;

    let stages: StageStatus[];
    if (isReject) {
      stages = this.buildRejectStagesStatus(
        input.currentStages,
        input.payloadDetail as { stage_status: string; stage_message?: string | null },
        input.workflowPreviousStage,
      );
    } else {
      const result = this.buildApproveStagesStatus(
        input.currentStages,
        input.payloadDetail,
        input.workflowPreviousStage,
      );
      if (result.skipped) return null;
      stages = result.stages;
    }

    const history = this.appendHistory(input.currentHistory, {
      status: input.payloadDetail.stage_status || '',
      name: input.workflowPreviousStage,
      message: input.payloadDetail.stage_message || '',
      userId: input.userId,
      userName: input.userName,
      action: input.action,
    });

    return {
      stages_status: stages,
      history,
      current_stage_status: this.resolveCurrentStageStatus({
        payloadStatus: input.payloadDetail.stage_status || '',
        stages,
        workflowCurrentStage: input.workflowCurrentStage,
      }),
    };
  }

  static buildRejectDetailUpdate(input: {
    payloadDetail: { stage_status: string; stage_message?: string | null };
    currentStages: StageStatus[];
    currentHistory: Record<string, unknown>[];
    workflowCurrentStage: string;
    userId: string;
    userName?: string;
    action?: string;
  }): { stages_status: StageStatus[]; history: Record<string, unknown>[]; current_stage_status: string } {
    const stages = this.buildRejectStagesStatus(
      input.currentStages,
      input.payloadDetail,
      input.workflowCurrentStage,
    );

    const history = this.appendHistory(input.currentHistory, {
      status: stage_status.reject,
      name: input.workflowCurrentStage,
      message: input.payloadDetail.stage_message || '',
      userId: input.userId,
      userName: input.userName,
      action: input.action,
    });

    return {
      stages_status: stages,
      history,
      current_stage_status: stage_status.reject,
    };
  }

  static buildReviewDetailUpdate(input: {
    payloadDetail: { stage_status: string; stage_message?: string | null };
    currentStages: StageStatus[];
    currentHistory: Record<string, unknown>[];
    workflowPreviousStage: string;
    workflowCurrentStage: string;
    desStage: string;
    userId: string;
    userName?: string;
    action?: string;
  }): { stages_status: StageStatus[]; history: Record<string, unknown>[]; current_stage_status: string } | null {
    // Reject is terminal: never modify a row that has any reject in its history.
    if (input.currentStages.some((s) => s.status === stage_status.reject)) {
      return null;
    }

    const isApprove = input.payloadDetail.stage_status === stage_status.approve;

    let stages: StageStatus[];
    if (isApprove) {
      // Approve-during-review: persist the approve entry so future submit/approve
      // calls dedupe correctly (otherwise the prior approval is silently lost on
      // resubmit). Honor buildApproveStagesStatus's skipped signal so already-
      // approved rows stay untouched.
      const result = this.buildApproveStagesStatus(
        input.currentStages,
        input.payloadDetail,
        input.workflowPreviousStage,
      );
      if (result.skipped) return null;
      stages = result.stages;
    } else {
      stages = this.buildReviewDetailStagesStatus(
        input.currentStages,
        input.payloadDetail,
        input.workflowPreviousStage,
        input.desStage,
      );
    }

    const history = this.appendHistory(input.currentHistory, {
      status: input.payloadDetail.stage_status,
      name: input.workflowPreviousStage,
      message: input.payloadDetail.stage_message || '',
      userId: input.userId,
      userName: input.userName,
      action: input.action,
    });

    return {
      stages_status: stages,
      history,
      current_stage_status: this.resolveCurrentStageStatus({
        payloadStatus: input.payloadDetail.stage_status,
        stages,
        workflowCurrentStage: input.workflowCurrentStage,
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // Prisma data helpers
  // ---------------------------------------------------------------------------

  /**
   * Cast WorkflowHeader fields for Prisma update (JSON columns need InputJsonValue).
   */
  static toWorkflowPrismaData(workflow: WorkflowHeader): Record<string, unknown> {
    return {
      ...workflow,
      workflow_history: workflow.workflow_history as unknown as Prisma.InputJsonValue,
      user_action: workflow.user_action as unknown as Prisma.InputJsonValue,
    };
  }
}
