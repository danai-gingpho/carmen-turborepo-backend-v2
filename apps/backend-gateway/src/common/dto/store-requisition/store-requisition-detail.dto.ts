import { z } from 'zod';
import { EmbeddedProductSchema, ValidateSchema } from '../embedded.dto';
import { state_status } from '../purchase-request/state_role/purchase-request.state-role.dto';

// Create Store Requisition Detail Schema
export const CreateStoreRequisitionDetailSchema = z.object({
  description: z.string().optional().nullable(),
  current_stage_status: z.nativeEnum(state_status).optional(),
})
  .merge(EmbeddedProductSchema.extend({
    product_id: ValidateSchema.shape.uuid,
  }))
  .extend({
    requested_qty: z.number(),
    info: z.any().optional(),
    dimension: z.any().optional(),
  });

// Update Store Requisition Detail Schema
export const UpdateStoreRequisitionDetailSchema = CreateStoreRequisitionDetailSchema.extend({
  id: ValidateSchema.shape.uuid,
});

// Base detail schema for state changes
const BaseStateChangeDetailSchema = z.object({
  id: ValidateSchema.shape.uuid,
  stage_status: z.nativeEnum(state_status),
  stage_message: z.string().nullable(),
});

// Approve Role - Approve Store Requisition Detail Schema
export const ApproveRoleApproveStoreRequisitionDetailSchema = BaseStateChangeDetailSchema.extend({
  approved_qty: z.number(),
});

// Issue Role - Issue Store Requisition Detail Schema
export const IssueRoleApproveStoreRequisitionDetailSchema = BaseStateChangeDetailSchema.extend({
  issued_qty: z.number(),
});

// State Change Schema (for submit, review, reject)
export const StoreRequisitionStateChangeSchema = BaseStateChangeDetailSchema;

// Types
export type CreateStoreRequisitionDetail = z.infer<typeof CreateStoreRequisitionDetailSchema>;
export type UpdateStoreRequisitionDetail = z.infer<typeof UpdateStoreRequisitionDetailSchema>;
export type ApproveRoleApproveStoreRequisitionDetail = z.infer<typeof ApproveRoleApproveStoreRequisitionDetailSchema>;
export type IssueRoleApproveStoreRequisitionDetail = z.infer<typeof IssueRoleApproveStoreRequisitionDetailSchema>;
export type StoreRequisitionStateChange = z.infer<typeof StoreRequisitionStateChangeSchema>;
