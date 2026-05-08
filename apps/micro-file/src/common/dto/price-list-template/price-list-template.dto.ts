import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';
import { InfoSchema, EmbeddedProductSchema } from '../embedded.dto';

// Import validate functions
import {
  validateProductIdExists,
  validateProductIdsExist,
} from '../../validate/product.validate';

import {
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
} from '../../validate/currency.validate';

import {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '../../validate/unit.validate';

// Re-export validate functions for use with PriceListTemplate
export {
  validateProductIdExists,
  validateProductIdsExist,
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
  validateUnitIdExists,
  validateUnitIdsExist,
};

export const PriceListTemplateStatusEnum = z.enum(['draft', 'active', 'inactive']);

export const PriceListTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  status: PriceListTemplateStatusEnum.optional().default('draft'),

  // Currency and validity
  currency_id: z.string().uuid().optional().nullable(),
  currency_name: z.string().optional().nullable(),
  validity_period: z.number().int().optional().nullable(), // number of days

  // Vendor instructions
  vendor_instructions: z.string().optional().nullable(),

  // Notification settings
  send_reminders: z.boolean().optional().default(false),
  reminder_days: z.array(z.number()).optional().default([]), // array of days before deadline
  escalation_after_days: z.number().int().optional().nullable(), // number of days after which to escalate

  doc_version: z.number().optional().default(0),
})
.merge(InfoSchema);

export const PriceListTemplateDetailSchema = z.object({
  id: z.string().uuid(),
  pricelist_template_id: z.string().uuid(),
  sequence_no: z.number().optional().default(1),
  product_name: z.string().optional().nullable(),
  array_order_unit: z.array(z.object({
    unit_id: z.string().uuid(),
    unit_name: z.string()
  })).optional().default([]),
  doc_version: z.number().optional().default(0),
})
.merge(EmbeddedProductSchema)
.merge(InfoSchema);

export const PriceListTemplateCreate = PriceListTemplateSchema.omit({
  id: true,
  doc_version: true,
});

export type IPriceListTemplateCreate = z.infer<typeof PriceListTemplateCreate>;

export class PriceListTemplateCreateDto extends createZodDto(PriceListTemplateCreate) {}

export const PriceListTemplateUpdate = PriceListTemplateSchema.partial();

export type IPriceListTemplateUpdate = z.infer<typeof PriceListTemplateUpdate> & {
  id: string;
};

export class PriceListTemplateUpdateDto extends createZodDto(
  PriceListTemplateUpdate,
) {}

export const PriceListTemplateDetailCreate = PriceListTemplateDetailSchema.omit({
  id: true,
  doc_version: true,
});

export type IPriceListTemplateDetailCreate = z.infer<typeof PriceListTemplateDetailCreate>;

export class PriceListTemplateDetailCreateDto extends createZodDto(PriceListTemplateDetailCreate) {}

export const PriceListTemplateDetailUpdate = PriceListTemplateDetailSchema.partial();

export type IPriceListTemplateDetailUpdate = z.infer<typeof PriceListTemplateDetailUpdate> & {
  id: string;
};

export class PriceListTemplateDetailUpdateDto extends createZodDto(
  PriceListTemplateDetailUpdate,
) {}

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create PriceListTemplateCreate schema with async database validation
 */
export function createPriceListTemplateCreateValidation(prisma: PrismaClient) {
  return PriceListTemplateCreate.superRefine(async (data, ctx) => {
    // Validate currency_id
    if (data.currency_id) {
      const currency = await validateCurrencyIdExists(prisma, data.currency_id);
      if (!currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Currency not found',
          path: ['currency_id'],
        });
      }
    }
  });
}

/**
 * Create PriceListTemplateUpdate schema with async database validation
 */
export function createPriceListTemplateUpdateValidation(prisma: PrismaClient) {
  return PriceListTemplateUpdate.superRefine(async (data, ctx) => {
    // Validate currency_id
    if (data.currency_id) {
      const currency = await validateCurrencyIdExists(prisma, data.currency_id);
      if (!currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Currency not found',
          path: ['currency_id'],
        });
      }
    }
  });
}

/**
 * Create PriceListTemplateDetailCreate schema with async database validation
 */
export function createPriceListTemplateDetailCreateValidation(prisma: PrismaClient) {
  return PriceListTemplateDetailCreate.superRefine(async (data, ctx) => {
    // Validate product_id
    if (data.product_id) {
      const product = await validateProductIdExists(prisma, data.product_id);
      if (!product) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product not found',
          path: ['product_id'],
        });
      }
    }

    // Validate array_order_unit
    if (data.array_order_unit) {
      for (let i = 0; i < data.array_order_unit.length; i++) {
        const orderUnit = data.array_order_unit[i];
        const unit = await validateUnitIdExists(prisma, orderUnit.unit_id);
        if (!unit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Unit not found',
            path: ['array_order_unit', i, 'unit_id'],
          });
        }
      }
    }
  });
}

/**
 * Create PriceListTemplateDetailUpdate schema with async database validation
 */
export function createPriceListTemplateDetailUpdateValidation(prisma: PrismaClient) {
  return PriceListTemplateDetailUpdate.superRefine(async (data, ctx) => {
    // Validate product_id
    if (data.product_id) {
      const product = await validateProductIdExists(prisma, data.product_id);
      if (!product) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Product not found',
          path: ['product_id'],
        });
      }
    }

    // Validate array_order_unit
    if (data.array_order_unit) {
      for (let i = 0; i < data.array_order_unit.length; i++) {
        const orderUnit = data.array_order_unit[i];
        const unit = await validateUnitIdExists(prisma, orderUnit.unit_id);
        if (!unit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Unit not found',
            path: ['array_order_unit', i, 'unit_id'],
          });
        }
      }
    }
  });
}
