import { z } from 'zod';

// Embedded schemas
const DepartmentUserEmbeddedSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  firstname: z.string().nullable().optional(),
  lastname: z.string().nullable().optional(),
  middlename: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
});

// Department detail response schema (for findOne with users)
export const DepartmentDetailResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  department_users: z.array(DepartmentUserEmbeddedSchema).optional(),
  hod_users: z.array(DepartmentUserEmbeddedSchema).optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type DepartmentDetailResponse = z.infer<typeof DepartmentDetailResponseSchema>;

// Department list item response schema (for findAll)
// Includes raw audit columns so the gateway audit-user enrichment interceptor
// can build the {created,updated,deleted}.{at,id,name} block for each item.
export const DepartmentListItemResponseSchema = z.object({
  id: z.string(),
  code: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
});

export type DepartmentListItemResponse = z.infer<typeof DepartmentListItemResponseSchema>;

// Mutation response schema
export const DepartmentMutationResponseSchema = z.object({
  id: z.string(),
});

export type DepartmentMutationResponse = z.infer<typeof DepartmentMutationResponseSchema>;
