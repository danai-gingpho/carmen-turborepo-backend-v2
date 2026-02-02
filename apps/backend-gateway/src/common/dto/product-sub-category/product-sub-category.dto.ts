import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

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
