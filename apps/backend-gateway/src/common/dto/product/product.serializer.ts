import { z } from 'zod';

const decimalField = z.number().or(z.string()).pipe(z.coerce.number()).nullable().optional();
const decimalFieldRequired = z.number().or(z.string()).pipe(z.coerce.number());

// Embedded schemas for nested objects
const UnitEmbeddedSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
});

const ProductLocationEmbeddedSchema = z.object({
  id: z.string(),
  location_id: z.string(),
  location_name: z.string().nullable().optional(),
});

const UnitConversionEmbeddedSchema = z.object({
  id: z.string(),
  from_unit_id: z.string(),
  from_unit_name: z.string().nullable().optional(),
  from_unit_qty: decimalFieldRequired,
  to_unit_id: z.string(),
  to_unit_name: z.string().nullable().optional(),
  to_unit_qty: decimalFieldRequired,
  unit_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

const ProductItemGroupEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
}).or(z.object({}));

const ProductSubCategoryEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
}).or(z.object({}));

const ProductCategoryEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
}).or(z.object({}));

const ProductInfoAttributeSchema = z.object({
  label: z.string(),
  value: z.string(),
  data_type: z.string().optional(),
});

// Product detail response schema (for findOne)
export const ProductDetailResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  barcode: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  name: z.string(),
  local_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  product_status_type: z.string(),
  inventory_unit: UnitEmbeddedSchema,
  is_sold_directly: z.boolean().nullable().optional(),
  is_used_in_recipe: z.boolean().nullable().optional(),
  price_deviation_limit: decimalField,
  qty_deviation_limit: decimalField,
  tax_profile_id: z.string().nullable().optional(),
  tax_profile_name: z.string().nullable().optional(),
  tax_rate: decimalField,
  info: z.array(ProductInfoAttributeSchema).optional(),
  product_item_group: ProductItemGroupEmbeddedSchema.optional(),
  locations: z.array(ProductLocationEmbeddedSchema).optional(),
  order_units: z.array(UnitConversionEmbeddedSchema).optional(),
  ingredient_units: z.array(UnitConversionEmbeddedSchema).optional(),
  product_sub_category: ProductSubCategoryEmbeddedSchema.optional(),
  product_category: ProductCategoryEmbeddedSchema.optional(),
});

export type ProductDetailResponse = z.infer<typeof ProductDetailResponseSchema>;

// Product list item response schema (for findAll)
export const ProductListItemResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  local_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  product_status_type: z.string(),
  inventory_unit_id: z.string().nullable().optional(),
  inventory_unit_name: z.string().nullable().optional(),
  product_item_group: ProductItemGroupEmbeddedSchema.optional(),
  product_sub_category: ProductSubCategoryEmbeddedSchema.optional(),
  product_category: ProductCategoryEmbeddedSchema.optional(),
});

export type ProductListItemResponse = z.infer<typeof ProductListItemResponseSchema>;

// Product location list item response schema (for getByLocationId)
export const ProductLocationListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  inventory_unit: UnitEmbeddedSchema,
});

export type ProductLocationListItemResponse = z.infer<typeof ProductLocationListItemResponseSchema>;

// Product item group response schema (for findItemGroup)
export const ProductItemGroupResponseSchema = z.object({
  product_item_group: ProductItemGroupEmbeddedSchema,
  product_subcategory: ProductSubCategoryEmbeddedSchema,
  product_category: ProductCategoryEmbeddedSchema,
});

export type ProductItemGroupResponse = z.infer<typeof ProductItemGroupResponseSchema>;

// Create/Update response schema
export const ProductMutationResponseSchema = z.object({
  id: z.string(),
});

export type ProductMutationResponse = z.infer<typeof ProductMutationResponseSchema>;
