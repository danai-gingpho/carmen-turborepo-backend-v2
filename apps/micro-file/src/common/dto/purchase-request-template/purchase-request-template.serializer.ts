import { z } from 'zod';

const PurchaseRequestTemplateDetailItemSchema = z.object({
  id: z.string(),
  purchase_request_template_id: z.string().nullable().optional(),

  // Location
  location_id: z.string().nullable().optional(),
  location_code: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  delivery_point_id: z.string().nullable().optional(),
  delivery_point_name: z.string().nullable().optional(),

  // Product
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_local_name: z.string().nullable().optional(),

  // Inventory Unit
  inventory_unit_id: z.string().nullable().optional(),
  inventory_unit_name: z.string().nullable().optional(),

  description: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),

  // Currency
  currency_id: z.string().nullable().optional(),
  currency_name: z.string().nullable().optional(),
  exchange_rate: z.coerce.number().nullable().optional(),
  exchange_rate_date: z.coerce.date().nullable().optional(),

  // Requested
  requested_qty: z.coerce.number().nullable().optional(),
  requested_unit_id: z.string().nullable().optional(),
  requested_unit_name: z.string().nullable().optional(),
  requested_unit_conversion_factor: z.coerce.number().nullable().optional(),
  requested_base_qty: z.coerce.number().nullable().optional(),

  // FOC
  foc_qty: z.coerce.number().nullable().optional(),
  foc_unit_id: z.string().nullable().optional(),
  foc_unit_name: z.string().nullable().optional(),
  foc_unit_conversion_factor: z.coerce.number().nullable().optional(),
  foc_base_qty: z.coerce.number().nullable().optional(),

  // Tax
  tax_profile_id: z.string().nullable().optional(),
  tax_profile_name: z.string().nullable().optional(),
  tax_rate: z.coerce.number().nullable().optional(),
  tax_amount: z.coerce.number().nullable().optional(),
  base_tax_amount: z.coerce.number().nullable().optional(),
  is_tax_adjustment: z.boolean().nullable().optional(),

  // Discount
  discount_rate: z.coerce.number().nullable().optional(),
  discount_amount: z.coerce.number().nullable().optional(),
  base_discount_amount: z.coerce.number().nullable().optional(),
  is_discount_adjustment: z.boolean().nullable().optional(),

  is_active: z.boolean().nullable().optional(),

  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),

  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
});

export const PurchaseRequestTemplateDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  department_id: z.string().nullable().optional(),
  department_name: z.string().nullable().optional(),
  workflow_id: z.string().nullable().optional(),
  workflow_name: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  purchase_request_template_detail: z.array(PurchaseRequestTemplateDetailItemSchema).nullable().optional(),
});

export const PurchaseRequestTemplateListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  department_id: z.string().nullable().optional(),
  department_name: z.string().nullable().optional(),
  workflow_id: z.string().nullable().optional(),
  workflow_name: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  purchase_request_template_detail: z.array(PurchaseRequestTemplateDetailItemSchema).nullable().optional(),
});

export const PurchaseRequestTemplateMutationResponseSchema = z.object({
  id: z.string(),
});

export type PurchaseRequestTemplateDetailResponse = z.infer<typeof PurchaseRequestTemplateDetailResponseSchema>;
export type PurchaseRequestTemplateListItemResponse = z.infer<typeof PurchaseRequestTemplateListItemResponseSchema>;
export type PurchaseRequestTemplateMutationResponse = z.infer<typeof PurchaseRequestTemplateMutationResponseSchema>;
