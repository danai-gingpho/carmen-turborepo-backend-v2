import { z } from 'zod';
import { decimalField } from '../../common/validation/zod-helpers';

// Embedded schemas
const GoodReceivedNoteDetailEmbeddedSchema = z.object({
  id: z.string(),
  sequence_no: z.number().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  product_local_name: z.string().nullable().optional(),
  product_sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  ordered_qty: decimalField,
  received_qty: decimalField,
  unit_id: z.string().nullable().optional(),
  unit_name: z.string().nullable().optional(),
  unit_price: decimalField,
  total_price: decimalField,
  location_id: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
});

const VendorEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  code: z.string().optional(),
}).or(z.object({}));

const PurchaseOrderEmbeddedSchema = z.object({
  id: z.string().optional(),
  po_no: z.string().optional(),
  name: z.string().optional(),
}).or(z.object({}));

// Good received note detail response schema (for findOne)
export const GoodReceivedNoteDetailResponseSchema = z.object({
  id: z.string(),
  grn_no: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  doc_status: z.enum(['draft', 'saved', 'committed', 'voided']).nullable().optional(),
  doc_type: z.string().nullable().optional(),
  grn_date: z.coerce.date().nullable().optional(),
  invoice_no: z.string().nullable().optional(),
  invoice_date: z.coerce.date().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  currency_id: z.string().nullable().optional(),
  currency_code: z.string().nullable().optional(),
  exchange_rate: decimalField,
  is_consignment: z.boolean().nullable().optional(),
  is_cash: z.boolean().nullable().optional(),
  credit_term_id: z.string().nullable().optional(),
  credit_term_name: z.string().nullable().optional(),
  credit_term_days: z.number().nullable().optional(),
  payment_due_date: z.coerce.date().nullable().optional(),
  note: z.string().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  info: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  good_received_note_detail: z.array(GoodReceivedNoteDetailEmbeddedSchema).optional(),
});

export type GoodReceivedNoteDetailResponse = z.infer<typeof GoodReceivedNoteDetailResponseSchema>;

// Good received note list item response schema (for findAll)
export const GoodReceivedNoteListItemResponseSchema = z.object({
  id: z.string(),
  grn_no: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  doc_status: z.enum(['draft', 'saved', 'committed', 'voided']).nullable().optional(),
  doc_type: z.string().nullable().optional(),
  grn_date: z.coerce.date().nullable().optional(),
  invoice_no: z.string().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  currency_code: z.string().nullable().optional(),
  net_amount: decimalField,
  base_net_amount: decimalField,
  total_amount: decimalField,
  base_total_amount: decimalField,
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type GoodReceivedNoteListItemResponse = z.infer<typeof GoodReceivedNoteListItemResponseSchema>;

// Mutation response schema
export const GoodReceivedNoteMutationResponseSchema = z.object({
  id: z.string(),
});

export type GoodReceivedNoteMutationResponse = z.infer<typeof GoodReceivedNoteMutationResponseSchema>;
