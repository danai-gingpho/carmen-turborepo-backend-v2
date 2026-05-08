import { z } from 'zod';
import { enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { stage_status } from '@/procurement/purchase-request/dto/purchase-request-detail.dto';
import { createZodDto } from 'nestjs-zod';
import { PurchaseOrderDetailSchema } from './create-purchase-order.dto';

// Approve PO Detail schema
export const ApprovePurchaseOrderDetailSchema = z.object({
  id: z.string().uuid(),
  stage_status: z.nativeEnum(stage_status),
});

// Approve PO schema
export const ApprovePurchaseOrderSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  details: z.array(ApprovePurchaseOrderDetailSchema).min(1),
});

export type ApprovePurchaseOrderDto = z.infer<typeof ApprovePurchaseOrderSchema>;
export type ApprovePurchaseOrderDetailDto = z.infer<typeof ApprovePurchaseOrderDetailSchema>;

export class ApprovePurchaseOrderDtoClass extends createZodDto(ApprovePurchaseOrderSchema) {}

// Save PO Detail schema - reuses create detail schema
const UpdateSavePurchaseOrderDetailSchema = PurchaseOrderDetailSchema.extend({
  id: z.string().uuid(),
});

// Save PO data schema (inside details) - for create role
export const SavePurchaseOrderDataSchema = z.object({
  // Header fields (all optional for save)
  vendor_id: z.string().uuid().optional(),
  vendor_name: z.string().optional(),
  delivery_date: z.string().optional(),
  currency_id: z.string().uuid().optional(),
  currency_code: z.string().optional(),
  exchange_rate: z.number().positive().optional(),
  description: z.string().optional(),
  order_date: z.string().optional(),
  credit_term_id: z.string().uuid().optional(),
  credit_term_name: z.string().optional(),
  credit_term_value: z.number().int().nonnegative().optional(),
  buyer_id: z.string().uuid().optional(),
  buyer_name: z.string().optional(),
  email: z.string().email().optional(),
  remarks: z.string().optional(),
  note: z.string().optional(),
  workflow_id: z.string().uuid().optional(),

  // Details with add/update/remove
  purchase_order_detail: z.object({
    add: z.array(PurchaseOrderDetailSchema).optional(),
    update: z.array(UpdateSavePurchaseOrderDetailSchema).optional(),
    remove: z.array(z.object({ id: z.string().uuid() })).optional(),
  }).optional(),
});

// Save PO detail schema - for approve/purchase role (flat array like submit/reject)
export const SavePurchaseOrderApproveDetailSchema = z.object({
  id: z.string().uuid(),
  current_stage_status: z.nativeEnum(stage_status).optional(),
});

// Save PO schema - stage_role + details (shape depends on role)
export const SavePurchaseOrderSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
   
  details: z.any(),
});

export type SavePurchaseOrderDto = z.infer<typeof SavePurchaseOrderSchema>;
export type SavePurchaseOrderDataDto = z.infer<typeof SavePurchaseOrderDataSchema>;
export type SavePurchaseOrderApproveDetailDto = z.infer<typeof SavePurchaseOrderApproveDetailSchema>;
export type SavePurchaseOrderDetailDto = z.infer<typeof PurchaseOrderDetailSchema>;

export class SavePurchaseOrderDtoClass extends createZodDto(SavePurchaseOrderSchema) {}

// Reject PO Detail schema
export const RejectPurchaseOrderDetailSchema = z.object({
  id: z.string().uuid(),
  stage_status: z.nativeEnum(stage_status),
  stage_message: z.string().nullable(),
});

// Reject PO schema
export const RejectPurchaseOrderSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  details: z.array(RejectPurchaseOrderDetailSchema).min(1),
});

export type RejectPurchaseOrderDto = z.infer<typeof RejectPurchaseOrderSchema>;
export type RejectPurchaseOrderDetailDto = z.infer<typeof RejectPurchaseOrderDetailSchema>;

export class RejectPurchaseOrderDtoClass extends createZodDto(RejectPurchaseOrderSchema) {}

// Review PO Detail schema
export const ReviewPurchaseOrderDetailSchema = z.object({
  id: z.string().uuid(),
  stage_status: z.nativeEnum(stage_status),
  stage_message: z.string().nullable(),
});

// Review PO schema
export const ReviewPurchaseOrderSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  des_stage: z.string().nullable(),
  details: z.array(ReviewPurchaseOrderDetailSchema).min(1),
});

export type ReviewPurchaseOrderDto = z.infer<typeof ReviewPurchaseOrderSchema>;
export type ReviewPurchaseOrderDetailDto = z.infer<typeof ReviewPurchaseOrderDetailSchema>;

export class ReviewPurchaseOrderDtoClass extends createZodDto(ReviewPurchaseOrderSchema) {}
