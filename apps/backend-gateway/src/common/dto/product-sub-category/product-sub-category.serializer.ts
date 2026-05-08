import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

const dateField = z.coerce.date().nullable();

// Base schema for ProductSubCategory
const ProductSubCategoryBaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: dateField,
  created_by_id: z.string().nullable().optional(),
  updated_at: dateField,
  updated_by_id: z.string().nullable().optional(),
  deleted_at: dateField,
  deleted_by_id: z.string().nullable().optional(),
});

// Detail response schema (for findOne)
export const ProductSubCategoryDetailResponseSchema = ProductSubCategoryBaseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  category: z.any().nullable().optional(),
  audit: AuditSchema.optional(),
}).passthrough();

// List item response schema (for findAll)
export const ProductSubCategoryListItemResponseSchema = ProductSubCategoryBaseSchema.omit({
  created_at: true,
  created_by_id: true,
  updated_at: true,
  updated_by_id: true,
  deleted_at: true,
  deleted_by_id: true,
}).extend({
  category: z.any().nullable().optional(),
  audit: AuditSchema.optional(),
}).passthrough();

// Mutation response schema (for create, update, delete)
export const ProductSubCategoryMutationResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string().optional(),
}).passthrough();
