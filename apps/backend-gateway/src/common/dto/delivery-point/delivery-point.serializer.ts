import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

// Delivery Point response schema (for findOne)
export const DeliveryPointResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_active: z.boolean().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
});

export type DeliveryPointResponse = z.infer<typeof DeliveryPointResponseSchema>;

// Delivery Point detail response schema (for findById with audit enrichment)
export const DeliveryPointDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_active: z.boolean().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  audit: AuditSchema.optional(),
});

export type DeliveryPointDetailResponse = z.infer<typeof DeliveryPointDetailResponseSchema>;

// Delivery Point list item response schema (for findAll)
export const DeliveryPointListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  is_active: z.boolean().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  audit: AuditSchema.optional(),
});

export type DeliveryPointListItemResponse = z.infer<typeof DeliveryPointListItemResponseSchema>;

// Mutation response schema
export const DeliveryPointMutationResponseSchema = z.object({
  id: z.string(),
});

export type DeliveryPointMutationResponse = z.infer<typeof DeliveryPointMutationResponseSchema>;
