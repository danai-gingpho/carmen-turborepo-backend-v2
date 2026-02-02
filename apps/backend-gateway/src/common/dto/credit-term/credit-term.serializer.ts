import { z } from 'zod';

// Credit term response schema (for findOne and list items)
export const CreditTermResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type CreditTermResponse = z.infer<typeof CreditTermResponseSchema>;

// Credit term detail response schema (for findOne)
export const CreditTermDetailResponseSchema = CreditTermResponseSchema;

export type CreditTermDetailResponse = z.infer<typeof CreditTermDetailResponseSchema>;

// Credit term list item response schema
export const CreditTermListItemResponseSchema = CreditTermResponseSchema;

export type CreditTermListItemResponse = z.infer<typeof CreditTermListItemResponseSchema>;

// Mutation response schema
export const CreditTermMutationResponseSchema = z.object({
  id: z.string(),
});

export type CreditTermMutationResponse = z.infer<typeof CreditTermMutationResponseSchema>;
