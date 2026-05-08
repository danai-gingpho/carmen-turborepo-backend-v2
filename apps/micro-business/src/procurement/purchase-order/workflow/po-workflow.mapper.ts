import {
  WorkflowDocument,
  WorkflowHistory,
} from '@/common/workflow/workflow.interfaces';

/**
 * Map a Purchase Order record to the canonical WorkflowDocument shape that
 * the WorkflowOrchestratorService consumes.
 *
 * IMPORTANT: this mapper is a pure function. The caller is responsible for
 * resolving the creator's department asynchronously and passing it in —
 * PO does not store department on the header (unlike PR/SR), so the value
 * comes from looking up the creator's department membership.
 *
 * The bug-class fix lives here: requestor_id is resolved from
 * `buyer_id ?? created_by_id`. As long as findById's Prisma select includes
 * both fields and the response schema does not strip them, this can never
 * silently end up as null.
 */
export function poToWorkflowDocument(
  po: {
    id: string;
    workflow_id: string | null;
    workflow_current_stage: string | null;
    workflow_previous_stage: string | null;
    workflow_history?: unknown;
    buyer_id?: string | null;
    created_by_id?: string | null;
    purchase_order_detail?: { total_price?: unknown }[];
    tb_purchase_order_detail?: { total_price?: unknown }[];
  },
  creatorDepartment: { id: string; name: string } | null,
): WorkflowDocument {
  if (!po.workflow_id) {
    throw new Error(
      `poToWorkflowDocument: PO ${po.id} has no workflow_id — cannot run workflow actions on a PO without a workflow.`,
    );
  }

  // PO uses buyer_id as the primary requestor; falls back to created_by_id
  // for legacy POs created before buyer_id was tracked.
  const requestor_id = po.buyer_id ?? po.created_by_id ?? null;

  // findById renames `tb_purchase_order_detail` to `purchase_order_detail`,
  // so we read whichever the caller passes through. Without this fallback
  // the routed amount is always 0 and amount-based stage routing breaks.
  const details = po.purchase_order_detail ?? po.tb_purchase_order_detail ?? [];
  const amount = details.reduce(
    (sum, d) => sum + Number(d.total_price ?? 0),
    0,
  );

  const history = Array.isArray(po.workflow_history)
    ? (po.workflow_history as WorkflowHistory[])
    : [];

  return {
    id: po.id,
    workflow_id: po.workflow_id,
    workflow_current_stage: po.workflow_current_stage,
    workflow_previous_stage: po.workflow_previous_stage,
    workflow_history: history,
    requestor_id,
    department: creatorDepartment,
    navigation_request_data: {
      total_amount: amount,
      department: creatorDepartment?.id ?? null,
    },
  };
}
