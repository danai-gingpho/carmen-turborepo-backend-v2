import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

// Application role detail response schema (for findOne with audit enrichment)
export const ApplicationRoleDetailResponseSchema = z.object({
  id: z.string(),
  application_role_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  permissions: z.array(z.any()).nullable().optional(),
  doc_version: z.number().nullable().optional(),
  audit: AuditSchema.optional(),
});

export type ApplicationRoleDetailResponse = z.infer<typeof ApplicationRoleDetailResponseSchema>;

// Application role list item response schema (for findAll)
export const ApplicationRoleListItemResponseSchema = z.object({
  id: z.string(),
  business_unit_id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  permissions: z.array(z.any()).nullable().optional(),
  audit: AuditSchema.optional(),
});

export type ApplicationRoleListItemResponse = z.infer<typeof ApplicationRoleListItemResponseSchema>;

// Mutation response schema
export const ApplicationRoleMutationResponseSchema = z.object({
  id: z.string(),
});

export type ApplicationRoleMutationResponse = z.infer<typeof ApplicationRoleMutationResponseSchema>;
