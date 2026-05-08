import { enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  ApproveRoleApproveStoreRequisitionDetailSchema,
  IssueRoleApproveStoreRequisitionDetailSchema,
  StoreRequisitionStateChangeSchema,
} from '../store-requisition-detail.dto';
import { stage_status } from '../../purchase-request/stage_role/purchase-request.stage-role.dto';

// ============================================================================
// Approve Action - Discriminated Union by stage_role (approve, issue)
// ============================================================================

// When stage_status === 'reject', the user only needs to send id + stage_message.
// Inject sentinel defaults for the qty fields the strict schemas require, so the frontend
// doesn't have to fill approved_qty / issued_qty just to reject an item.
const fillRejectQtyDefaults = (val: unknown): unknown => {
  if (
    val && typeof val === 'object' &&
    (val as { stage_status?: unknown }).stage_status === stage_status.reject
  ) {
    return { approved_qty: 0, issued_qty: 0, ...(val as object) };
  }
  return val;
};

// Approve by Stage Role - Approve (sets approved_qty)
const ApproveByStageRoleApproveSchema = z.object({
  stage_role: z.literal(enum_stage_role.approve),
  details: z.array(z.preprocess(fillRejectQtyDefaults, ApproveRoleApproveStoreRequisitionDetailSchema)),
});

// Approve by Stage Role - Issue (sets issued_qty)
const ApproveByStageRoleIssueSchema = z.object({
  stage_role: z.literal(enum_stage_role.issue),
  details: z.array(z.preprocess(fillRejectQtyDefaults, IssueRoleApproveStoreRequisitionDetailSchema)),
});

// Discriminated Union for Approve Action
export const ApproveStoreRequisitionByStageRoleSchema = z.discriminatedUnion('stage_role', [
  ApproveByStageRoleApproveSchema,
  ApproveByStageRoleIssueSchema,
]);

// Wrapper schema for createZodDto (discriminated unions can't be used as class base types)
const ApproveStoreRequisitionByStageRoleDtoSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  details: z.array(z.any()),
}).pipe(ApproveStoreRequisitionByStageRoleSchema);

// ============================================================================
// Review Action - Send back to previous stage
// ============================================================================

const ReviewStoreRequisitionSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  des_stage: z.string().nullable(),
  details: z.array(StoreRequisitionStateChangeSchema),
});

// ============================================================================
// Reject Action
// ============================================================================

const RejectStoreRequisitionSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  details: z.array(StoreRequisitionStateChangeSchema),
});

// ============================================================================
// Submit Action
// ============================================================================

const SubmitStoreRequisitionSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  details: z.array(StoreRequisitionStateChangeSchema),
});

// ============================================================================
// Types
// ============================================================================

export type ApproveStoreRequisitionByStageRoleApprove = z.infer<typeof ApproveByStageRoleApproveSchema>;
export type ApproveStoreRequisitionByStageRoleIssue = z.infer<typeof ApproveByStageRoleIssueSchema>;
export type ApproveStoreRequisitionByStageRole = z.infer<typeof ApproveStoreRequisitionByStageRoleSchema>;
export type SubmitStoreRequisition = z.infer<typeof SubmitStoreRequisitionSchema>;
export type ReviewStoreRequisition = z.infer<typeof ReviewStoreRequisitionSchema>;
export type RejectStoreRequisition = z.infer<typeof RejectStoreRequisitionSchema>;

// ============================================================================
// DTOs
// ============================================================================

export class ApproveStoreRequisitionByStageRoleDto extends createZodDto(ApproveStoreRequisitionByStageRoleDtoSchema) {}
export class SubmitStoreRequisitionDto extends createZodDto(SubmitStoreRequisitionSchema) {}
export class ReviewStoreRequisitionDto extends createZodDto(ReviewStoreRequisitionSchema) {}
export class RejectStoreRequisitionDto extends createZodDto(RejectStoreRequisitionSchema) {}
