import { z } from 'zod';
import { dateField } from '../../common/validation/zod-helpers';

// Base schema for ProductSubCategory
const ProductSubCategoryBaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: dateField,
  updated_at: dateField,
  created_by: z.string().nullable().optional(),
  updated_by: z.string().nullable().optional(),
});

// Detail response schema (for findOne)
export const ProductSubCategoryDetailResponseSchema = ProductSubCategoryBaseSchema.extend({
  category: z.any().nullable().optional(),
}).passthrough();

// List item response schema (for findAll)
export const ProductSubCategoryListItemResponseSchema = ProductSubCategoryBaseSchema.passthrough();

// Mutation response schema (for create, update, delete)
export const ProductSubCategoryMutationResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string().optional(),
}).passthrough();
