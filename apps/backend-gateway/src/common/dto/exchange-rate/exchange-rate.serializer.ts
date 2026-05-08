import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

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

// Detail response schema (for findOne with audit enrichment)
export const ExchangeRateDetailResponseSchema = ExchangeRateBaseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  tb_currency: z.any().nullable().optional(),
  audit: AuditSchema.optional(),
}).passthrough();

// List item response schema (for findAll)
export const ExchangeRateListItemResponseSchema = ExchangeRateBaseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  audit: AuditSchema.optional(),
}).passthrough();

// Mutation response schema (for create, update, delete)
export const ExchangeRateMutationResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string().optional(),
}).passthrough();
