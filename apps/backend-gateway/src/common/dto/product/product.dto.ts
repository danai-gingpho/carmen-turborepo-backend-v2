import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_data_type, enum_product_status_type } from '@repo/prisma-shared-schema-tenant';

export const ProductCreate = z.object({
  name: z.string(),
  code: z.string(),
  local_name: z.string().optional(),
  description: z.string().optional(),
  inventory_unit_id: z.string(),
  product_status_type: z.nativeEnum(
    enum_product_status_type
  ),
  product_item_group_id: z.string().optional(),
  product_info: z
    .object({
      is_used_in_recipe: z.boolean().default(true).optional(),
      is_sold_directly: z.boolean().default(false).optional(),
      barcode: z.string().optional(),
      sku: z.string().optional(),
      price_deviation_limit: z.number().optional(),
      qty_deviation_limit: z.number().optional(),
      tax_profile_id: z.string().optional(),
      tax_profile_name: z.string().optional(),
      tax_rate: z.number().optional(),
      info: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
            data_type: z
              .nativeEnum(enum_data_type)
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  locations: z
    .object({
      add: z.array(z.object({
        location_id: z.string(),
        min_qty: z.number().nullable().optional(),
        max_qty: z.number().nullable().optional(),
        re_order_qty: z.number().nullable().optional(),
        par_qty: z.number().nullable().optional(),
      })).optional(),
    })
    .optional(),
  order_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  ingredient_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type ICreateProduct = z.infer<typeof ProductCreate>;
export class ProductCreateDto extends createZodDto(ProductCreate) { }

export const ProductUpdate = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  local_name: z.string().optional(),
  description: z.string().optional(),
  inventory_unit_id: z.string().optional(),
  product_status_type: z
    .nativeEnum(enum_product_status_type)
    .optional(),
  product_item_group_id: z.string().optional(),
  product_info: z
    .object({
      is_used_in_recipe: z.boolean().optional(),
      is_sold_directly: z.boolean().optional(),
      barcode: z.string().nullable().optional(),
      sku: z.string().nullable().optional(),
      price: z.number().nullable().optional(),
      price_deviation_limit: z.number().nullable().optional(),
      qty_deviation_limit: z.number().nullable().optional(),
      tax_profile_id: z.string().nullable().optional(),
      tax_profile_name: z.string().nullable().optional(),
      tax_profile_rate: z.number().nullable().optional(),
      info: z
        .array(
          z.object({
            label: z.string().optional(),
            value: z.string().optional(),
            data_type: z
              .nativeEnum(enum_data_type)
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  locations: z
    .object({
      add: z.array(z.object({
        location_id: z.string(),
        min_qty: z.number().nullable().optional(),
        max_qty: z.number().nullable().optional(),
        re_order_qty: z.number().nullable().optional(),
        par_qty: z.number().nullable().optional(),
      })).optional(),
      update: z.array(z.object({
        location_id: z.string(),
        min_qty: z.number().nullable().optional(),
        max_qty: z.number().nullable().optional(),
        re_order_qty: z.number().nullable().optional(),
        par_qty: z.number().nullable().optional(),
      })).optional(),
      remove: z.array(z.object({ location_id: z.string() })).optional(),
    })
    .nullable()
    .optional(),
  order_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
          }),
        )
        .optional(),
      update: z
        .array(
          z.object({
            product_order_unit_id: z.string(),
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().optional(),
            is_active: z.boolean().optional(),
          }),
        )
        .optional(),
      remove: z
        .array(z.object({ product_order_unit_id: z.string() }))
        .optional(),
    })
    .optional(),

  ingredient_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
          }),
        )
        .optional(),
      update: z
        .array(
          z.object({
            product_ingredient_unit_id: z.string(),
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_active: z.boolean().optional(),
            is_default: z.boolean().optional(),
          }),
        )
        .optional(),
      remove: z
        .array(z.object({ product_ingredient_unit_id: z.string() }))
        .optional(),
    })
    .optional(),
});

export type IUpdateProduct = z.infer<typeof ProductUpdate> & { id: string };
export class ProductUpdateDto extends createZodDto(ProductUpdate) { }

export const ProductCostRequest = z.object({
  product_id: z.string().uuid(),
  location_id: z.string().uuid(),
  quantity: z.number().positive(),
});

export type IProductCostRequest = z.infer<typeof ProductCostRequest>;
export class ProductCostRequestDto extends createZodDto(ProductCostRequest) { }
