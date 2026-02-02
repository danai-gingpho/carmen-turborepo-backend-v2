import { z } from 'zod';

// PR Detail linkage schema - links PO detail to PR detail
export const PurchaseOrderPrDetailSchema = z.object({
  pr_detail_id: z.string().uuid(),
  order_qty: z.number().positive(),
  order_unit_id: z.string().uuid(),
  order_unit_name: z.string().optional(),
  order_base_qty: z.number().nonnegative(),
  order_base_unit_id: z.string().uuid().optional(),
  order_base_unit_name: z.string().optional(),
});

// PO Detail schema
export const PurchaseOrderDetailSchema = z.object({
  sequence: z.number().int().positive(),
  product_id: z.string().uuid(),
  product_name: z.string().optional(),
  product_local_name: z.string().optional(),
  order_unit_id: z.string().uuid(),
  order_unit_name: z.string().optional(),
  order_unit_conversion_factor: z.number().optional().default(1),
  order_qty: z.number().positive(),
  base_unit_id: z.string().uuid().optional(),
  base_unit_name: z.string().optional(),
  base_qty: z.number().nonnegative().optional(),
  // Pricing
  price: z.number().nonnegative().optional().default(0),
  sub_total_price: z.number().nonnegative().optional().default(0),
  net_amount: z.number().nonnegative().optional().default(0),
  total_price: z.number().nonnegative().optional().default(0),
  // Tax
  tax_profile_id: z.string().uuid().optional(),
  tax_profile_name: z.string().optional(),
  tax_rate: z.number().nonnegative().optional().default(0),
  tax_amount: z.number().nonnegative().optional().default(0),
  is_tax_adjustment: z.boolean().optional().default(false),
  // Discount
  discount_rate: z.number().nonnegative().optional().default(0),
  discount_amount: z.number().nonnegative().optional().default(0),
  is_discount_adjustment: z.boolean().optional().default(false),
  // FOC
  is_foc: z.boolean().optional().default(false),
  // PR detail linkage
  pr_detail: z.array(PurchaseOrderPrDetailSchema).min(1),
  // Optional fields
  description: z.string().optional(),
  note: z.string().optional(),
});

// Create PO schema
export const CreatePurchaseOrderSchema = z.object({
  vendor_id: z.string().uuid(),
  vendor_name: z.string().optional(),
  delivery_date: z.string().datetime().or(z.string()),
  currency_id: z.string().uuid(),
  currency_name: z.string().optional(),
  exchange_rate: z.number().positive().optional().default(1),
  // Optional header fields
  description: z.string().optional(),
  order_date: z.string().datetime().or(z.string()).optional(),
  credit_term_id: z.string().uuid().optional(),
  credit_term_name: z.string().optional(),
  credit_term_value: z.number().int().nonnegative().optional(),
  buyer_id: z.string().uuid().optional(),
  buyer_name: z.string().optional(),
  email: z.string().email().optional(),
  remarks: z.string().optional(),
  note: z.string().optional(),
  // Details
  details: z.array(PurchaseOrderDetailSchema).min(1),
});

export type CreatePurchaseOrderDto = z.infer<typeof CreatePurchaseOrderSchema>;
export type PurchaseOrderDetailDto = z.infer<typeof PurchaseOrderDetailSchema>;
export type PurchaseOrderPrDetailDto = z.infer<typeof PurchaseOrderPrDetailSchema>;
