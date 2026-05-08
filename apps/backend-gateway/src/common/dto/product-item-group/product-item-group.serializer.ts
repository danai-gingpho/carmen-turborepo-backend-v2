import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

const dateField = z.coerce.date().nullable();

// Base schema for ProductItemGroup
const ProductItemGroupBaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: dateField,
  created_by_id: z.string().nullable().optional(),
  updated_at: dateField,
  updated_by_id: z.string().nullable().optional(),
  deleted_at: dateField,
  deleted_by_id: z.string().nullable().optional(),
});

// Detail response schema (for findOne)
export const ProductItemGroupDetailResponseSchema = ProductItemGroupBaseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  audit: AuditSchema.optional(),
}).passthrough();

// List item response schema (for findAll)
export const ProductItemGroupListItemResponseSchema = ProductItemGroupBaseSchema.omit({
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
export const ProductItemGroupMutationResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string().optional(),
}).passthrough();
