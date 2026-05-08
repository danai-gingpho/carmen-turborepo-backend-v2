import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

// Embedded schema for stock out detail
const StockOutDetailEmbeddedSchema = z.object({
  id: z.string(),
  sequence_no: z.number().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  product_local_name: z.string().nullable().optional(),
  product_sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  qty: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
});

// Stock Out detail response schema (for findOne)
export const StockOutDetailResponseSchema = z.object({
  id: z.string(),
  so_date: z.coerce.date().nullable().optional(),
  so_no: z.string().nullable().optional(),
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
  stock_out_detail: z.array(StockOutDetailEmbeddedSchema).optional(),
  audit: AuditSchema.optional(),
});

export type StockOutDetailResponse = z.infer<typeof StockOutDetailResponseSchema>;

// Stock Out list item response schema (for findAll — uses enriched audit block)
export const StockOutListItemResponseSchema = z.object({
  id: z.string(),
  so_date: z.coerce.date().nullable().optional(),
  so_no: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  adjustment_type_id: z.string().nullable().optional(),
  adjustment_type_code: z.string().nullable().optional(),
  adjustment_type_name: z.string().nullable().optional(),
  doc_status: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  location_code: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  location_type: z.string().nullable().optional(),
  // workflow_name: z.string().nullable().optional(),
  // workflow_current_stage: z.string().nullable().optional(),
  item_count: z.number().optional().default(0),
  base_total_cost: z.number().optional().default(0),
  audit: AuditSchema.optional(),
});

export type StockOutListItemResponse = z.infer<typeof StockOutListItemResponseSchema>;

// Mutation response schema
export const StockOutMutationResponseSchema = z.object({
  id: z.string(),
  so_no: z.string().optional(),
});

export type StockOutMutationResponse = z.infer<typeof StockOutMutationResponseSchema>;
