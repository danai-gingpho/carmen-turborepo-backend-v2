import { z } from 'zod';

// Base schema for ExchangeRate (matches tb_exchange_rate database schema)
const ExchangeRateBaseSchema = z.object({
  id: z.string().uuid(),
  at_date: z.coerce.date().nullable().optional(),
  currency_id: z.string().uuid().nullable().optional(),
  currency_code: z.string().nullable().optional(),
  currency_name: z.string().nullable().optional(),
  exchange_rate: z.any().nullable().optional(), // Decimal from Prisma
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().uuid().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().uuid().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().uuid().nullable().optional(),
});

// Detail response schema (for findOne)
export const ExchangeRateDetailResponseSchema = ExchangeRateBaseSchema.extend({
  tb_currency: z.any().nullable().optional(),
}).passthrough();

// List item response schema (for findAll)
export const ExchangeRateListItemResponseSchema = ExchangeRateBaseSchema.passthrough();

// Mutation response schema (for create, update, delete)
export const ExchangeRateMutationResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string().optional(),
}).passthrough();
