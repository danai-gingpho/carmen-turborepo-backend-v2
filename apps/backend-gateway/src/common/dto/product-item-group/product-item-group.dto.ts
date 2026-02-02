import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

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
