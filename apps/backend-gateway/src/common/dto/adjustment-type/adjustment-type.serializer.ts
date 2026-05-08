import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

// Adjustment type detail response schema (for findOne with audit enrichment)
export const AdjustmentTypeDetailResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  audit: AuditSchema.optional(),
});

export type AdjustmentTypeDetailResponse = z.infer<typeof AdjustmentTypeDetailResponseSchema>;

// Adjustment type list item response schema (for findAll)
export const AdjustmentTypeListItemResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  audit: AuditSchema.optional(),
});

export type AdjustmentTypeListItemResponse = z.infer<typeof AdjustmentTypeListItemResponseSchema>;

// Mutation response schema
export const AdjustmentTypeMutationResponseSchema = z.object({
  id: z.string(),
});

export type AdjustmentTypeMutationResponse = z.infer<typeof AdjustmentTypeMutationResponseSchema>;
