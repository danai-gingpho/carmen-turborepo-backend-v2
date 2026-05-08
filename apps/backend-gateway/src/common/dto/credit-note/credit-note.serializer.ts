import { z } from 'zod';
import { AuditSchema } from '../audit/audit.dto';

const AuditFields = {
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
  deleted_at: z.coerce.date().nullable().optional(),
  deleted_by_id: z.string().nullable().optional(),
};

const VendorEmbeddedSchema = z.object({
  id: z.string().optional(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  business_type_id: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  tax_profile: z.any().nullable().optional(),
  note: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  ...AuditFields,
}).passthrough().nullable().optional();

const CurrencyEmbeddedSchema = z.object({
  id: z.string().optional(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  symbol: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  exchange_rate: z.coerce.number().nullable().optional(),
  ...AuditFields,
}).passthrough().nullable().optional();

const GoodReceivedNoteEmbeddedSchema = z.object({
  id: z.string().optional(),
  grn_no: z.string().nullable().optional(),
  grn_date: z.coerce.date().nullable().optional(),
  doc_status: z.string().nullable().optional(),
  doc_type: z.string().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  ...AuditFields,
}).passthrough().nullable().optional();

const CreditNoteReasonEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  ...AuditFields,
}).passthrough().nullable().optional();

const CreditNoteCommentEmbeddedSchema = z.object({
  id: z.string(),
  credit_note_id: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  attachments: z.any().nullable().optional(),
  ...AuditFields,
}).passthrough();

const CreditNoteDetailCommentEmbeddedSchema = z.object({
  id: z.string(),
  credit_note_detail_id: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  attachments: z.any().nullable().optional(),
  ...AuditFields,
}).passthrough();

const ProductEmbeddedSchema = z.object({
  id: z.string().optional(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  local_name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  ...AuditFields,
}).passthrough().nullable().optional();

const TaxProfileEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tax_rate: z.coerce.number().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  ...AuditFields,
}).passthrough().nullable().optional();

const LocationEmbeddedSchema = z.object({
  id: z.string().optional(),
  code: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  location_type: z.string().nullable().optional(),
  delivery_point_id: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  ...AuditFields,
}).passthrough().nullable().optional();

const InventoryTransactionEmbeddedSchema = z.object({
  id: z.string().optional(),
  transaction_type: z.string().nullable().optional(),
  product_id: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  qty: z.coerce.number().nullable().optional(),
  cost_per_unit: z.coerce.number().nullable().optional(),
  total_cost: z.coerce.number().nullable().optional(),
  reference_type: z.string().nullable().optional(),
  reference_id: z.string().nullable().optional(),
  ...AuditFields,
}).passthrough().nullable().optional();

const CreditNoteDetailEmbeddedSchema = z.object({
  id: z.string(),
  credit_note_id: z.string().nullable().optional(),
  inventory_transaction_id: z.string().nullable().optional(),
  sequence_no: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),

  location_id: z.string().nullable().optional(),
  location_code: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  delivery_point_id: z.string().nullable().optional(),
  delivery_point_name: z.string().nullable().optional(),

  product_id: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_local_name: z.string().nullable().optional(),
  product_sku: z.string().nullable().optional(),

  return_qty: z.coerce.number().nullable().optional(),
  return_unit_id: z.string().nullable().optional(),
  return_unit_name: z.string().nullable().optional(),
  return_conversion_factor: z.coerce.number().nullable().optional(),
  return_base_qty: z.coerce.number().nullable().optional(),

  price: z.coerce.number().nullable().optional(),

  tax_profile_id: z.string().nullable().optional(),
  tax_profile_name: z.string().nullable().optional(),
  tax_rate: z.coerce.number().nullable().optional(),
  tax_amount: z.coerce.number().nullable().optional(),
  base_tax_amount: z.coerce.number().nullable().optional(),
  is_tax_adjustment: z.boolean().nullable().optional(),

  discount_rate: z.coerce.number().nullable().optional(),
  discount_amount: z.coerce.number().nullable().optional(),
  base_discount_amount: z.coerce.number().nullable().optional(),
  is_discount_adjustment: z.boolean().nullable().optional(),

  extra_cost_amount: z.coerce.number().nullable().optional(),
  base_extra_cost_amount: z.coerce.number().nullable().optional(),

  sub_total_price: z.coerce.number().nullable().optional(),
  net_amount: z.coerce.number().nullable().optional(),
  total_price: z.coerce.number().nullable().optional(),

  base_price: z.coerce.number().nullable().optional(),
  base_sub_total_price: z.coerce.number().nullable().optional(),
  base_net_amount: z.coerce.number().nullable().optional(),
  base_total_price: z.coerce.number().nullable().optional(),

  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),

  audit: AuditSchema.optional(),

  tb_product: ProductEmbeddedSchema,
  tb_tax_profile: TaxProfileEmbeddedSchema,
  tb_location: LocationEmbeddedSchema,
  tb_inventory_transaction: InventoryTransactionEmbeddedSchema,
  tb_credit_note_detail_comment: z.array(CreditNoteDetailCommentEmbeddedSchema).optional(),
}).passthrough();

export const CreditNoteDetailResponseSchema = z.object({
  id: z.string(),
  cn_no: z.string().nullable().optional(),
  cn_date: z.coerce.date().nullable().optional(),
  doc_status: z.string().nullable().optional(),
  credit_note_type: z.string().nullable().optional(),

  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),

  pricelist_detail_id: z.string().nullable().optional(),
  pricelist_no: z.string().nullable().optional(),
  pricelist_unit: z.string().nullable().optional(),
  pricelist_price: z.coerce.number().nullable().optional(),

  currency_id: z.string().nullable().optional(),
  currency_code: z.string().nullable().optional(),
  exchange_rate: z.coerce.number().nullable().optional(),
  exchange_rate_date: z.coerce.date().nullable().optional(),

  grn_id: z.string().nullable().optional(),
  grn_no: z.string().nullable().optional(),
  grn_date: z.coerce.date().nullable().optional(),

  cn_reason_id: z.string().nullable().optional(),
  cn_reason_name: z.string().nullable().optional(),
  cn_reason_description: z.string().nullable().optional(),

  invoice_no: z.string().nullable().optional(),
  invoice_date: z.coerce.date().nullable().optional(),

  tax_invoice_no: z.string().nullable().optional(),
  tax_invoice_date: z.coerce.date().nullable().optional(),

  note: z.string().nullable().optional(),
  description: z.string().nullable().optional(),

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

  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  doc_version: z.number().nullable().optional(),

  audit: AuditSchema.optional(),

  tb_vendor: VendorEmbeddedSchema,
  tb_currency: CurrencyEmbeddedSchema,
  tb_good_received_note: GoodReceivedNoteEmbeddedSchema,
  tb_credit_note_reason: CreditNoteReasonEmbeddedSchema,
  tb_credit_note_comment: z.array(CreditNoteCommentEmbeddedSchema).optional(),
  credit_note_detail: z.array(CreditNoteDetailEmbeddedSchema).optional(),
}).passthrough();

export type CreditNoteDetailResponse = z.infer<typeof CreditNoteDetailResponseSchema>;

export const CreditNoteListItemResponseSchema = z.object({
  id: z.string(),
  cn_no: z.string().nullable().optional(),
  cn_date: z.coerce.date().nullable().optional(),
  credit_note_type: z.string().nullable().optional(),
  doc_status: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  cn_reason_name: z.string().nullable().optional(),
  cn_reason_description: z.string().nullable().optional(),
  currency_code: z.string().nullable().optional(),
  exchange_rate: z.coerce.number().nullable().optional(),
  net_amount: z.coerce.number().nullable().optional(),
  base_net_amount: z.coerce.number().nullable().optional(),
  total_amount: z.coerce.number().nullable().optional(),
  base_total_amount: z.coerce.number().nullable().optional(),
  audit: AuditSchema.optional(),
});

export type CreditNoteListItemResponse = z.infer<typeof CreditNoteListItemResponseSchema>;

export const CreditNoteMutationResponseSchema = z.object({
  id: z.string(),
});

export type CreditNoteMutationResponse = z.infer<typeof CreditNoteMutationResponseSchema>;
