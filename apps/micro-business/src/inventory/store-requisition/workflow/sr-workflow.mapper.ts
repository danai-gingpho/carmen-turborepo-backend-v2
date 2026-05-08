import {
  WorkflowDocument,
  WorkflowHistory,
} from '@/common/workflow/workflow.interfaces';

/**
 * Map a Store Requisition record to the canonical WorkflowDocument shape
 * that the WorkflowOrchestratorService consumes.
 *
 * Async because SR detail rows do not store a price column — total_amount has
 * to be computed as Σ(qty × current_average_cost) per product. The cost lookup
 * is injected so this stays unit-testable without a Prisma instance.
 */
export async function srToWorkflowDocument(
  sr: {
    id: string;
    workflow_id: string | null;
    workflow_current_stage: string | null;
    workflow_previous_stage: string | null;
    workflow_history?: unknown;
    requestor_id?: string | null;
    department_id?: string | null;
    department_name?: string | null;
    tb_store_requisition_detail?: {
      product_id: string;
      requested_qty?: unknown;
      approved_qty?: unknown;
    }[];
    store_requisition_detail?: {
      product_id: string;
      requested_qty?: unknown;
      approved_qty?: unknown;
    }[];
  },
  getAverageCost: (product_id: string) => Promise<number>,
): Promise<WorkflowDocument> {
  if (!sr.workflow_id) {
    throw new Error(
      `srToWorkflowDocument: SR ${sr.id} has no workflow_id — cannot run workflow actions on an SR without a workflow.`,
    );
  }

  const history = Array.isArray(sr.workflow_history)
    ? (sr.workflow_history as WorkflowHistory[])
    : [];

  const department =
    sr.department_id != null
      ? { id: sr.department_id, name: sr.department_name ?? '' }
      : null;

  const details = sr.tb_store_requisition_detail ?? sr.store_requisition_detail ?? [];
  let total_amount = 0;
  for (const d of details) {
    const qty = Number(d.approved_qty ?? d.requested_qty ?? 0);
    if (!qty) continue;
    const cost = await getAverageCost(d.product_id);
    total_amount += qty * cost;
  }

  return {
    id: sr.id,
    workflow_id: sr.workflow_id,
    workflow_current_stage: sr.workflow_current_stage,
    workflow_previous_stage: sr.workflow_previous_stage,
    workflow_history: history,
    requestor_id: sr.requestor_id ?? null,
    department,
    navigation_request_data: {
      total_amount,
      department: sr.department_id ?? null,
    },
  };
}
