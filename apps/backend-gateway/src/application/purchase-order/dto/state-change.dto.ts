import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ==================== Enums ====================

enum stage_status {
  submit = 'submit',
  pending = 'pending',
  approve = 'approve',
  reject = 'reject',
  review = 'review',
}

enum stage_role {
  create = 'create',
  approve = 'approve',
  purchase = 'purchase',
  view_only = 'view_only',
  issue = 'issue',
}

// ==================== Submit PO ====================

export const SubmitPurchaseOrderDetailSchema = z.object({
  id: z.string().uuid(),
  stage_status: z.nativeEnum(stage_status),
  stage_message: z.string().nullable(),
});

export const SubmitPurchaseOrderSchema = z.object({
  stage_role: z.nativeEnum(stage_role),
  details: z.array(SubmitPurchaseOrderDetailSchema).min(1),
});

export class SubmitPurchaseOrderDto extends createZodDto(SubmitPurchaseOrderSchema) {}

// ==================== Approve PO ====================

export const ApprovePurchaseOrderDetailSchema = z.object({
  id: z.string().uuid(),
  stage_status: z.nativeEnum(stage_status),
});

export const ApprovePurchaseOrderSchema = z.object({
  stage_role: z.nativeEnum(stage_role),
  details: z.array(ApprovePurchaseOrderDetailSchema).min(1),
});

export class ApprovePurchaseOrderDto extends createZodDto(ApprovePurchaseOrderSchema) {}

// ==================== Save PO (add/update/remove details) ====================

const SavePurchaseOrderDetailSchema = z.object({
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
  pr_detail: z.array(z.object({
    pr_detail_id: z.string().uuid(),
    order_qty: z.number().positive(),
    order_unit_id: z.string().uuid(),
    order_unit_name: z.string().optional(),
    order_base_qty: z.number().nonnegative(),
    order_base_unit_id: z.string().uuid().optional(),
    order_base_unit_name: z.string().optional(),
  })).min(1),

  // Stage status
  current_stage_status: z.nativeEnum(stage_status).optional(),

  // Optional fields
  description: z.string().optional(),
  note: z.string().optional(),
});

const UpdateSavePurchaseOrderDetailSchema = SavePurchaseOrderDetailSchema.omit({
  pr_detail: true,
}).extend({
  id: z.string().uuid(),
});

// Save PO schema - stage_role + details (shape depends on role)
export const SavePurchaseOrderSchema = z.object({
  stage_role: z.nativeEnum(stage_role),
  // details: object (create role) or array (approve/purchase role)
   
  details: z.any(),
});

export class SavePurchaseOrderDto extends createZodDto(SavePurchaseOrderSchema) {}

// ==================== Reject PO ====================

export const RejectPurchaseOrderDetailSchema = z.object({
  id: z.string().uuid(),
  stage_status: z.nativeEnum(stage_status),
  stage_message: z.string().nullable(),
});

export const RejectPurchaseOrderSchema = z.object({
  stage_role: z.nativeEnum(stage_role),
  details: z.array(RejectPurchaseOrderDetailSchema).min(1),
});

export class RejectPurchaseOrderDto extends createZodDto(RejectPurchaseOrderSchema) {}

// ==================== Review PO ====================

export const ReviewPurchaseOrderDetailSchema = z.object({
  id: z.string().uuid(),
  stage_status: z.nativeEnum(stage_status),
  stage_message: z.string().nullable(),
});

export const ReviewPurchaseOrderSchema = z.object({
  stage_role: z.nativeEnum(stage_role),
  des_stage: z.string().nullable(),
  details: z.array(ReviewPurchaseOrderDetailSchema).min(1),
});

export class ReviewPurchaseOrderDto extends createZodDto(ReviewPurchaseOrderSchema) {}

// ==================== Swagger Examples ====================

export const EXAMPLE_APPROVE_PO = {
  stage_role: 'approve',
  details: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      stage_status: 'approve',
    },
  ],
};

export const EXAMPLE_SAVE_PO_CREATE = {
  stage_role: 'create',
  details: {
    description: 'Monthly kitchen supplies order',
    order_date: '2026-03-19T00:00:00.000Z',
    delivery_date: '2026-03-25T00:00:00.000Z',
    vendor_id: 'e0363f5a-3637-4d27-a421-8693550aa816',
    currency_id: '93dabe25-1668-4c5b-bceb-3e0b83b78002',
    workflow_id: '0e90eca7-dba7-43da-ad09-f710b17827a7',
    exchange_rate: 1,
    email: 'procurement@hotel.com',
    buyer_name: 'John Doe',
    remarks: 'Urgent order',
    po_type: 'manual',
    purchase_order_detail: {
      add: [
        {
          sequence: 1,
          description: 'Extra virgin olive oil',
          product_id: '014d9777-d7c4-45ea-8a2e-d14e0f7e8951',
          order_qty: 10,
          order_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
          order_unit_conversion_factor: 1,
          base_qty: 10,
          base_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
          price: 250,
          sub_total_price: 2500,
          is_foc: false,
          tax_rate: 7,
          tax_amount: 175,
          discount_rate: 0,
          discount_amount: 0,
          net_amount: 2500,
          total_price: 2675,
          locations: [
            {
              location_id: '0731acf1-e04d-4648-b64d-cfbd34fa5d08',
              order_qty: 4,
            },
            {
              location_id: '9c36f107-7b5d-491d-bc95-fcc2823303f9',
              order_qty: 6,
            },
          ],
        },
      ],
    },
  },
};

export const EXAMPLE_SAVE_PO_APPROVE = {
  stage_role: 'approve',
  details: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      current_stage_status: 'approve',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      current_stage_status: 'approve',
    },
  ],
};

export const EXAMPLE_REJECT_PO = {
  stage_role: 'approve',
  details: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      stage_status: 'reject',
      stage_message: 'Price is too high, please renegotiate with vendor',
    },
  ],
};

export const EXAMPLE_REVIEW_PO = {
  stage_role: 'approve',
  des_stage: 'purchase',
  details: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      stage_status: 'review',
      stage_message: 'Please verify the delivery date with vendor',
    },
  ],
};
