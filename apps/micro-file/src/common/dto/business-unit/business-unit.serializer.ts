import { z } from 'zod';

// Business unit response schema (for findOne and list items)
export const BusinessUnitResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type BusinessUnitResponse = z.infer<typeof BusinessUnitResponseSchema>;

// Business unit detail response schema (for findOne)
export const BusinessUnitDetailResponseSchema = BusinessUnitResponseSchema;

export type BusinessUnitDetailResponse = z.infer<typeof BusinessUnitDetailResponseSchema>;

// Business unit list item response schema
export const BusinessUnitListItemResponseSchema = BusinessUnitResponseSchema;

export type BusinessUnitListItemResponse = z.infer<typeof BusinessUnitListItemResponseSchema>;

// Mutation response schema
export const BusinessUnitMutationResponseSchema = z.object({
  id: z.string(),
});

export type BusinessUnitMutationResponse = z.infer<typeof BusinessUnitMutationResponseSchema>;
