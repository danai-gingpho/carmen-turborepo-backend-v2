import {
  WorkflowDocument,
  WorkflowHistory,
} from '@/common/workflow/workflow.interfaces';

/**
 * Map a Purchase Request record to the canonical WorkflowDocument shape that
 * the WorkflowOrchestratorService consumes.
 *
 * Pure function — PR stores requestor and department directly on the header,
 * so no async lookups are needed.
 */
export function prToWorkflowDocument(
  pr: {
    id: string;
    workflow_id: string | null;
    workflow_current_stage: string | null;
    workflow_previous_stage: string | null;
    workflow_history?: unknown;
    requestor_id?: string | null;
    department_id?: string | null;
    department_name?: string | null;
    purchase_request_detail?: { total_price?: unknown }[];
    tb_purchase_request_detail?: { total_price?: unknown }[];
  },
): WorkflowDocument {
  if (!pr.workflow_id) {
    throw new Error(
      `prToWorkflowDocument: PR ${pr.id} has no workflow_id — cannot run workflow actions on a PR without a workflow.`,
    );
  }

  const details = pr.purchase_request_detail ?? pr.tb_purchase_request_detail ?? [];
  const amount = details.reduce(
    (sum, d) => sum + Number(d.total_price ?? 0),
    0,
  );

  const history = Array.isArray(pr.workflow_history)
    ? (pr.workflow_history as WorkflowHistory[])
    : [];

  const department =
    pr.department_id != null
      ? { id: pr.department_id, name: pr.department_name ?? '' }
      : null;

  return {
    id: pr.id,
    workflow_id: pr.workflow_id,
    workflow_current_stage: pr.workflow_current_stage,
    workflow_previous_stage: pr.workflow_previous_stage,
    workflow_history: history,
    requestor_id: pr.requestor_id ?? null,
    department,
    navigation_request_data: {
      total_amount: amount,
      department: pr.department_id ?? null,
    },
  };
}
