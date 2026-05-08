import { z } from 'zod';

// Embedded schemas
const DeliveryPointEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  is_active: z.boolean().optional(),
}).or(z.object({}));

const UserLocationEmbeddedSchema = z.object({
  id: z.string(),
  firstname: z.string().nullable().optional(),
  lastname: z.string().nullable().optional(),
  middlename: z.string().nullable().optional(),
  telephone: z.string().nullable().optional(),
});

const ProductLocationEmbeddedSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  min_qty: z.number().nullable().optional(),
  max_qty: z.number().nullable().optional(),
  re_order_qty: z.number().nullable().optional(),
  par_qty: z.number().nullable().optional(),
});

// Location detail response schema (for findOne)
export const LocationDetailResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  location_type: z.string(),
  physical_count_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  user_location: z.array(UserLocationEmbeddedSchema).optional(),
  product_location: z.array(ProductLocationEmbeddedSchema).optional(),
  delivery_point: DeliveryPointEmbeddedSchema.optional(),
});

export type LocationDetailResponse = z.infer<typeof LocationDetailResponseSchema>;

// Location list item response schema (for findAll)
export const LocationListItemResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  location_type: z.string(),
  physical_count_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  delivery_point: DeliveryPointEmbeddedSchema.optional(),
});

export type LocationListItemResponse = z.infer<typeof LocationListItemResponseSchema>;

// Location by user response schema (for findAllByUser)
export const LocationByUserResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  location_type: z.string(),
  physical_count_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export type LocationByUserResponse = z.infer<typeof LocationByUserResponseSchema>;

// Product inventory info response schema
export const ProductInventoryInfoResponseSchema = z.object({
  on_hand_qty: z.number(),
  on_order_qty: z.number(),
  re_order_qty: z.number(),
  re_stock_qty: z.number(),
});

export type ProductInventoryInfoResponse = z.infer<typeof ProductInventoryInfoResponseSchema>;

// Mutation response schema
export const LocationMutationResponseSchema = z.object({
  id: z.string(),
});

export type LocationMutationResponse = z.infer<typeof LocationMutationResponseSchema>;
