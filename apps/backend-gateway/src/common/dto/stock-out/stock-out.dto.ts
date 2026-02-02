import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_doc_status, PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { EmbeddedLocationSchema, EmbeddedProductSchema, EmbeddedWorkflowSchema, InfoSchema } from '../embedded.dto';

import {
  validateProductIdExists,
} from '../../validate/product.validate';

import {
  validateLocationIdExists,
} from '../../validate/location.validate';

import {
  validateWorkflowIdExists,
} from '../../validate/workflow.validate';

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
  // Denormalized location fields (populated by service)
  location_code: z.string().optional().nullable(),
  location_name: z.string().optional().nullable(),
})
.merge(EmbeddedProductSchema)
.merge(EmbeddedLocationSchema)
.merge(InfoSchema);

// Stock Out Schema
export const StockOutSchema = z.object({
  id: z.string().uuid(),
  so_no: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  adjustment_type_id: z.string().uuid().optional().nullable(),
  adjustment_type_code: z.string().optional().nullable(),
  doc_status: z.enum(Object.values(enum_doc_status) as [string, ...string[]]).optional().default('draft'),
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
});

export type IStockOutDetailCreate = z.infer<typeof StockOutDetailCreate>;

// Stock Out Create Schema
export const StockOutCreate = StockOutSchema.omit({
  id: true,
  so_no: true,
  doc_version: true,
}).extend({
  stock_out_detail: z.object({
    add: z.array(StockOutDetailCreate).optional(),
  }).optional(),
});

export type IStockOutCreate = z.infer<typeof StockOutCreate>;

export class StockOutCreateDto extends createZodDto(StockOutCreate) {}

// Stock Out Detail Update Schema
export const StockOutDetailUpdate = StockOutDetailBaseSchema.omit({
  stock_out_id: true,
  inventory_transaction_id: true,
}).partial().extend({
  id: z.string().uuid(),
});

export type IStockOutDetailUpdate = z.infer<typeof StockOutDetailUpdate>;

// Stock Out Update Schema
export const StockOutUpdate = z.object({
  description: z.string().optional().nullable(),
  adjustment_type_id: z.string().uuid().optional().nullable(),
  adjustment_type_code: z.string().optional().nullable(),
  doc_status: z.enum(Object.values(enum_doc_status) as [string, ...string[]]).optional(),
  // workflow_id: z.string().uuid().optional().nullable(),
  note: z.string().optional().nullable(),
  info: z.any().optional(),
  dimension: z.any().optional(),
  stock_out_detail: z.object({
    add: z.array(StockOutDetailCreate).optional(),
    update: z.array(StockOutDetailUpdate).optional(),
    remove: z.array(z.object({ id: z.string().uuid() })).optional(),
  }).optional(),
});

export type IStockOutUpdate = z.infer<typeof StockOutUpdate> & { id: string };

export class StockOutUpdateDto extends createZodDto(StockOutUpdate) {}

// Factory Functions for Async Validation

async function validateStockOutDetailItems(
  prisma: PrismaClient,
  items: Array<{ product_id?: string; location_id?: string }> | undefined,
  ctx: z.RefinementCtx,
  basePath: string[],
) {
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.product_id) {
      const product = await validateProductIdExists(prisma, item.product_id);
      if (!product) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product not found',
          path: [...basePath, i.toString(), 'product_id'],
        });
      }
    }

    if (item.location_id) {
      const location = await validateLocationIdExists(prisma, item.location_id);
      if (!location) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location not found',
          path: [...basePath, i.toString(), 'location_id'],
        });
      }
    }
  }
}

export function createStockOutCreateValidation(prisma: PrismaClient) {
  return StockOutCreate.superRefine(async (data, ctx) => {
    // if (data.workflow_id) {
    //   const workflow = await validateWorkflowIdExists(prisma, data.workflow_id);
    //   if (!workflow) {
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       message: 'Workflow not found',
    //       path: ['workflow_id'],
    //     });
    //   }
    // }

    await validateStockOutDetailItems(
      prisma,
      data.stock_out_detail?.add,
      ctx,
      ['stock_out_detail', 'add'],
    );
  });
}

export function createStockOutUpdateValidation(prisma: PrismaClient) {
  return StockOutUpdate.superRefine(async (data, ctx) => {
    // if (data.workflow_id) {
    //   const workflow = await validateWorkflowIdExists(prisma, data.workflow_id);
    //   if (!workflow) {
    //     ctx.addIssue({
    //       code: z.ZodIssueCode.custom,
    //       message: 'Workflow not found',
    //       path: ['workflow_id'],
    //     });
    //   }
    // }

    await validateStockOutDetailItems(
      prisma,
      data.stock_out_detail?.add,
      ctx,
      ['stock_out_detail', 'add'],
    );

    await validateStockOutDetailItems(
      prisma,
      data.stock_out_detail?.update,
      ctx,
      ['stock_out_detail', 'update'],
    );
  });
}
