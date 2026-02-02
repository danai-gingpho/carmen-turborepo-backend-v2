import { z } from 'zod';
import { decimalField } from '@/common/validation/zod-helpers';

// Embedded schemas
const PurchaseOrderDetailEmbeddedSchema = z.object({
  id: z.string(),
  sequence_no: z.number().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  order_qty: decimalField,
  order_unit_id: z.string().nullable().optional(),
  order_unit_name: z.string().nullable().optional(),
  base_qty: decimalField,
  base_unit_id: z.string().nullable().optional(),
  base_unit_name: z.string().nullable().optional(),
  unit_price: decimalField,
  sub_total_price: decimalField,
  base_sub_total_price: decimalField,
  is_foc: z.boolean().optional(),
  is_tax_included: z.boolean().optional(),
  tax_rate: decimalField,
  tax_amount: decimalField,
  discount_rate: decimalField,
  discount_amount: decimalField,
  net_amount: decimalField,
  base_net_amount: decimalField,
  total_price: decimalField,
  base_total_price: decimalField,
  info: z.any().nullable().optional(),
});

const VendorEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  code: z.string().optional(),
}).or(z.object({}));

const CurrencyEmbeddedSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  code: z.string().optional(),
  symbol: z.string().optional(),
}).or(z.object({}));

// Purchase order detail response schema (for findOne)
export const PurchaseOrderDetailResponseSchema = z.object({
  id: z.string(),
  po_no: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  purchase_order_status: z.string().nullable().optional(),
  order_date: z.coerce.date().nullable().optional(),
  delivery_date: z.coerce.date().nullable().optional(),
  approval_date: z.coerce.date().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor: VendorEmbeddedSchema.optional(),
  currency_id: z.string().nullable().optional(),
  currency: CurrencyEmbeddedSchema.optional(),
  base_currency_id: z.string().nullable().optional(),
  base_currency: CurrencyEmbeddedSchema.optional(),
  exchange_rate: decimalField,
  sub_total: decimalField,
  discount_amount: decimalField,
  tax_amount: decimalField,
  total_amount: decimalField,
  notes: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  buyer_name: z.string().nullable().optional(),
  credit_term_id: z.string().nullable().optional(),
  credit_term_name: z.string().nullable().optional(),
  credit_term_value: z.number().nullable().optional(),
  remarks: z.string().nullable().optional(),
  doc_version: z.number().nullable().optional(),
  info: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
  purchase_order_detail: z.array(PurchaseOrderDetailEmbeddedSchema).optional(),
});

export type PurchaseOrderDetailResponse = z.infer<typeof PurchaseOrderDetailResponseSchema>;

// Purchase order list item response schema (for findAll)
export const PurchaseOrderListItemResponseSchema = z.object({
  id: z.string(),
  po_no: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  purchase_order_status: z.string().nullable().optional(),
  order_date: z.coerce.date().nullable().optional(),
  delivery_date: z.coerce.date().nullable().optional(),
  vendor_id: z.string().nullable().optional(),
  vendor_name: z.string().nullable().optional(),
  currency_id: z.string().nullable().optional(),
  currency_code: z.string().nullable().optional(),
  total_amount: decimalField,
  is_active: z.boolean().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type PurchaseOrderListItemResponse = z.infer<typeof PurchaseOrderListItemResponseSchema>;

// Mutation response schema
export const PurchaseOrderMutationResponseSchema = z.object({
  id: z.string(),
});

export type PurchaseOrderMutationResponse = z.infer<typeof PurchaseOrderMutationResponseSchema>;
