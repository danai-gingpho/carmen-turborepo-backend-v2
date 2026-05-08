import { z } from 'zod';

// Business unit response schema (for findOne and list items)
export const BusinessUnitResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  alias_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  max_license_users: z.number().nullable().optional(),
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

// Audit user schema (for created_by / updated_by)
const AuditUserSchema = z.object({
  username: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
}).nullable().optional();

// Business unit list item response schema
export const BusinessUnitListItemResponseSchema = z.object({
  id: z.string(),
  cluster_id: z.string().nullable().optional(),
  code: z.string(),
  name: z.string(),
  alias_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  max_license_users: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  tb_user_tb_business_unit_created_by_idTotb_user: AuditUserSchema,
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  tb_user_tb_business_unit_updated_by_idTotb_user: AuditUserSchema,
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
  tb_cluster: z.object({
    name: z.string().nullable().optional(),
  }).nullable().optional(),
}).transform((item) => ({
  ...item,
  cluster_name: item.tb_cluster?.name ?? null,
  created_by_name: item.tb_user_tb_business_unit_created_by_idTotb_user?.username
    ?? item.tb_user_tb_business_unit_created_by_idTotb_user?.email
    ?? null,
  updated_by_name: item.tb_user_tb_business_unit_updated_by_idTotb_user?.username
    ?? item.tb_user_tb_business_unit_updated_by_idTotb_user?.email
    ?? null,
  tb_cluster: undefined,
  tb_user_tb_business_unit_created_by_idTotb_user: undefined,
  tb_user_tb_business_unit_updated_by_idTotb_user: undefined,
}));

export type BusinessUnitListItemResponse = z.infer<typeof BusinessUnitListItemResponseSchema>;

// Mutation response schema
export const BusinessUnitMutationResponseSchema = z.object({
  id: z.string(),
});

export type BusinessUnitMutationResponse = z.infer<typeof BusinessUnitMutationResponseSchema>;
