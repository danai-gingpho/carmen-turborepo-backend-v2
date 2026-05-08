import { z } from 'zod';

// Vendor Business Type response schema (for findOne and list items)
export const VendorBusinessTypeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type VendorBusinessTypeResponse = z.infer<typeof VendorBusinessTypeResponseSchema>;

// Vendor Business Type list item response schema (same as VendorBusinessTypeResponseSchema for this entity)
export const VendorBusinessTypeListItemResponseSchema = VendorBusinessTypeResponseSchema;

export type VendorBusinessTypeListItemResponse = z.infer<typeof VendorBusinessTypeListItemResponseSchema>;

// Mutation response schema
export const VendorBusinessTypeMutationResponseSchema = z.object({
  id: z.string(),
});

export type VendorBusinessTypeMutationResponse = z.infer<typeof VendorBusinessTypeMutationResponseSchema>;
