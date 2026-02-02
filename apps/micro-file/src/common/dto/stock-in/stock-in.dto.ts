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

export {
  validateProductIdExists,
  validateLocationIdExists,
  validateWorkflowIdExists,
};

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
  // Denormalized location fields (populated by service)
  location_code: z.string().optional().nullable(),
  location_name: z.string().optional().nullable(),
})
.merge(EmbeddedProductSchema)
.merge(EmbeddedLocationSchema)
.merge(InfoSchema);

// Stock In Schema
export const StockInSchema = z.object({
  id: z.string().uuid(),
  si_no: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  adjustment_type_id: z.string().uuid().optional().nullable(),
  adjustment_type_code: z.string().optional().nullable(),
  doc_status: z.enum(Object.values(enum_doc_status) as [string, ...string[]]).optional().default('draft'),
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
});

export type IStockInDetailCreate = z.infer<typeof StockInDetailCreate>;

// Stock In Create Schema
export const StockInCreate = StockInSchema.omit({
  id: true,
  si_no: true,
  doc_version: true,
}).extend({
  stock_in_detail: z.object({
    add: z.array(StockInDetailCreate).optional(),
  }).optional(),
});

export type IStockInCreate = z.infer<typeof StockInCreate>;

export class StockInCreateDto extends createZodDto(StockInCreate) {}

// Stock In Detail Update Schema
export const StockInDetailUpdate = StockInDetailBaseSchema.omit({
  stock_in_id: true,
  inventory_transaction_id: true,
}).partial().extend({
  id: z.string().uuid(),
});

export type IStockInDetailUpdate = z.infer<typeof StockInDetailUpdate>;

// Stock In Update Schema
export const StockInUpdate = z.object({
  description: z.string().optional().nullable(),
  adjustment_type_id: z.string().uuid().optional().nullable(),
  adjustment_type_code: z.string().optional().nullable(),
  doc_status: z.enum(Object.values(enum_doc_status) as [string, ...string[]]).optional(),
  // workflow_id: z.string().uuid().optional().nullable(),
  note: z.string().optional().nullable(),
  info: z.any().optional(),
  dimension: z.any().optional(),
  stock_in_detail: z.object({
    add: z.array(StockInDetailCreate).optional(),
    update: z.array(StockInDetailUpdate).optional(),
    remove: z.array(z.object({ id: z.string().uuid() })).optional(),
  }).optional(),
});

export type IStockInUpdate = z.infer<typeof StockInUpdate> & { id: string };

export class StockInUpdateDto extends createZodDto(StockInUpdate) {}

// Factory Functions for Async Validation

async function validateStockInDetailItems(
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

export function createStockInCreateValidation(prisma: PrismaClient) {
  return StockInCreate.superRefine(async (data, ctx) => {
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

    await validateStockInDetailItems(
      prisma,
      data.stock_in_detail?.add,
      ctx,
      ['stock_in_detail', 'add'],
    );
  });
}

export function createStockInUpdateValidation(prisma: PrismaClient) {
  return StockInUpdate.superRefine(async (data, ctx) => {
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

    await validateStockInDetailItems(
      prisma,
      data.stock_in_detail?.add,
      ctx,
      ['stock_in_detail', 'add'],
    );

    await validateStockInDetailItems(
      prisma,
      data.stock_in_detail?.update,
      ctx,
      ['stock_in_detail', 'update'],
    );
  });
}
