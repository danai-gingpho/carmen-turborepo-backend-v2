import { z } from 'zod';

// Vendor Business Type response schema (for findOne and list items)
export const VendorBusinessTypeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
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
