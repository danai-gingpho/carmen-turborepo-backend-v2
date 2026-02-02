import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Import validate functions
import {
  validateProductCategoryIdExists,
  validateProductCategoryIdsExist,
} from '../../validate/product-category.validate';
import { validateTaxProfileIdExists } from '../../validate/tax-profile.validate';

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
