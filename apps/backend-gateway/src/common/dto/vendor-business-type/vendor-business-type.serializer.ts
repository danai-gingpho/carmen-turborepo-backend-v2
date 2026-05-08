import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

// Vendor Business Type base schema (shared fields)
const VendorBusinessTypeBaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
});

// Vendor Business Type detail response schema (for findOne)
export const VendorBusinessTypeDetailResponseSchema = VendorBusinessTypeBaseSchema.extend({
  audit: AuditSchema.optional(),
});

export type VendorBusinessTypeDetailResponse = z.infer<typeof VendorBusinessTypeDetailResponseSchema>;

// Vendor Business Type list item response schema (for findAll — uses enriched audit block)
export const VendorBusinessTypeListItemResponseSchema = VendorBusinessTypeBaseSchema.extend({
  audit: AuditSchema.optional(),
});

export type VendorBusinessTypeListItemResponse = z.infer<typeof VendorBusinessTypeListItemResponseSchema>;

// Mutation response schema
export const VendorBusinessTypeMutationResponseSchema = z.object({
  id: z.string(),
});

export type VendorBusinessTypeMutationResponse = z.infer<typeof VendorBusinessTypeMutationResponseSchema>;
