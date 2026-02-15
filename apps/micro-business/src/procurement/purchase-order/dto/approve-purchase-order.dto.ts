import { z } from 'zod';
import { enum_stage_role } from '@repo/prisma-shared-schema-tenant';

// Approve PO Detail schema - fields that can be updated during approval
export const ApprovePurchaseOrderDetailSchema = z.object({
  id: z.string().uuid(),

  // Order quantities
  order_qty: z.number().nonnegative().optional(),
  order_unit_id: z.string().uuid().optional(),
  order_unit_name: z.string().optional(),
  order_unit_conversion_factor: z.number().optional(),

  // Base quantities
  base_qty: z.number().nonnegative().optional(),
  base_unit_id: z.string().uuid().optional(),
  base_unit_name: z.string().optional(),

  // Pricing
  price: z.number().nonnegative().optional(),
  sub_total_price: z.number().nonnegative().optional(),
  net_amount: z.number().nonnegative().optional(),
  total_price: z.number().nonnegative().optional(),
  base_price: z.number().nonnegative().optional(),
  base_sub_total_price: z.number().nonnegative().optional(),
  base_net_amount: z.number().nonnegative().optional(),
  base_total_price: z.number().nonnegative().optional(),

  // Tax
  tax_profile_id: z.string().uuid().optional(),
  tax_profile_name: z.string().optional(),
  tax_rate: z.number().nonnegative().optional(),
  tax_amount: z.number().nonnegative().optional(),
  base_tax_amount: z.number().nonnegative().optional(),
  is_tax_adjustment: z.boolean().optional(),

  // Discount
  discount_rate: z.number().nonnegative().optional(),
  discount_amount: z.number().nonnegative().optional(),
  base_discount_amount: z.number().nonnegative().optional(),
  is_discount_adjustment: z.boolean().optional(),

  // FOC
  is_foc: z.boolean().optional(),

  // Optional fields
  description: z.string().optional(),
  note: z.string().optional(),
});

// Approve PO schema
export const ApprovePurchaseOrderSchema = z.object({
  state_role: z.nativeEnum(enum_stage_role),
  details: z.array(ApprovePurchaseOrderDetailSchema).min(1),
});

export type ApprovePurchaseOrderDto = z.infer<typeof ApprovePurchaseOrderSchema>;
export type ApprovePurchaseOrderDetailDto = z.infer<typeof ApprovePurchaseOrderDetailSchema>;
