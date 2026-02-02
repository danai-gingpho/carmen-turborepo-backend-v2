import { z } from 'zod';
import { decimalField } from '../../common/validation/zod-helpers';

// Embedded schemas
const GoodReceivedNoteDetailEmbeddedSchema = z.object({
  id: z.string(),
  sequence_no: z.number().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
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
  status: z.string().nullable().optional(),
  receive_date: z.coerce.date().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor: VendorEmbeddedSchema.optional(),
  purchase_order_id: z.string().nullable().optional(),
  purchase_order: PurchaseOrderEmbeddedSchema.optional(),
  location_id: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  sub_total: decimalField,
  tax_amount: decimalField,
  total_amount: decimalField,
  notes: z.string().nullable().optional(),
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
  status: z.string().nullable().optional(),
  receive_date: z.coerce.date().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  purchase_order_id: z.string().nullable().optional(),
  po_no: z.string().nullable().optional(),
  total_amount: decimalField,
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
