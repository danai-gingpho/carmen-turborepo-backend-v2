import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

// Unit base response schema (used for list items)
export const UnitResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  decimal_place: z.number().int().nonnegative(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
});

export type UnitResponse = z.infer<typeof UnitResponseSchema>;

// Unit detail response schema (for findOne — uses enriched audit block)
export const UnitDetailResponseSchema = UnitResponseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  audit: AuditSchema.optional(),
});

export type UnitDetailResponse = z.infer<typeof UnitDetailResponseSchema>;

// Unit list item response schema (for findAll — uses enriched audit block)
export const UnitListItemResponseSchema = UnitResponseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  audit: AuditSchema.optional(),
});

export type UnitListItemResponse = z.infer<typeof UnitListItemResponseSchema>;

// Mutation response schema
export const UnitMutationResponseSchema = z.object({
  id: z.string(),
});

export type UnitMutationResponse = z.infer<typeof UnitMutationResponseSchema>;
