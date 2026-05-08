import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

// Import validate functions
import {
  validateProductItemGroupIdExists,
  validateProductItemGroupIdsExist,
} from '../../validate/product-item-group.validate';
import { validateProductSubCategoryIdExists } from '../../validate/product-sub-category.validate';
import { validateTaxProfileIdExists } from '../../validate/tax-profile.validate';

// Re-export validate functions for use with ProductItemGroup
export {
  validateProductItemGroupIdExists,
  validateProductItemGroupIdsExist,
};

export const ProductItemGroupCreate = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  price_deviation_limit: z.number().optional(),
  qty_deviation_limit: z.number().optional(),
  is_used_in_recipe: z.boolean().default(true).optional(),
  is_used_in_purchase_order: z.boolean().default(false).optional(),
  is_active: z.boolean().default(true).optional(),
  product_subcategory_id: z.string(),
  tax_profile_id: z.string().optional(),
  tax_profile_name: z.string().optional(),
  tax_profile_rate: z.number().optional(),
});

export type ICreateProductItemGroup = z.infer<typeof ProductItemGroupCreate>;
export class ProductItemGroupCreateDto extends createZodDto(ProductItemGroupCreate) {}

export const ProductItemGroupUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  price_deviation_limit: z.number().optional(),
  qty_deviation_limit: z.number().optional(),
  is_used_in_recipe: z.boolean().optional(),
  is_used_in_purchase_order: z.boolean().optional(),
  is_active: z.boolean().optional(),
  product_subcategory_id: z.string().optional(),
  tax_profile_id: z.string().optional(),
  tax_profile_name: z.string().optional(),
  tax_profile_rate: z.number().optional(),
});

export type IUpdateProductItemGroup = z.infer<typeof ProductItemGroupUpdate> & { id: string };
export class ProductItemGroupUpdateDto extends createZodDto(ProductItemGroupUpdate) {}

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create ProductItemGroupCreate schema with async database validation
 */
export function createProductItemGroupCreateValidation(prisma: PrismaClient) {
  return ProductItemGroupCreate.superRefine(async (data, ctx) => {
    // Validate product_subcategory_id
    if (data.product_subcategory_id) {
      const subCategory = await validateProductSubCategoryIdExists(prisma, data.product_subcategory_id);
      if (!subCategory) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product sub-category not found',
          path: ['product_subcategory_id'],
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
 * Create ProductItemGroupUpdate schema with async database validation
 */
export function createProductItemGroupUpdateValidation(prisma: PrismaClient) {
  return ProductItemGroupUpdate.superRefine(async (data, ctx) => {
    // Validate product_subcategory_id
    if (data.product_subcategory_id) {
      const subCategory = await validateProductSubCategoryIdExists(prisma, data.product_subcategory_id);
      if (!subCategory) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product sub-category not found',
          path: ['product_subcategory_id'],
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
