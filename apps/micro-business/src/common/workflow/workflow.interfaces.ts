import { stage_status } from '@/procurement/purchase-request/dto/purchase-request-detail.dto';
import { enum_last_action } from '@repo/prisma-shared-schema-tenant';

// ---------------------------------------------------------------------------
// Core workflow data structures (previously duplicated in PR, PO, SR)
// ---------------------------------------------------------------------------

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

export type WorkflowHistoryAction = enum_last_action | 'completed';

export interface WorkflowHistory {
  action: WorkflowHistoryAction;
  datetime: string | Date;
  user: {
    id: string;
    name: string;
  };
  current_stage: string;
  next_stage: string;
}

export interface WorkflowHeader {
  workflow_previous_stage: string;
  workflow_current_stage: string;
  workflow_next_stage: string;
  user_action: { execute: UserActionProfile[] } | null;
  last_action: enum_last_action;
  last_action_at_date: string | Date;
  last_action_by_id: string;
  last_action_by_name: string;
  workflow_history: WorkflowHistory[];
}

export interface StageStatus {
  seq: number;
  status: stage_status;
  name: string;
  message: string;
}

// ---------------------------------------------------------------------------
// WorkflowDocument: canonical input shape for the workflow orchestrator.
//
// Every consumer (PR, PO, SR, future modules) must build one of these via a
// pure mapper function in their own domain folder before calling the
// orchestrator. The orchestrator NEVER reads anything beyond these fields, so
// adding a new workflow consumer requires zero changes to the orchestrator.
//
// History note:
//   This shape replaces the previous `WorkflowDocumentAdapter<any>` pattern.
//   The adapter pattern accepted `any` documents and used per-service adapter
//   classes to read fields. That allowed schema-stripped data (from
//   findById's Zod parse) to be passed silently, ending up with
//   `requestor_id = null` and `user_action.execute = []`. The buyer/creator
//   then got `role: "view_only"` and couldn't act on their own document.
//   By making this a concrete typed input, TypeScript catches the same class
//   of bug at compile time.
// ---------------------------------------------------------------------------

export interface WorkflowDocument {
  /** Document primary key — used in error messages from runtime guards. */
  id: string;

  /** Workflow definition ID this document follows. */
  workflow_id: string;

  /** Current workflow stage name, or null if the document hasn't started. */
  workflow_current_stage: string | null;

  /** Previous workflow stage name, or null. */
  workflow_previous_stage: string | null;

  /**
   * Workflow history array. Mappers MUST forward the persisted history from
   * the document — passing `[]` here will erase prior workflow events.
   */
  workflow_history: WorkflowHistory[];

  /**
   * The requestor/creator user ID — the user who should act when the
   * document is sent back to the create stage.
   *
   * - PR/SR: doc.requestor_id
   * - PO: doc.buyer_id ?? doc.created_by_id
   *
   * May be null for documents that don't yet have an owner; the orchestrator
   * throws at runtime when this is null in a code path that requires it
   * (e.g. buildReviewWorkflow's create-stage branch).
   */
  requestor_id: string | null;

  /**
   * Department for assignee resolution.
   *
   * - PR/SR: read directly from doc.department_id / doc.department_name
   * - PO: looked up separately from the creator's department membership
   *   (PO doesn't store department on the header)
   */
  department: { id: string; name: string } | null;

  /**
   * Service-specific input passed to the workflow navigation engine.
   *
   * - PR/PO: `{ amount: <total> }` — used by amount-based stage routing rules
   * - SR: `{}`
   */
  navigation_request_data: Record<string, unknown>;
}
