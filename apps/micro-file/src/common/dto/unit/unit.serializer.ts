import { z } from 'zod';

// Unit response schema (for findOne and list items)
export const UnitResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type UnitResponse = z.infer<typeof UnitResponseSchema>;

// Unit detail response schema (for findOne)
export const UnitDetailResponseSchema = UnitResponseSchema;

export type UnitDetailResponse = z.infer<typeof UnitDetailResponseSchema>;

// Unit list item response schema
export const UnitListItemResponseSchema = UnitResponseSchema;

export type UnitListItemResponse = z.infer<typeof UnitListItemResponseSchema>;

// Mutation response schema
export const UnitMutationResponseSchema = z.object({
  id: z.string(),
});

export type UnitMutationResponse = z.infer<typeof UnitMutationResponseSchema>;
