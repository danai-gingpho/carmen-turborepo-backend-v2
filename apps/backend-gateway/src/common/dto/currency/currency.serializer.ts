import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

const decimalField = z.number().or(z.string()).pipe(z.coerce.number()).nullable().optional();

// Currency response schema (for findOne and list items)
export const CurrencyResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  symbol: z.string().nullable().optional(),
  exchange_rate: decimalField,
  exchange_rate_at: z.coerce.date().nullable().optional(),
  decimal_places: z.number().int().nullable().optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
  description: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type CurrencyResponse = z.infer<typeof CurrencyResponseSchema>;

// Currency detail response schema (for findOne with audit enrichment)
export const CurrencyDetailResponseSchema = CurrencyResponseSchema
  .omit({ created_at: true, updated_at: true })
  .extend({ audit: AuditSchema.optional() });

export type CurrencyDetailResponse = z.infer<typeof CurrencyDetailResponseSchema>;

// Currency list item response schema
export const CurrencyListItemResponseSchema = CurrencyResponseSchema
  .omit({ created_at: true, updated_at: true })
  .extend({ audit: AuditSchema.optional() });

export type CurrencyListItemResponse = z.infer<typeof CurrencyListItemResponseSchema>;

// Mutation response schema
export const CurrencyMutationResponseSchema = z.object({
  id: z.string(),
});

export type CurrencyMutationResponse = z.infer<typeof CurrencyMutationResponseSchema>;
