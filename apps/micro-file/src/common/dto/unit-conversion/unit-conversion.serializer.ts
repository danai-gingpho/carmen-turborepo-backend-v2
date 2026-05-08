import { z } from 'zod';

// Unit conversion item response schema (for getOrderUnitByProductId, getIngredientUnitByProductId, getAvailableUnitByProductId)
export const UnitConversionItemResponseSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  conversion: z.number(),
});

export type UnitConversionItemResponse = z.infer<typeof UnitConversionItemResponseSchema>;

// Unit conversion list response schema
export const UnitConversionListResponseSchema = z.array(UnitConversionItemResponseSchema);

export type UnitConversionListResponse = z.infer<typeof UnitConversionListResponseSchema>;

// Full unit conversion response schema (for detailed unit conversion data)
export const UnitConversionDetailResponseSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  from_unit_id: z.string(),
  from_unit_name: z.string().nullable().optional(),
  from_unit_qty: z.number(),
  to_unit_id: z.string(),
  to_unit_name: z.string().nullable().optional(),
  to_unit_qty: z.number(),
  unit_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type UnitConversionDetailResponse = z.infer<typeof UnitConversionDetailResponseSchema>;

// Mutation response schema
export const UnitConversionMutationResponseSchema = z.object({
  id: z.string(),
});

export type UnitConversionMutationResponse = z.infer<typeof UnitConversionMutationResponseSchema>;
