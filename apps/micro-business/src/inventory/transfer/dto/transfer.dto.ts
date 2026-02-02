import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// ==================== Transfer Create ====================
export const TransferCreateSchema = z.object({
  tr_no: z.string().optional().nullable(),
  tr_date: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
  doc_status: z.string().optional().nullable(),
  from_location_id: z.string().uuid().optional().nullable(),
  from_location_code: z.string().optional().nullable(),
  from_location_name: z.string().optional().nullable(),
  to_location_id: z.string().uuid().optional().nullable(),
  to_location_code: z.string().optional().nullable(),
  to_location_name: z.string().optional().nullable(),
  // workflow_id: z.string().uuid().optional().nullable(),
  // workflow_name: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(),
  dimension: z.any().optional().nullable(),
  details: z.array(z.object({
    product_id: z.string().uuid(),
    product_name: z.string().optional().nullable(),
    product_local_name: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    qty: z.number().optional().nullable(),
    cost_per_unit: z.number().optional().nullable(),
    total_cost: z.number().optional().nullable(),
    note: z.string().optional().nullable(),
    info: z.any().optional().nullable(),
    dimension: z.any().optional().nullable(),
  })).optional().nullable(),
});

export class TransferCreateDto extends createZodDto(TransferCreateSchema) {}
export type ITransferCreate = z.infer<typeof TransferCreateSchema>;

// ==================== Transfer Update ====================
export const TransferUpdateSchema = z.object({
  id: z.string().uuid(),
  tr_no: z.string().optional().nullable(),
  tr_date: z.string().datetime().optional().nullable(),
  description: z.string().optional().nullable(),
  doc_status: z.string().optional().nullable(),
  from_location_id: z.string().uuid().optional().nullable(),
  from_location_code: z.string().optional().nullable(),
  from_location_name: z.string().optional().nullable(),
  to_location_id: z.string().uuid().optional().nullable(),
  to_location_code: z.string().optional().nullable(),
  to_location_name: z.string().optional().nullable(),
  // workflow_id: z.string().uuid().optional().nullable(),
  // workflow_name: z.string().optional().nullable(),
  // workflow_history: z.any().optional().nullable(),
  // workflow_current_stage: z.string().optional().nullable(),
  // workflow_previous_stage: z.string().optional().nullable(),
  // workflow_next_stage: z.string().optional().nullable(),
  // user_action: z.any().optional().nullable(),
  // last_action: z.string().optional().nullable(),
  // last_action_at_date: z.string().datetime().optional().nullable(),
  // last_action_by_id: z.string().uuid().optional().nullable(),
  // last_action_by_name: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(),
  dimension: z.any().optional().nullable(),
});

export class TransferUpdateDto extends createZodDto(TransferUpdateSchema) {}
export type ITransferUpdate = z.infer<typeof TransferUpdateSchema>;

// ==================== Transfer Detail Create ====================
export const TransferDetailCreateSchema = z.object({
  transfer_id: z.string().uuid().optional(),
  product_id: z.string().uuid(),
  product_name: z.string().optional().nullable(),
  product_local_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  qty: z.number().optional().nullable(),
  cost_per_unit: z.number().optional().nullable(),
  total_cost: z.number().optional().nullable(),
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(),
  dimension: z.any().optional().nullable(),
});

export class TransferDetailCreateDto extends createZodDto(TransferDetailCreateSchema) {}
export type ITransferDetailCreate = z.infer<typeof TransferDetailCreateSchema>;

// ==================== Transfer Detail Update ====================
export const TransferDetailUpdateSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  product_name: z.string().optional().nullable(),
  product_local_name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  qty: z.number().optional().nullable(),
  cost_per_unit: z.number().optional().nullable(),
  total_cost: z.number().optional().nullable(),
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(),
  dimension: z.any().optional().nullable(),
});

export class TransferDetailUpdateDto extends createZodDto(TransferDetailUpdateSchema) {}
export type ITransferDetailUpdate = z.infer<typeof TransferDetailUpdateSchema>;
