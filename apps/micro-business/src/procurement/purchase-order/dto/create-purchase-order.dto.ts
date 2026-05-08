import { z } from 'zod';
import { enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { stage_status } from '@/procurement/purchase-request/dto/purchase-request-detail.dto';

// Location schema - for manual PO with location breakdown
export const PurchaseOrderLocationSchema = z.object({
  location_id: z.string().uuid(),
  location_code: z.string().optional(),
  location_name: z.string().optional(),
  delivery_point_id: z.string().uuid().optional(),
  delivery_point_name: z.string().optional(),
  order_qty: z.number().nonnegative(),
  order_base_qty: z.number().nonnegative().optional().default(0),
});

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
  product_code: z.string().optional(),
  product_name: z.string().optional(),
  product_local_name: z.string().optional(),
  product_sku: z.string().optional(),
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
  pr_detail: z.array(PurchaseOrderPrDetailSchema).optional(),
  // Location breakdown
  locations: z.array(PurchaseOrderLocationSchema).min(1),
  // Stage status
  current_stage_status: z.nativeEnum(stage_status).optional(),
  // Optional fields
  description: z.string().optional(),
  note: z.string().optional(),
  comment: z.string().optional().nullable(),
});

// Create PO Detail Operations schema (add only)
export const CreatePurchaseOrderDetailOperationsSchema = z.object({
  add: z.array(PurchaseOrderDetailSchema).min(1),
});

// Inner PO data schema (inside details)
export const CreatePurchaseOrderDataSchema = z.object({
  po_type: z.enum(['manual', 'purchase_request']).optional().default('manual'),
  vendor_id: z.string().uuid(),
  vendor_name: z.string().optional(),
  delivery_date: z.string().datetime().or(z.string()),
  currency_id: z.string().uuid(),
  currency_code: z.string().optional(),
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
  workflow_id: z.string().uuid(),
  // Details
  purchase_order_detail: CreatePurchaseOrderDetailOperationsSchema,
});

// Create PO schema - wrapper with stage_role + details
export const CreatePurchaseOrderSchema = z.object({
  stage_role: z.literal(enum_stage_role.create),
  details: CreatePurchaseOrderDataSchema,
});

export type CreatePurchaseOrderDto = z.infer<typeof CreatePurchaseOrderSchema>;
export type CreatePurchaseOrderDataDto = z.infer<typeof CreatePurchaseOrderDataSchema>;
export type CreatePurchaseOrderDetailOperationsDto = z.infer<typeof CreatePurchaseOrderDetailOperationsSchema>;
export type PurchaseOrderDetailDto = z.infer<typeof PurchaseOrderDetailSchema>;
export type PurchaseOrderPrDetailDto = z.infer<typeof PurchaseOrderPrDetailSchema>;
