import { z } from 'zod';

const PriceListDetailEmbeddedSchema = z.object({
  id: z.string(),
  sequence_no: z.number().nullable().optional(),
  moq_qty: z.number().nullable().optional(),
  unit_id: z.string().nullable().optional(),
  unit_name: z.string().nullable().optional(),
  lead_time_days: z.number().nullable().optional(),
  price_without_tax: z.number().nullable().optional(),
  tax_amt: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  tax_profile_id: z.string().nullable().optional(),
  tax_profile_name: z.string().nullable().optional(),
  tax_rate: z.number().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  product_local_name: z.string().nullable().optional(),
  product_sku: z.string().nullable().optional(),
});

const VendorEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
}).or(z.object({})).nullable();

const CurrencyEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
}).or(z.object({})).nullable();

// Price list detail response schema (for findOne)
export const PriceListDetailResponseSchema = z.object({
  id: z.string(),
  no: z.string().nullable().optional(),
  name: z.string(),
  status: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  vendor: VendorEmbeddedSchema.optional(),
  currency: CurrencyEmbeddedSchema.optional(),
  effectivePeriod: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  pricelist_detail: z.array(PriceListDetailEmbeddedSchema).optional(),
});

export type PriceListDetailResponse = z.infer<typeof PriceListDetailResponseSchema>;

// Price list item response schema (for findAll)
export const PriceListListItemResponseSchema = z.object({
  id: z.string(),
  no: z.string().nullable().optional(),
  name: z.string(),
  status: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  vendor: VendorEmbeddedSchema.optional(),
  currency: CurrencyEmbeddedSchema.optional(),
  effectivePeriod: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  pricelist_detail: z.array(PriceListDetailEmbeddedSchema).optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
});

export type PriceListListItemResponse = z.infer<typeof PriceListListItemResponseSchema>;

// Mutation response schema
export const PriceListMutationResponseSchema = z.object({
  id: z.string(),
});

export type PriceListMutationResponse = z.infer<typeof PriceListMutationResponseSchema>;
