import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

const decimalFieldRequired = z.number().or(z.string()).pipe(z.coerce.number());

// Tax profile response schema (base — used internally)
export const TaxProfileResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  tax_rate: decimalFieldRequired,
  is_active: z.boolean().optional(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
});

export type TaxProfileResponse = z.infer<typeof TaxProfileResponseSchema>;

// Tax profile detail response schema (for findOne — uses enriched audit block)
export const TaxProfileDetailResponseSchema = TaxProfileResponseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  audit: AuditSchema.optional(),
});

export type TaxProfileDetailResponse = z.infer<typeof TaxProfileDetailResponseSchema>;

// Tax profile list item response schema (for findAll — uses enriched audit block)
export const TaxProfileListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  tax_rate: decimalFieldRequired,
  is_active: z.boolean().optional(),
  description: z.string().nullable().optional(),
  audit: AuditSchema.optional(),
});

export type TaxProfileListItemResponse = z.infer<typeof TaxProfileListItemResponseSchema>;

// Mutation response schema
export const TaxProfileMutationResponseSchema = z.object({
  id: z.string(),
});

export type TaxProfileMutationResponse = z.infer<typeof TaxProfileMutationResponseSchema>;
