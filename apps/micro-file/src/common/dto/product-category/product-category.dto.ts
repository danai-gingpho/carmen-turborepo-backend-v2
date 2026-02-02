import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

// Import validate functions
import {
  validateProductCategoryIdExists,
  validateProductCategoryIdsExist,
} from '../../validate/product-category.validate';
import { validateTaxProfileIdExists } from '../../validate/tax-profile.validate';

// Re-export validate functions for use with ProductCategory
export {
  validateProductCategoryIdExists,
  validateProductCategoryIdsExist,
};

export const ProductCategoryCreate = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true).optional(),
  price_deviation_limit: z.number().optional(),
  qty_deviation_limit: z.number().optional(),
  is_used_in_recipe: z.boolean().default(true).optional(),
  is_sold_directly: z.boolean().default(false).optional(),
  tax_profile_id: z.string().optional(),
  tax_profile_name: z.string().optional(),
  tax_profile_rate: z.number().optional(),
});

export type ICreateProductCategory = z.infer<typeof ProductCategoryCreate>;
export class ProductCategoryCreateDto extends createZodDto(ProductCategoryCreate) {}

export const ProductCategoryUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  price_deviation_limit: z.number().optional(),
  qty_deviation_limit: z.number().optional(),
  is_used_in_recipe: z.boolean().optional(),
  is_sold_directly: z.boolean().optional(),
  tax_profile_id: z.string().optional(),
  tax_profile_name: z.string().optional(),
  tax_profile_rate: z.number().optional(),
});

export type IUpdateProductCategory = z.infer<typeof ProductCategoryUpdate> & { id: string };
export class ProductCategoryUpdateDto extends createZodDto(ProductCategoryUpdate) {}

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create ProductCategoryCreate schema with async database validation
 */
export function createProductCategoryCreateValidation(prisma: PrismaClient) {
  return ProductCategoryCreate.superRefine(async (data, ctx) => {
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
 * Create ProductCategoryUpdate schema with async database validation
 */
export function createProductCategoryUpdateValidation(prisma: PrismaClient) {
  return ProductCategoryUpdate.superRefine(async (data, ctx) => {
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
