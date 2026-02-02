import { z } from 'zod';

// Embedded schemas
const StoreRequisitionDetailEmbeddedSchema = z.object({
  id: z.string(),
  store_requisition_id: z.string().nullable().optional(),
  sequence_no: z.number().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_local_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  requested_qty: z.number().nullable().optional(),
  approved_qty: z.number().nullable().optional(),
  issued_qty: z.number().nullable().optional(),
  last_action: z.string().nullable().optional(),
  approved_message: z.string().nullable().optional(),
  approved_by_id: z.string().nullable().optional(),
  approved_by_name: z.string().nullable().optional(),
  approved_date_at: z.coerce.date().nullable().optional(),
  review_message: z.string().nullable().optional(),
  review_by_id: z.string().nullable().optional(),
  review_by_name: z.string().nullable().optional(),
  review_date_at: z.coerce.date().nullable().optional(),
  reject_message: z.string().nullable().optional(),
  reject_by_id: z.string().nullable().optional(),
  reject_by_name: z.string().nullable().optional(),
  reject_date_at: z.coerce.date().nullable().optional(),
  history: z.any().nullable().optional(),
  stages_status: z.any().nullable().optional(),
  current_stage_status: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
}).passthrough();

// Store requisition detail response schema (for findOne)
export const StoreRequisitionDetailResponseSchema = z.object({
  id: z.string(),
  sr_no: z.string().nullable().optional(),
  sr_date: z.coerce.date().nullable().optional(),
  expected_date: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),
  doc_status: z.string().nullable().optional(),
  from_location_id: z.string().nullable().optional(),
  from_location_code: z.string().nullable().optional(),
  from_location_name: z.string().nullable().optional(),
  to_location_id: z.string().nullable().optional(),
  to_location_code: z.string().nullable().optional(),
  to_location_name: z.string().nullable().optional(),
  workflow_id: z.string().nullable().optional(),
  workflow_name: z.string().nullable().optional(),
  workflow_history: z.any().nullable().optional(),
  workflow_current_stage: z.string().nullable().optional(),
  workflow_previous_stage: z.string().nullable().optional(),
  workflow_next_stage: z.string().nullable().optional(),
  user_action: z.any().nullable().optional(),
  last_action: z.string().nullable().optional(),
  last_action_at_date: z.coerce.date().nullable().optional(),
  last_action_by_id: z.string().nullable().optional(),
  last_action_by_name: z.string().nullable().optional(),
  requestor_id: z.string().nullable().optional(),
  requestor_name: z.string().nullable().optional(),
  department_id: z.string().nullable().optional(),
  department_name: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  store_requisition_detail: z.array(StoreRequisitionDetailEmbeddedSchema).optional(),
}).passthrough();

export type StoreRequisitionDetailResponse = z.infer<typeof StoreRequisitionDetailResponseSchema>;

// Store requisition list item response schema (for findAll)
export const StoreRequisitionListItemResponseSchema = z.object({
  id: z.string(),
  sr_no: z.string().nullable().optional(),
  sr_date: z.coerce.date().nullable().optional(),
  expected_date: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),
  doc_status: z.string().nullable().optional(),
  requestor_name: z.string().nullable().optional(),
  department_name: z.string().nullable().optional(),
  from_location_name: z.string().nullable().optional(),
  to_location_name: z.string().nullable().optional(),
  workflow_name: z.string().nullable().optional(),
  workflow_current_stage: z.string().nullable().optional(),
  workflow_previous_stage: z.string().nullable().optional(),
  workflow_next_stage: z.string().nullable().optional(),
  last_action: z.string().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  store_requisition_detail: z.array(z.object({
    requested_qty: z.number().nullable().optional(),
    approved_qty: z.number().nullable().optional(),
  })).optional(),
}).passthrough();

export type StoreRequisitionListItemResponse = z.infer<typeof StoreRequisitionListItemResponseSchema>;

// Mutation response schema
export const StoreRequisitionMutationResponseSchema = z.object({
  id: z.string(),
});

export type StoreRequisitionMutationResponse = z.infer<typeof StoreRequisitionMutationResponseSchema>;
