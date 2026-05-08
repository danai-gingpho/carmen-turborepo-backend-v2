import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

// Business unit response schema (for list items)
export const BusinessUnitResponseSchema = z.object({
  id: z.string(),
  cluster_id: z.string().nullable().optional(),
  code: z.string(),
  name: z.string(),
  alias_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  is_hq: z.boolean().nullable().optional(),
  is_active: z.boolean().optional(),
  db_connection: z.any().nullable().optional(),
  config: z.any().nullable().optional(),
  default_currency_id: z.string().nullable().optional(),
  calculation_method: z.string().nullable().optional(),
  max_license_users: z.number().nullable().optional(),

  // Company info
  branch_no: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),
  company_address: z.string().nullable().optional(),
  company_email: z.string().nullable().optional(),
  company_tel: z.string().nullable().optional(),
  company_zip_code: z.string().nullable().optional(),
  tax_no: z.string().nullable().optional(),

  // Hotel info
  hotel_name: z.string().nullable().optional(),
  hotel_address: z.string().nullable().optional(),
  hotel_email: z.string().nullable().optional(),
  hotel_tel: z.string().nullable().optional(),
  hotel_zip_code: z.string().nullable().optional(),

  // Format settings
  date_format: z.string().nullable().optional(),
  date_time_format: z.string().nullable().optional(),
  time_format: z.string().nullable().optional(),
  short_time_format: z.string().nullable().optional(),
  long_time_format: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  amount_format: z.any().nullable().optional(),
  quantity_format: z.any().nullable().optional(),
  perpage_format: z.any().nullable().optional(),
  recipe_format: z.any().nullable().optional(),

  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type BusinessUnitResponse = z.infer<typeof BusinessUnitResponseSchema>;

// Business unit detail response schema (for findOne — audit enriched)
export const BusinessUnitDetailResponseSchema = BusinessUnitResponseSchema.omit({
  created_at: true,
  updated_at: true,
}).extend({
  audit: AuditSchema.optional(),
});

export type BusinessUnitDetailResponse = z.infer<typeof BusinessUnitDetailResponseSchema>;

// Business unit list item response schema (audit-enriched)
export const BusinessUnitListItemResponseSchema = BusinessUnitResponseSchema.omit({
  created_at: true,
  updated_at: true,
}).extend({
  audit: AuditSchema.optional(),
});

export type BusinessUnitListItemResponse = z.infer<typeof BusinessUnitListItemResponseSchema>;

// Mutation response schema
export const BusinessUnitMutationResponseSchema = z.object({
  id: z.string(),
});

export type BusinessUnitMutationResponse = z.infer<typeof BusinessUnitMutationResponseSchema>;
