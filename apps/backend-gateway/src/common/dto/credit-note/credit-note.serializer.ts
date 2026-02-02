import { z } from 'zod';

// Embedded schemas
const CreditNoteDetailEmbeddedSchema = z.object({
  id: z.string(),
  sequence_no: z.number().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  qty: z.number().nullable().optional(),
  unit_id: z.string().nullable().optional(),
  unit_name: z.string().nullable().optional(),
  unit_price: z.number().nullable().optional(),
  total_price: z.number().nullable().optional(),
  reason_id: z.string().nullable().optional(),
  reason_name: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
});

const VendorEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  code: z.string().optional(),
}).or(z.object({}));

const GoodReceivedNoteEmbeddedSchema = z.object({
  id: z.string().optional(),
  grn_no: z.string().optional(),
  name: z.string().optional(),
}).or(z.object({}));

// Credit note detail response schema (for findOne)
export const CreditNoteDetailResponseSchema = z.object({
  id: z.string(),
  cn_no: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  credit_note_date: z.coerce.date().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor: VendorEmbeddedSchema.optional(),
  good_received_note_id: z.string().nullable().optional(),
  good_received_note: GoodReceivedNoteEmbeddedSchema.optional(),
  sub_total: z.number().nullable().optional(),
  tax_amount: z.number().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  info: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  credit_note_detail: z.array(CreditNoteDetailEmbeddedSchema).optional(),
});

export type CreditNoteDetailResponse = z.infer<typeof CreditNoteDetailResponseSchema>;

// Credit note list item response schema (for findAll)
export const CreditNoteListItemResponseSchema = z.object({
  id: z.string(),
  cn_no: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  credit_note_date: z.coerce.date().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  good_received_note_id: z.string().nullable().optional(),
  grn_no: z.string().nullable().optional(),
  total_amount: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type CreditNoteListItemResponse = z.infer<typeof CreditNoteListItemResponseSchema>;

// Mutation response schema
export const CreditNoteMutationResponseSchema = z.object({
  id: z.string(),
});

export type CreditNoteMutationResponse = z.infer<typeof CreditNoteMutationResponseSchema>;
