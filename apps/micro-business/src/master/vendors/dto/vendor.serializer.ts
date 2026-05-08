import { z } from 'zod';
import { decimalField } from '@/common/validation/zod-helpers';

// Embedded schemas
const VendorAddressEmbeddedSchema = z.object({
  id: z.string(),
  address_type: z.string().nullable().optional(),
  address_line1: z.string().nullable().optional(),
  address_line2: z.string().nullable().optional(),
  sub_district: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

const VendorContactEmbeddedSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  is_primary: z.boolean().optional(),
  description: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
});

// Vendor detail response schema (for findOne)
export const VendorDetailResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  business_type: z.any().nullable().optional(),
  tax_profile_id: z.string().nullable().optional(),
  tax_profile_name: z.string().nullable().optional(),
  tax_rate: decimalField,
  is_active: z.boolean().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  vendor_address: z.array(VendorAddressEmbeddedSchema).optional(),
  vendor_contact: z.array(VendorContactEmbeddedSchema).optional(),
});

export type VendorDetailResponse = z.infer<typeof VendorDetailResponseSchema>;

// Vendor list item response schema (for findAll)
export const VendorListItemResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  business_type: z.any().nullable().optional(),
  tax_profile_id: z.string().nullable().optional(),
  tax_profile_name: z.string().nullable().optional(),
  tax_rate: decimalField,
  is_active: z.boolean().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
  tb_vendor_contact: z.array(VendorContactEmbeddedSchema).optional(),
}).transform(({ tb_vendor_contact, ...rest }) => ({
  ...rest,
  contacts: tb_vendor_contact,
}));

export type VendorListItemResponse = z.infer<typeof VendorListItemResponseSchema>;

// Mutation response schema
export const VendorMutationResponseSchema = z.object({
  id: z.string(),
});

export type VendorMutationResponse = z.infer<typeof VendorMutationResponseSchema>;
