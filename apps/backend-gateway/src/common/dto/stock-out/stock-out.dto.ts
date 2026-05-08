import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_doc_status } from '@repo/prisma-shared-schema-tenant';
import { EmbeddedProductSchema, EmbeddedWorkflowSchema, InfoSchema } from '../embedded.dto';

// Stock Out Detail Schema with denormalized fields
const StockOutDetailBaseSchema = z.object({
  id: z.string().uuid(),
  stock_out_id: z.string().uuid(),
  inventory_transaction_id: z.string().uuid().optional().nullable(),
  sequence_no: z.number().int().optional().default(1),
  description: z.string().optional().nullable(),
  qty: z.number().optional().default(0),
  note: z.string().optional().nullable(),
  // Denormalized product fields (populated by service)
  product_name: z.string().optional().nullable(),
  product_local_name: z.string().optional().nullable(),
})
  .merge(EmbeddedProductSchema)
  .merge(InfoSchema);

// Stock Out Schema
export const StockOutSchema = z.object({
  id: z.string().uuid(),
  so_date: z.coerce.date().optional().nullable(),
  so_no: z.string().optional().nullable(),
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

// Stock Out Detail Create Schema
export const StockOutDetailCreate = StockOutDetailBaseSchema.omit({
  id: true,
  stock_out_id: true,
  inventory_transaction_id: true,
  sequence_no: true,
}).extend({
  product_id: z.string().uuid(),
  qty: z.number(),
});

export type IStockOutDetailCreate = z.infer<typeof StockOutDetailCreate>;

// Detail object schema (reusable)
const StockOutDetailObj = z.object({
  add: z.array(StockOutDetailCreate).min(1),
});

// Stock Out Create Schema
export const StockOutCreate = StockOutSchema.omit({
  id: true,
  so_no: true,
  doc_version: true,
}).extend({
  adjustment_type_id: z.string().uuid(),
  location_id: z.string().uuid(),
  stock_out_detail: StockOutDetailObj,
  details: StockOutDetailObj.optional(),
}).transform((data) => {
  const { details, ...rest } = data;
  if (details && !rest.stock_out_detail) {
    rest.stock_out_detail = details;
  }
  return rest;
});

export type IStockOutCreate = z.infer<typeof StockOutCreate>;

export class StockOutCreateDto extends createZodDto(StockOutCreate) { }

// Stock Out Detail Update Schema
export const StockOutDetailUpdate = StockOutDetailBaseSchema.omit({
  stock_out_id: true,
  inventory_transaction_id: true,
}).partial().extend({
  id: z.string().uuid(),
});

export type IStockOutDetailUpdate = z.infer<typeof StockOutDetailUpdate>;

// Stock Out Update Detail object schema
const StockOutUpdateDetailObj = z.object({
  add: z.array(StockOutDetailCreate).optional(),
  update: z.array(StockOutDetailUpdate).optional(),
  remove: z.array(z.object({ id: z.string().uuid() })).optional(),
});

// Stock Out Update Schema
export const StockOutUpdate = z.object({
  so_date: z.coerce.date().optional().nullable(),
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
  stock_out_detail: StockOutUpdateDetailObj.optional(),
  details: StockOutUpdateDetailObj.optional(),
}).transform((data) => {
  const { details, ...rest } = data;
  if (details && !rest.stock_out_detail) {
    rest.stock_out_detail = details;
  }
  return rest;
});

export type IStockOutUpdate = z.infer<typeof StockOutUpdate> & { id: string };

export class StockOutUpdateDto extends createZodDto(StockOutUpdate) { }

// Stock Out Detail DTOs (for standalone detail CRUD endpoints)
export class StockOutDetailCreateDto extends createZodDto(StockOutDetailCreate) { }
export class StockOutDetailUpdateDto extends createZodDto(StockOutDetailUpdate) { }
