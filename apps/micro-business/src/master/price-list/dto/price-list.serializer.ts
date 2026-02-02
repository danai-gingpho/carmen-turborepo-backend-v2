import { z } from 'zod';

// Embedded schemas
const TaxProfileEmbeddedSchema = z.object({
  id: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  rate: z.number().nullable().optional(),
}).or(z.object({}));

const PriceListDetailEmbeddedSchema = z.object({
  id: z.string(),
  sequence_no: z.number().nullable().optional(),
  moq_qty: z.number().nullable().optional(),
  unit_id: z.string().nullable().optional(),
  unit_name: z.string().nullable().optional(),
  lead_time_days: z.number().nullable().optional(),
  price_wirhout_tax: z.number().nullable().optional(),
  tax_amt: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  tax_profile_id: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  tax_profile: TaxProfileEmbeddedSchema.optional(),
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
});

export type PriceListListItemResponse = z.infer<typeof PriceListListItemResponseSchema>;

// Mutation response schema
export const PriceListMutationResponseSchema = z.object({
  id: z.string(),
});

export type PriceListMutationResponse = z.infer<typeof PriceListMutationResponseSchema>;
