import { z } from 'zod';
import { decimalField } from '../../common/validation/zod-helpers';

// Currency response schema (for findOne and list items)
export const CurrencyResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  symbol: z.string().nullable().optional(),
  exchange_rate: decimalField,
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
  description: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type CurrencyResponse = z.infer<typeof CurrencyResponseSchema>;

// Currency detail response schema (for findOne)
export const CurrencyDetailResponseSchema = CurrencyResponseSchema;

export type CurrencyDetailResponse = z.infer<typeof CurrencyDetailResponseSchema>;

// Currency list item response schema (same as CurrencyResponseSchema for this entity)
export const CurrencyListItemResponseSchema = CurrencyResponseSchema;

export type CurrencyListItemResponse = z.infer<typeof CurrencyListItemResponseSchema>;

// Mutation response schema
export const CurrencyMutationResponseSchema = z.object({
  id: z.string(),
});

export type CurrencyMutationResponse = z.infer<typeof CurrencyMutationResponseSchema>;
