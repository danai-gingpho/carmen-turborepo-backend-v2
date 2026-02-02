import { z } from 'zod';

// Embedded schema for currency
const CurrencyEmbeddedSchema = z.object({
  id: z.string(),
  code: z.string(),
}).or(z.object({})).nullable().optional();

// Embedded schema for default order unit
const DefaultOrderUnitSchema = z.object({
  unit_id: z.string().nullable().optional(),
  unit_name: z.string().nullable().optional(),
}).nullable().optional();

// Embedded schema for product in template
const PriceListTemplateProductSchema = z.object({
  id: z.string(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  code: z.string().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  default_order: DefaultOrderUnitSchema,
  moq: z.any().nullable().optional(),
});

// Price List Template detail response schema (for findOne)
export const PriceListTemplateDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  validity_period: z.number().nullable().optional(),
  vendor_instructions: z.string().nullable().optional(),
  currency: CurrencyEmbeddedSchema,
  products: z.array(PriceListTemplateProductSchema).optional(),
  created_at: z.coerce.date().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
});

export type PriceListTemplateDetailResponse = z.infer<typeof PriceListTemplateDetailResponseSchema>;

// Price List Template list item response schema (for findAll)
export const PriceListTemplateListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  validity_period: z.number().nullable().optional(),
  vendor_instructions: z.string().nullable().optional(),
  currency: CurrencyEmbeddedSchema,
  products: z.array(PriceListTemplateProductSchema).optional(),
  created_at: z.coerce.date().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
});

export type PriceListTemplateListItemResponse = z.infer<typeof PriceListTemplateListItemResponseSchema>;

// Mutation response schema
export const PriceListTemplateMutationResponseSchema = z.object({
  id: z.string(),
});

export type PriceListTemplateMutationResponse = z.infer<typeof PriceListTemplateMutationResponseSchema>;

// Status update response schema
export const PriceListTemplateStatusResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export type PriceListTemplateStatusResponse = z.infer<typeof PriceListTemplateStatusResponseSchema>;
