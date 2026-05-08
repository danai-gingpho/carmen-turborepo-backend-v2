import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

// Embedded schemas
const DepartmentUserEmbeddedSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  firstname: z.string().nullable().optional(),
  lastname: z.string().nullable().optional(),
  middlename: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
});

// Department base response schema (raw audit columns kept for list source)
export const DepartmentResponseSchema = z.object({
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

export type DepartmentResponse = z.infer<typeof DepartmentResponseSchema>;

// Department detail response schema (for findOne with users — uses enriched audit block)
export const DepartmentDetailResponseSchema = DepartmentResponseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  department_users: z.array(DepartmentUserEmbeddedSchema).optional(),
  hod_users: z.array(DepartmentUserEmbeddedSchema).optional(),
  audit: AuditSchema.optional(),
});

export type DepartmentDetailResponse = z.infer<typeof DepartmentDetailResponseSchema>;

// Department list item response schema (for findAll — uses enriched audit block)
export const DepartmentListItemResponseSchema = DepartmentResponseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  audit: AuditSchema.optional(),
});

export type DepartmentListItemResponse = z.infer<typeof DepartmentListItemResponseSchema>;

// Mutation response schema
export const DepartmentMutationResponseSchema = z.object({
  id: z.string(),
});

export type DepartmentMutationResponse = z.infer<typeof DepartmentMutationResponseSchema>;
