import { enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  ApproveRoleApproveStoreRequisitionDetailSchema,
  IssueRoleApproveStoreRequisitionDetailSchema,
  StoreRequisitionStateChangeSchema,
} from '../store-requisition-detail.dto';

// ============================================================================
// Approve Action - Discriminated Union by state_role (approve, issue)
// ============================================================================

// Approve by State Role - Approve (sets approved_qty)
const ApproveByStateRoleApproveSchema = z.object({
  state_role: z.literal(enum_stage_role.approve),
  details: z.array(ApproveRoleApproveStoreRequisitionDetailSchema),
});

// Approve by State Role - Issue (sets issued_qty)
const ApproveByStateRoleIssueSchema = z.object({
  state_role: z.literal(enum_stage_role.issue),
  details: z.array(IssueRoleApproveStoreRequisitionDetailSchema),
});

// Discriminated Union for Approve Action
export const ApproveStoreRequisitionByStateRoleSchema = z.discriminatedUnion('state_role', [
  ApproveByStateRoleApproveSchema,
  ApproveByStateRoleIssueSchema,
]);

// ============================================================================
// Review Action - Send back to previous stage
// ============================================================================

const ReviewStoreRequisitionSchema = z.object({
  state_role: z.nativeEnum(enum_stage_role),
  des_stage: z.string().nullable(),
  details: z.array(StoreRequisitionStateChangeSchema),
});

// ============================================================================
// Reject Action
// ============================================================================

const RejectStoreRequisitionSchema = z.object({
  state_role: z.nativeEnum(enum_stage_role),
  details: z.array(StoreRequisitionStateChangeSchema),
});

// ============================================================================
// Submit Action
// ============================================================================

const SubmitStoreRequisitionSchema = z.object({
  state_role: z.nativeEnum(enum_stage_role),
  details: z.array(StoreRequisitionStateChangeSchema),
});

// ============================================================================
// Types
// ============================================================================

export type ApproveStoreRequisitionByStateRoleApprove = z.infer<typeof ApproveByStateRoleApproveSchema>;
export type ApproveStoreRequisitionByStateRoleIssue = z.infer<typeof ApproveByStateRoleIssueSchema>;
export type ApproveStoreRequisitionByStateRole = z.infer<typeof ApproveStoreRequisitionByStateRoleSchema>;
export type SubmitStoreRequisition = z.infer<typeof SubmitStoreRequisitionSchema>;
export type ReviewStoreRequisition = z.infer<typeof ReviewStoreRequisitionSchema>;
export type RejectStoreRequisition = z.infer<typeof RejectStoreRequisitionSchema>;

// ============================================================================
// DTOs
// ============================================================================

export class SubmitStoreRequisitionDto extends createZodDto(SubmitStoreRequisitionSchema) {}
export class ReviewStoreRequisitionDto extends createZodDto(ReviewStoreRequisitionSchema) {}
export class RejectStoreRequisitionDto extends createZodDto(RejectStoreRequisitionSchema) {}
