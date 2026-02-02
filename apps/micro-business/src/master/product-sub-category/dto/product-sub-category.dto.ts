import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

// Import validate functions
import {
  validateProductSubCategoryIdExists,
  validateProductSubCategoryIdsExist,
} from '@/common/validate/product-sub-category.validate';
import { validateProductCategoryIdExists } from '@/common/validate/product-category.validate';
import { validateTaxProfileIdExists } from '@/common/validate/tax-profile.validate';

// Re-export validate functions for use with ProductSubCategory
export {
  validateProductSubCategoryIdExists,
  validateProductSubCategoryIdsExist,
};

export const ProductSubCategoryCreate = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price_deviation_limit: z.number().optional(),
  qty_deviation_limit: z.number().optional(),
  is_used_in_recipe: z.boolean().default(true).optional(),
  is_sold_directly: z.boolean().default(false).optional(),
  is_active: z.boolean().default(true).optional(),
  product_category_id: z.string().uuid(),
  tax_profile_id: z.string().optional(),
  tax_profile_name: z.string().optional(),
  tax_profile_rate: z.number().optional(),
});

export type ICreateProductSubCategory = z.infer<typeof ProductSubCategoryCreate>;
export class ProductSubCategoryCreateDto extends createZodDto(ProductSubCategoryCreate) {}

export const ProductSubCategoryUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  price_deviation_limit: z.number().optional(),
  qty_deviation_limit: z.number().optional(),
  is_used_in_recipe: z.boolean().optional(),
  is_sold_directly: z.boolean().optional(),
  is_active: z.boolean().optional(),
  product_category_id: z.string().uuid().optional(),
  tax_profile_id: z.string().optional(),
  tax_profile_name: z.string().optional(),
  tax_profile_rate: z.number().optional(),
});

export type IUpdateProductSubCategory = z.infer<typeof ProductSubCategoryUpdate> & { id: string };
export class ProductSubCategoryUpdateDto extends createZodDto(ProductSubCategoryUpdate) {}

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create ProductSubCategoryCreate schema with async database validation
 */
export function createProductSubCategoryCreateValidation(prisma: PrismaClient) {
  return ProductSubCategoryCreate.superRefine(async (data, ctx) => {
    // Validate product_category_id
    if (data.product_category_id) {
      const category = await validateProductCategoryIdExists(prisma, data.product_category_id);
      if (!category) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product category not found',
          path: ['product_category_id'],
        });
      }
    }

    // Validate tax_profile_id
    if (data.tax_profile_id) {
      const taxProfile = await validateTaxProfileIdExists(prisma, data.tax_profile_id);
      if (!taxProfile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tax profile not found',
          path: ['tax_profile_id'],
        });
      }
    }
  });
}

/**
 * Create ProductSubCategoryUpdate schema with async database validation
 */
export function createProductSubCategoryUpdateValidation(prisma: PrismaClient) {
  return ProductSubCategoryUpdate.superRefine(async (data, ctx) => {
    // Validate product_category_id
    if (data.product_category_id) {
      const category = await validateProductCategoryIdExists(prisma, data.product_category_id);
      if (!category) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product category not found',
          path: ['product_category_id'],
        });
      }
    }

    // Validate tax_profile_id
    if (data.tax_profile_id) {
      const taxProfile = await validateTaxProfileIdExists(prisma, data.tax_profile_id);
      if (!taxProfile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tax profile not found',
          path: ['tax_profile_id'],
        });
      }
    }
  });
}
