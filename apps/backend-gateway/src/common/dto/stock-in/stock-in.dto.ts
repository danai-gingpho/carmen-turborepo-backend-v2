import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_doc_status } from '@repo/prisma-shared-schema-tenant';
import { EmbeddedProductSchema, EmbeddedWorkflowSchema, InfoSchema } from '../embedded.dto';

// Stock In Detail Schema with denormalized fields
const StockInDetailBaseSchema = z.object({
  id: z.string().uuid(),
  stock_in_id: z.string().uuid(),
  inventory_transaction_id: z.string().uuid().optional().nullable(),
  sequence_no: z.number().int().optional().default(1),
  description: z.string().optional().nullable(),
  qty: z.number().optional().default(0),
  cost_per_unit: z.number().optional().default(0),
  total_cost: z.number().optional().default(0),
  note: z.string().optional().nullable(),
  // Denormalized product fields (populated by service)
  product_name: z.string().optional().nullable(),
  product_local_name: z.string().optional().nullable(),
})
  .merge(EmbeddedProductSchema)
  .merge(InfoSchema);

// Stock In Schema
export const StockInSchema = z.object({
  id: z.string().uuid(),
  si_date: z.coerce.date().optional().nullable(),
  si_no: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  adjustment_type_id: z.string().uuid().optional().nullable(),
  adjustment_type_code: z.string().optional().nullable(),
  doc_status: z.enum(Object.values(enum_doc_status) as [string, ...string[]]).optional().default('draft'),
  location_id: z.string().uuid().optional().nullable(),
  location_code: z.string().optional().nullable(),
  location_name: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  doc_version: z.number().int().optional().default(0),
})
  .merge(EmbeddedWorkflowSchema)
  .merge(InfoSchema);

// Stock In Detail Create Schema
export const StockInDetailCreate = StockInDetailBaseSchema.omit({
  id: true,
  stock_in_id: true,
  inventory_transaction_id: true,
  sequence_no: true,
}).extend({
  product_id: z.string().uuid(),
  qty: z.number(),
  cost_per_unit: z.number(),
  total_cost: z.number(),
});

export type IStockInDetailCreate = z.infer<typeof StockInDetailCreate>;

// Detail object schema (reusable)
const StockInDetailObj = z.object({
  add: z.array(StockInDetailCreate).min(1),
});

// Stock In Create Schema
export const StockInCreate = StockInSchema.omit({
  id: true,
  si_no: true,
  doc_version: true,
}).extend({
  adjustment_type_id: z.string().uuid(),
  location_id: z.string().uuid(),
  stock_in_detail: StockInDetailObj,
  details: StockInDetailObj.optional(),
}).transform((data) => {
  const { details, ...rest } = data;
  if (details && !rest.stock_in_detail) {
    rest.stock_in_detail = details;
  }
  return rest;
});

export type IStockInCreate = z.infer<typeof StockInCreate>;

export class StockInCreateDto extends createZodDto(StockInCreate) { }

// Stock In Detail Update Schema
export const StockInDetailUpdate = StockInDetailBaseSchema.omit({
  stock_in_id: true,
  inventory_transaction_id: true,
}).partial().extend({
  id: z.string().uuid(),
});

export type IStockInDetailUpdate = z.infer<typeof StockInDetailUpdate>;

// Stock In Update Detail object schema
const StockInUpdateDetailObj = z.object({
  add: z.array(StockInDetailCreate).optional(),
  update: z.array(StockInDetailUpdate).optional(),
  remove: z.array(z.object({ id: z.string().uuid() })).optional(),
});

// Stock In Update Schema
export const StockInUpdate = z.object({
  si_date: z.coerce.date().optional().nullable(),
  description: z.string().optional().nullable(),
  adjustment_type_id: z.string().uuid().optional().nullable(),
  adjustment_type_code: z.string().optional().nullable(),
  doc_status: z.enum(Object.values(enum_doc_status) as [string, ...string[]]).optional(),
  location_id: z.string().uuid().optional().nullable(),
  location_code: z.string().optional().nullable(),
  location_name: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  info: z.any().optional(),
  dimension: z.any().optional(),
  stock_in_detail: StockInUpdateDetailObj.optional(),
  details: StockInUpdateDetailObj.optional(),
}).transform((data) => {
  const { details, ...rest } = data;
  if (details && !rest.stock_in_detail) {
    rest.stock_in_detail = details;
  }
  return rest;
});

export type IStockInUpdate = z.infer<typeof StockInUpdate> & { id: string };

export class StockInUpdateDto extends createZodDto(StockInUpdate) { }

// Stock In Detail DTOs (for standalone detail CRUD endpoints)
export class StockInDetailCreateDto extends createZodDto(StockInDetailCreate) { }
export class StockInDetailUpdateDto extends createZodDto(StockInDetailUpdate) { }
