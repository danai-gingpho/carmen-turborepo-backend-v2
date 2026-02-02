import { z } from 'zod';

export const InventoryTransactionDetailResponseSchema = z.object({
  id: z.string(),
  transaction_type: z.string().nullable().optional(),
  transaction_date: z.coerce.date().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  qty: z.number().nullable().optional(),
  unit_id: z.string().nullable().optional(),
  unit_name: z.string().nullable().optional(),
  reference_id: z.string().nullable().optional(),
  reference_type: z.string().nullable().optional(),
  reference_no: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
});

export const InventoryTransactionListItemResponseSchema = z.object({
  id: z.string(),
  transaction_type: z.string().nullable().optional(),
  transaction_date: z.coerce.date().nullable().optional(),
  product_id: z.string().nullable().optional(),
  product_name: z.string().nullable().optional(),
  product_code: z.string().nullable().optional(),
  location_id: z.string().nullable().optional(),
  location_name: z.string().nullable().optional(),
  qty: z.number().nullable().optional(),
  unit_id: z.string().nullable().optional(),
  unit_name: z.string().nullable().optional(),
  reference_id: z.string().nullable().optional(),
  reference_type: z.string().nullable().optional(),
  reference_no: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
});

export const InventoryTransactionMutationResponseSchema = z.object({
  id: z.string(),
});

export type InventoryTransactionDetailResponse = z.infer<typeof InventoryTransactionDetailResponseSchema>;
export type InventoryTransactionListItemResponse = z.infer<typeof InventoryTransactionListItemResponseSchema>;
export type InventoryTransactionMutationResponse = z.infer<typeof InventoryTransactionMutationResponseSchema>;
