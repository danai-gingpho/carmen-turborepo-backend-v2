import { enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  ApproveRoleApproveStoreRequisitionDetailSchema,
  IssueRoleApproveStoreRequisitionDetailSchema,
  StoreRequisitionStateChangeSchema,
} from '../store-requisition-detail.dto';

// ============================================================================
// Approve Action - Discriminated Union by stage_role (approve, issue)
// ============================================================================

// Approve by Stage Role - Approve (sets approved_qty)
const ApproveByStageRoleApproveSchema = z.object({
  stage_role: z.literal(enum_stage_role.approve),
  details: z.array(ApproveRoleApproveStoreRequisitionDetailSchema),
});

// Approve by Stage Role - Issue (sets issued_qty)
const ApproveByStageRoleIssueSchema = z.object({
  stage_role: z.literal(enum_stage_role.issue),
  details: z.array(IssueRoleApproveStoreRequisitionDetailSchema),
});

// Discriminated Union for Approve Action
export const ApproveStoreRequisitionByStageRoleSchema = z.discriminatedUnion('stage_role', [
  ApproveByStageRoleApproveSchema,
  ApproveByStageRoleIssueSchema,
]);

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

export class SubmitStoreRequisitionDto extends createZodDto(SubmitStoreRequisitionSchema) {}
export class ReviewStoreRequisitionDto extends createZodDto(ReviewStoreRequisitionSchema) {}
export class RejectStoreRequisitionDto extends createZodDto(RejectStoreRequisitionSchema) {}
