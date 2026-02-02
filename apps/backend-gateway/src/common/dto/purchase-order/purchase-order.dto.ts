import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_purchase_order_doc_status, PrismaClient } from '@repo/prisma-shared-schema-tenant';

export const purchaseOrderDetail = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  exchange_rate: z.number().optional(),
  order_qty: z.number().optional(),
  order_unit_id: z.string().uuid().optional(),
  base_qty: z.number().optional(),
  base_unit_id: z.string().uuid().optional(),
  unit_price: z.number().optional(),
  sub_total_price: z.number().optional(),
  base_sub_total_price: z.number().optional(),
  is_foc: z.boolean().optional(),
  is_tax_included: z.boolean().optional(),
  tax_rate: z.number().optional(),
  tax_amount: z.number().optional(),
  discount_rate: z.number().optional(),
  discount_amount: z.number().optional(),
  net_amount: z.number().optional(),
  base_net_amount: z.number().optional(),
  total_price: z.number().optional(),
  base_total_price: z.number().optional(),
  info: z.any().optional(),
  history: z.any().optional(),
});

export const PurchaseOrderCreate = z.object({
  name: z.string(),
  purchase_order_status: z
    .nativeEnum(enum_purchase_order_doc_status)
    .optional(),
  description: z.string().optional(),
  order_date: z.date().optional(),
  delivery_date: z.date().optional(),
  vendor_id: z.string().uuid().optional(),
  currency_id: z.string().uuid().optional(),
  base_currency_id: z.string().uuid().optional(),
  exchange_rate: z.number().optional(),
  notes: z.string().optional(),
  approval_date: z.date().optional(),
  email: z.string().email().optional(),
  buyer_name: z.string().optional(),
  credit_term: z.number().optional(),
  remarks: z.string().optional(),
  info: z.any().optional(),
  history: z.any().optional(),
  doc_version: z.number().optional(),
  purchase_order_detail: purchaseOrderDetail.optional(),
});

export type PurchaseOrderCreateModel = z.infer<typeof PurchaseOrderCreate>;

export class PurchaseOrderCreateDto extends createZodDto(PurchaseOrderCreate) {}

export const PurchaseOrderUpdate = z.object({
  name: z.string(),
  purchase_order_status: z
    .nativeEnum(enum_purchase_order_doc_status)
    .optional(),
  description: z.string().optional(),
  order_date: z.date().optional(),
  delivery_date: z.date().optional(),
  vendor_id: z.string().uuid().optional(),
  currency_id: z.string().uuid().optional(),
  base_currency_id: z.string().uuid().optional(),
  exchange_rate: z.number().optional(),
  notes: z.string().optional(),
  approval_date: z.date().optional(),
  email: z.string().email().optional(),
  buyer_name: z.string().optional(),
  credit_term: z.number().optional(),
  remarks: z.string().optional(),
  info: z.any().optional(),
  history: z.any().optional(),
  doc_version: z.number().optional(),
  purchase_order_detail: purchaseOrderDetail.optional(),
});

export type PurchaseOrderUpdateModel = z.infer<typeof PurchaseOrderUpdate> & {
  id: string;
};

export class PurchaseOrderUpdateDto extends createZodDto(PurchaseOrderUpdate) {}

