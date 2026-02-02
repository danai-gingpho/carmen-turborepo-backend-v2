import { z } from 'zod';

// Embedded schema for stock in detail
const StockInDetailEmbeddedSchema = z.object({
  id: z.string(),
  sequence_no: z.number().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_local_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  location_code: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  qty: z.number().nullable().optional(),
  cost_per_unit: z.number().nullable().optional(),
  total_cost: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
});

// Stock In detail response schema (for findOne)
export const StockInDetailResponseSchema = z.object({
  id: z.string(),
  si_no: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adjustment_type_id: z.string().nullable().optional(),
  adjustment_type_code: z.string().nullable().optional(),
  doc_status: z.string().nullable().optional(),
  // workflow_id: z.string().nullable().optional(),
  // workflow_name: z.string().nullable().optional(),
  // workflow_current_stage: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().optional(),
  updated_by_id: z.string().nullable().optional(),
  stock_in_detail: z.array(StockInDetailEmbeddedSchema).optional(),
});

export type StockInDetailResponse = z.infer<typeof StockInDetailResponseSchema>;

// Stock In list item response schema (for findAll)
export const StockInListItemResponseSchema = z.object({
  id: z.string(),
  si_no: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adjustment_type_id: z.string().nullable().optional(),
  adjustment_type_code: z.string().nullable().optional(),
  doc_status: z.string().nullable().optional(),
  // workflow_name: z.string().nullable().optional(),
  // workflow_current_stage: z.string().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type StockInListItemResponse = z.infer<typeof StockInListItemResponseSchema>;

// Mutation response schema
export const StockInMutationResponseSchema = z.object({
  id: z.string(),
  si_no: z.string().optional(),
});

export type StockInMutationResponse = z.infer<typeof StockInMutationResponseSchema>;
