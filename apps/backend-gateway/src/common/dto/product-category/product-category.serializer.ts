import { z } from 'zod';

const dateField = z.coerce.date().nullable();

// Base schema for ProductCategory
const ProductCategoryBaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: dateField,
  updated_at: dateField,
  created_by: z.string().nullable().optional(),
  updated_by: z.string().nullable().optional(),
});

// Detail response schema (for findOne)
export const ProductCategoryDetailResponseSchema = ProductCategoryBaseSchema.extend({
  sub_categories: z.array(z.any()).nullable().optional(),
}).passthrough();

// List item response schema (for findAll)
export const ProductCategoryListItemResponseSchema = ProductCategoryBaseSchema.passthrough();

// Mutation response schema (for create, update, delete)
export const ProductCategoryMutationResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string().optional(),
}).passthrough();
