import { z } from 'zod';

// Embedded schemas
const PurchaseRequestDetailEmbeddedSchema = z.object({
  id: z.string(),
  purchase_request_id: z.string().nullable().optional(),
  sequence_no: z.number().nullable().optional(),

  // Location
  location_id: z.string().nullable().optional(),
  location_code: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  delivery_point_id: z.string().nullable().optional(),
  delivery_point_name: z.string().nullable().optional(),
  delivery_date: z.coerce.date().nullable().optional(),

  // Product
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_local_name: z.string().nullable().optional(),

  // Inventory unit
  inventory_unit_id: z.string().nullable().optional(),
  inventory_unit_name: z.string().nullable().optional(),

  description: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),

  // Vendor
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),

  // Pricelist
  pricelist_detail_id: z.string().nullable().optional(),
  pricelist_no: z.string().nullable().optional(),
  pricelist_unit: z.string().nullable().optional(),
  pricelist_price: z.coerce.number().nullable().optional(),
  pricelist_type: z.string().nullable().optional(),

  // Currency
  currency_id: z.string().nullable().optional(),
  currency_name: z.string().nullable().optional(),
  exchange_rate: z.coerce.number().nullable().optional(),
  exchange_rate_date: z.coerce.date().nullable().optional(),

  // Requested
  requested_qty: z.coerce.number().nullable().optional(),
  requested_unit_id: z.string().nullable().optional(),
  requested_unit_name: z.string().nullable().optional(),

  // Approved
  approved_qty: z.coerce.number().nullable().optional(),
  approved_unit_id: z.string().nullable().optional(),
  approved_unit_name: z.string().nullable().optional(),

  // FOC (Free of Charge)
  foc_qty: z.coerce.number().nullable().optional(),
  foc_unit_id: z.string().nullable().optional(),
  foc_unit_name: z.string().nullable().optional(),

  // Tax
  tax_profile_id: z.string().nullable().optional(),
  tax_profile_name: z.string().nullable().optional(),
  tax_rate: z.coerce.number().nullable().optional(),
  tax_amount: z.coerce.number().nullable().optional(),
  is_tax_adjustment: z.boolean().nullable().optional(),

  // Discount
  discount_rate: z.coerce.number().nullable().optional(),
  discount_amount: z.coerce.number().nullable().optional(),
  is_discount_adjustment: z.boolean().nullable().optional(),

  // Prices
  sub_total_price: z.coerce.number().nullable().optional(),
  net_amount: z.coerce.number().nullable().optional(),
  total_price: z.coerce.number().nullable().optional(),

  // Status & metadata
  current_stage_status: z.string().nullable().optional(),
  dimension: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

const WorkflowEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
}).or(z.object({}));

const DepartmentEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
}).or(z.object({}));

// Purchase request detail response schema (for findOne)
export const PurchaseRequestDetailResponseSchema = z.object({
  id: z.string(),
  role: z.string(),
  pr_no: z.string().nullable().optional(),
  pr_date: z.coerce.date().nullable().optional(),
  pr_status: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  requestor_id: z.string().nullable().optional(),
  requestor_name: z.string().nullable().optional(),
  current_stage: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  workflow_id: z.string().nullable().optional(),
  workflow_name: z.string().nullable().optional(),
  workflow_history: z.any().nullable().optional(),
  workflow_current_stage: z.string().nullable().optional(),
  workflow_next_stage: z.string().nullable().optional(),
  workflow_previous_stage: z.string().nullable().optional(),
  department_id: z.string().nullable().optional(),
  department_name: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  purchase_request_detail: z.array(PurchaseRequestDetailEmbeddedSchema).optional(),
});

export type PurchaseRequestDetailResponse = z.infer<typeof PurchaseRequestDetailResponseSchema>;

// Purchase request list item detail (for total calculation)
const PurchaseRequestListItemDetailSchema = z.object({
  price: z.coerce.number().nullable().optional(),
  total_price: z.coerce.number().nullable().optional(),
});

// Purchase request list item response schema (for findAll)
export const PurchaseRequestListItemResponseSchema = z.object({
  id: z.string(),

  pr_no: z.string().nullable().optional(),
  pr_date: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),

  requestor_id: z.string().nullable().optional(),
  requestor_name: z.string().nullable().optional(),

  pr_status: z.string().nullable().optional(),

  workflow_id: z.string().nullable().optional(),
  workflow_name: z.string().nullable().optional(),
  workflow_current_stage: z.string().nullable().optional(),
  workflow_next_stage: z.string().nullable().optional(),
  workflow_previous_stage: z.string().nullable().optional(),
  workflow_history: z.any().nullable().optional(),
  last_action: z.string().nullable().optional(),

  department_id: z.string().nullable().optional(),
  department_name: z.string().nullable().optional(),

  // total_amount: z.coerce.number().nullable().optional(),

  is_active: z.boolean().optional(),
  doc_version: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  purchase_request_detail: z.array(PurchaseRequestListItemDetailSchema).optional(),
});

export type PurchaseRequestListItemResponse = z.infer<typeof PurchaseRequestListItemResponseSchema>;

// Mutation response schema
export const PurchaseRequestMutationResponseSchema = z.object({
  id: z.string(),
});

export type PurchaseRequestMutationResponse = z.infer<typeof PurchaseRequestMutationResponseSchema>;
