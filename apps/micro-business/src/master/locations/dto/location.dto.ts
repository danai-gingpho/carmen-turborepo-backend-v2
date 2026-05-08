import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_location_type, PrismaClient } from '@repo/prisma-shared-schema-tenant';

// Import validate functions
import {
  validateDeliveryPointIdExists,
  validateDeliveryPointIdsExist,
} from '@/common/validate/delivery-point.validate';

import {
  validateProductIdExists,
  validateProductIdsExist,
} from '@/common/validate/product.validate';

// Re-export validate functions for use with Location
export {
  validateDeliveryPointIdExists,
  validateDeliveryPointIdsExist,
  validateProductIdExists,
  validateProductIdsExist,
};

export const location_info = z.object({
  floor: z.number().optional(),
  building: z.string().optional(),
  capacity: z.number().optional(),
  responsibleDepartment: z.string().optional(),
  itemCount: z.number().optional(),
  lastCount: z.string().optional(),
});

export const LocationCreate = z.object({
  code: z.string(),
  name: z.string(),
  location_type: z.enum(
    Object.values(enum_location_type) as [string, ...string[]],
  ),
  description: z.string().optional(),
  is_active: z.boolean().default(true).nullable().optional(),
  delivery_point_id: z.string().uuid({ message: 'delivery_point_id is required' }),
  info: location_info.optional(),
  users: z
    .object({
      add: z
        .array(
          z.object({
            id: z.string().uuid(),
          }),
        )
        .optional(),
    })
    .optional(),
  products: z
    .object({
      add: z
        .array(
          z.object({
            id: z.string().uuid(),
            min_qty: z.number().optional(),
            max_qty: z.number().optional(),
            re_order_qty: z.number().optional(),
            par_qty: z.number().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type ICreateLocation = z.infer<typeof LocationCreate>;
export class LocationCreateDto extends createZodDto(LocationCreate) {}

export const LocationUpdate = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  location_type: z
    .enum(Object.values(enum_location_type) as [string, ...string[]])
    .optional(),
  delivery_point_id: z.string().uuid({ message: 'delivery_point_id is required' }),
  info: location_info.optional(),
  users: z
    .object({
      add: z
        .array(
          z.object({
            id: z.string().uuid(),
          }),
        )
        .optional(),
      remove: z
        .array(
          z.object({
            id: z.string().uuid(),
          }),
        )
        .optional(),
    })
    .optional(),
  products: z
    .object({
      add: z
        .array(
          z.object({
            id: z.string().uuid(),
            min_qty: z.number().optional(),
            max_qty: z.number().optional(),
            re_order_qty: z.number().optional(),
            par_qty: z.number().optional(),
          }),
        )
        .optional(),
      update: z
        .array(
          z.object({
            id: z.string().uuid(),
            min_qty: z.number().optional(),
            max_qty: z.number().optional(),
            re_order_qty: z.number().optional(),
            par_qty: z.number().optional(),
          }),
        )
        .optional(),
      remove: z
        .array(
          z.object({
            id: z.string().uuid(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type IUpdateLocation = z.infer<typeof LocationUpdate> & { id: string };
export class LocationUpdateDto extends createZodDto(LocationUpdate) {}

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create LocationCreate schema with async database validation
 */
export function createLocationCreateValidation(prisma: PrismaClient) {
  return LocationCreate.superRefine(async (data, ctx) => {
    // Validate delivery_point_id
    if (data.delivery_point_id) {
      const deliveryPoint = await validateDeliveryPointIdExists(prisma, data.delivery_point_id);
      if (!deliveryPoint) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Delivery point not found',
          path: ['delivery_point_id'],
        });
      }
    }

    // Batch validate products
    if (data.products?.add && data.products.add.length > 0) {
      const productIds = data.products.add.map((p) => p.id).filter(Boolean);
      const existingProducts = await prisma.tb_product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingProducts.map((p) => p.id));

      for (let i = 0; i < data.products.add.length; i++) {
        if (!existingIds.has(data.products.add[i].id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Product not found',
            path: ['products', 'add', i, 'id'],
          });
        }
      }
    }
  });
}

/**
 * Create LocationUpdate schema with async database validation
 */
export function createLocationUpdateValidation(prisma: PrismaClient) {
  return LocationUpdate.superRefine(async (data, ctx) => {
    // Validate delivery_point_id
    if (data.delivery_point_id) {
      const deliveryPoint = await validateDeliveryPointIdExists(prisma, data.delivery_point_id);
      if (!deliveryPoint) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Delivery point not found',
          path: ['delivery_point_id'],
        });
      }
    }

    // Batch validate products.add + products.update in a single query
    const allProductIds: string[] = [
      ...(data.products?.add || []).map((p) => p.id),
      ...(data.products?.update || []).map((p) => p.id),
    ].filter(Boolean);

    if (allProductIds.length > 0) {
      const existingProducts = await prisma.tb_product.findMany({
        where: { id: { in: allProductIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingProducts.map((p) => p.id));

      if (data.products?.add) {
        for (let i = 0; i < data.products.add.length; i++) {
          if (!existingIds.has(data.products.add[i].id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Product not found',
              path: ['products', 'add', i, 'id'],
            });
          }
        }
      }

      if (data.products?.update) {
        for (let i = 0; i < data.products.update.length; i++) {
          if (!existingIds.has(data.products.update[i].id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Product not found',
              path: ['products', 'update', i, 'id'],
            });
          }
        }
      }
    }
  });
}
