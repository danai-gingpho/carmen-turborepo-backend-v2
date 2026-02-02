import { z } from 'zod';

// Embedded schema for currency
const CurrencyEmbeddedSchema = z.object({
  id: z.string(),
  code: z.string(),
}).or(z.object({})).nullable().optional();

// Embedded schema for pricelist template in list
const PricelistTemplateEmbeddedSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().nullable().optional(),
  currency: CurrencyEmbeddedSchema,
}).nullable().optional();

// Embedded schema for pricelist template product
const PricelistTemplateProductSchema = z.object({
  id: z.string(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  moq: z.any().nullable().optional(),
});

// Embedded schema for pricelist template detail (for findOne)
const PricelistTemplateDetailEmbeddedSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string().nullable().optional(),
  validity_period: z.number().nullable().optional(),
  vendor_instructions: z.string().nullable().optional(),
  currency: CurrencyEmbeddedSchema,
  products: z.array(PricelistTemplateProductSchema).optional(),
}).nullable().optional();

// Embedded schema for pricelist in vendor detail
const PricelistEmbeddedSchema = z.object({
  id: z.string(),
  no: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
}).nullable().optional();

// Embedded schema for vendor in list
const VendorInListSchema = z.object({
  id: z.string(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  vendor_code: z.string().nullable().optional(),
  has_submitted: z.boolean().optional(),
});

// Embedded schema for vendor detail (for findOne)
const VendorDetailSchema = z.object({
  id: z.string(),
  sequence_no: z.number().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  vendor_code: z.string().nullable().optional(),
  contact_person: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  url_token: z.string().nullable().optional(),
  pricelist: PricelistEmbeddedSchema,
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),
});

// Request for Pricing detail response schema (for findOne)
export const RequestForPricingDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  start_date: z.coerce.date().nullable().optional(),
  end_date: z.coerce.date().nullable().optional(),
  custom_message: z.string().nullable().optional(),
  email_template_id: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  pricelist_template: PricelistTemplateDetailEmbeddedSchema,
  vendors: z.array(VendorDetailSchema).optional(),
});

export type RequestForPricingDetailResponse = z.infer<typeof RequestForPricingDetailResponseSchema>;

// Request for Pricing list item response schema (for findAll)
export const RequestForPricingListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  custom_message: z.string().nullable().optional(),
  email_template_id: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  pricelist_template: PricelistTemplateEmbeddedSchema,
  vendor_count: z.number().optional(),
  vendors: z.array(VendorInListSchema).optional(),
});

export type RequestForPricingListItemResponse = z.infer<typeof RequestForPricingListItemResponseSchema>;

// Create response schema
export const RequestForPricingCreateResponseSchema = z.object({
  id: z.string(),
  vendor_tokens: z.array(z.object({
    vendor_id: z.string(),
    rfp_detail_id: z.string(),
    password: z.string(),
    token: z.string(),
    url_token: z.string(),
  })).optional(),
});

export type RequestForPricingCreateResponse = z.infer<typeof RequestForPricingCreateResponseSchema>;

// Mutation response schema
export const RequestForPricingMutationResponseSchema = z.object({
  id: z.string(),
});

export type RequestForPricingMutationResponse = z.infer<typeof RequestForPricingMutationResponseSchema>;
