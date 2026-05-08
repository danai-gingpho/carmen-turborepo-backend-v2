import { z } from 'zod';
import { decimalField } from '@/common/validation/zod-helpers';

// Detail item schema (nested under good_received_note_detail)
const GoodReceivedNoteDetailItemSchema = z.object({
  id: z.string(),
  good_received_note_detail_id: z.string(),
  inventory_transaction_id: z.string().nullable().optional(),
  purchase_order_detail_purchase_request_detail_id: z.string().nullable().optional(),
  order_qty: decimalField,
  order_unit_id: z.string().nullable().optional(),
  order_unit_name: z.string().nullable().optional(),
  order_unit_conversion_factor: decimalField,
  order_base_qty: decimalField,
  received_qty: decimalField,
  received_unit_id: z.string().nullable().optional(),
  received_unit_name: z.string().nullable().optional(),
  received_unit_conversion_factor: decimalField,
  received_base_qty: decimalField,
  foc_qty: decimalField,
  foc_unit_id: z.string().nullable().optional(),
  foc_unit_name: z.string().nullable().optional(),
  foc_unit_conversion_factor: decimalField,
  foc_base_qty: decimalField,
  tax_profile_id: z.string().nullable().optional(),
  tax_profile_name: z.string().nullable().optional(),
  tax_rate: decimalField,
  tax_amount: decimalField,
  base_tax_amount: decimalField,
  is_tax_adjustment: z.boolean().nullable().optional(),
  discount_rate: decimalField,
  discount_amount: decimalField,
  base_discount_amount: decimalField,
  is_discount_adjustment: z.boolean().nullable().optional(),
  sub_total_price: decimalField,
  net_amount: decimalField,
  total_price: decimalField,
  base_price: decimalField,
  base_sub_total_price: decimalField,
  base_net_amount: decimalField,
  base_total_price: decimalField,
  note: z.string().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
}).passthrough();

// Detail schema (good_received_note_detail)
const GoodReceivedNoteDetailEmbeddedSchema = z.object({
  id: z.string(),
  good_received_note_id: z.string(),
  sequence_no: z.number().nullable().optional(),
  purchase_order_id: z.string().nullable().optional(),
  purchase_order_detail_id: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  location_code: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  location_type: z.string().nullable().optional(),
  po_no: z.string().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_local_name: z.string().nullable().optional(),
  product_sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
  items: z.array(GoodReceivedNoteDetailItemSchema).optional(),
}).passthrough();

// Extra cost detail schema
const ExtraCostDetailSchema = z.object({
  id: z.string(),
}).passthrough();

// Extra cost schema
const ExtraCostSchema = z.object({
  id: z.string(),
  good_received_note_id: z.string(),
}).passthrough();

// Good received note detail response schema (for findOne)
export const GoodReceivedNoteDetailResponseSchema = z.object({
  id: z.string(),
  grn_no: z.string().nullable().optional(),
  grn_date: z.coerce.date().nullable().optional(),
  invoice_no: z.string().nullable().optional(),
  invoice_date: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),
  doc_status: z.enum(['draft', 'saved', 'committed', 'voided']).nullable().optional(),
  doc_type: z.string().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  currency_id: z.string().nullable().optional(),
  currency_code: z.string().nullable().optional(),
  exchange_rate: decimalField,
  exchange_rate_date: z.coerce.date().nullable().optional(),
  workflow_id: z.string().nullable().optional(),
  workflow_name: z.string().nullable().optional(),
  workflow_history: z.any().nullable().optional(),
  workflow_current_stage: z.string().nullable().optional(),
  workflow_previous_stage: z.string().nullable().optional(),
  workflow_next_stage: z.string().nullable().optional(),
  user_action: z.any().nullable().optional(),
  last_action: z.string().nullable().optional(),
  last_action_at_date: z.coerce.date().nullable().optional(),
  last_action_by_id: z.string().nullable().optional(),
  last_action_by_name: z.string().nullable().optional(),
  is_consignment: z.boolean().nullable().optional(),
  is_cash: z.boolean().nullable().optional(),
  signature_image_url: z.string().nullable().optional(),
  received_by_id: z.string().nullable().optional(),
  received_by_name: z.string().nullable().optional(),
  received_at: z.coerce.date().nullable().optional(),
  credit_term_id: z.string().nullable().optional(),
  credit_term_name: z.string().nullable().optional(),
  credit_term_days: z.number().nullable().optional(),
  payment_due_date: z.coerce.date().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
  good_received_note_detail: z.array(GoodReceivedNoteDetailEmbeddedSchema).optional(),
  extra_cost: z.array(ExtraCostSchema).optional(),
  extra_cost_detail: z.array(ExtraCostDetailSchema).optional(),
}).passthrough();

export type GoodReceivedNoteDetailResponse = z.infer<typeof GoodReceivedNoteDetailResponseSchema>;

// Good received note list item response schema (for findAll)
export const GoodReceivedNoteListItemResponseSchema = z.object({
  id: z.string(),
  grn_no: z.string().nullable().optional(),
  grn_date: z.coerce.date().nullable().optional(),
  doc_type: z.string().nullable().optional(),
  doc_status: z.enum(['draft', 'saved', 'committed', 'voided']).nullable().optional(),
  invoice_no: z.string().nullable().optional(),
  invoice_date: z.coerce.date().nullable().optional(),
  description: z.string().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  currency_id: z.string().nullable().optional(),
  currency_code: z.string().nullable().optional(),
  exchange_rate: decimalField,
  exchange_rate_date: z.coerce.date().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  note: z.string().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
}).passthrough();

export type GoodReceivedNoteListItemResponse = z.infer<typeof GoodReceivedNoteListItemResponseSchema>;

// Mutation response schema
export const GoodReceivedNoteMutationResponseSchema = z.object({
  id: z.string(),
});

export type GoodReceivedNoteMutationResponse = z.infer<typeof GoodReceivedNoteMutationResponseSchema>;

// GRN product list item — used by product/location sub-resource endpoints
export const GrnProductListItemSchema = z.object({
  product_id: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_sku: z.string().nullable().optional(),
}).passthrough();

export type GrnProductListItem = z.infer<typeof GrnProductListItemSchema>;

// GRN location list item — used by location/product sub-resource endpoints
export const GrnLocationListItemSchema = z.object({
  location_id: z.string().nullable().optional(),
  location_code: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
}).passthrough();

export type GrnLocationListItem = z.infer<typeof GrnLocationListItemSchema>;
