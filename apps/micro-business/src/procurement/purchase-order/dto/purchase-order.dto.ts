import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_purchase_order_doc_status, PrismaClient } from '@repo/prisma-shared-schema-tenant';

// Import validate functions
import {
  validateVendorIdExists,
  validateVendorIdsExist,
} from '@/common/validate/vendor.validate';

import {
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
} from '@/common/validate/currency.validate';

import {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '@/common/validate/unit.validate';

import {
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
} from '@/common/validate/datetime.validate';

// Re-export validate functions for use with PurchaseOrder
export {
  validateVendorIdExists,
  validateVendorIdsExist,
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
  validateUnitIdExists,
  validateUnitIdsExist,
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
};

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

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Helper function to validate purchase order detail items
 */
async function validatePurchaseOrderDetailItem(
  prisma: PrismaClient,
  data: z.infer<typeof purchaseOrderDetail> | undefined,
  ctx: z.RefinementCtx,
  basePath: string[],
) {
  if (!data) return;

  // Validate order_unit_id
  if (data.order_unit_id) {
    const unit = await validateUnitIdExists(prisma, data.order_unit_id);
    if (!unit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Order unit not found',
        path: [...basePath, 'order_unit_id'],
      });
    }
  }

  // Validate base_unit_id
  if (data.base_unit_id) {
    const unit = await validateUnitIdExists(prisma, data.base_unit_id);
    if (!unit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Base unit not found',
        path: [...basePath, 'base_unit_id'],
      });
    }
  }
}

/**
 * Create PurchaseOrderCreate schema with async database validation
 */
export function createPurchaseOrderCreateValidation(prisma: PrismaClient) {
  return PurchaseOrderCreate.superRefine(async (data, ctx) => {
    // Validate vendor_id
    if (data.vendor_id) {
      const vendor = await validateVendorIdExists(prisma, data.vendor_id);
      if (!vendor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vendor not found',
          path: ['vendor_id'],
        });
      }
    }

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

    // Validate base_currency_id
    if (data.base_currency_id) {
      const currency = await validateCurrencyIdExists(prisma, data.base_currency_id);
      if (!currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Base currency not found',
          path: ['base_currency_id'],
        });
      }
    }

    // Validate purchase_order_detail
    await validatePurchaseOrderDetailItem(
      prisma,
      data.purchase_order_detail,
      ctx,
      ['purchase_order_detail'],
    );
  });
}

/**
 * Create PurchaseOrderUpdate schema with async database validation
 */
export function createPurchaseOrderUpdateValidation(prisma: PrismaClient) {
  return PurchaseOrderUpdate.superRefine(async (data, ctx) => {
    // Validate vendor_id
    if (data.vendor_id) {
      const vendor = await validateVendorIdExists(prisma, data.vendor_id);
      if (!vendor) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Vendor not found',
          path: ['vendor_id'],
        });
      }
    }

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

    // Validate base_currency_id
    if (data.base_currency_id) {
      const currency = await validateCurrencyIdExists(prisma, data.base_currency_id);
      if (!currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Base currency not found',
          path: ['base_currency_id'],
        });
      }
    }

    // Validate purchase_order_detail
    await validatePurchaseOrderDetailItem(
      prisma,
      data.purchase_order_detail,
      ctx,
      ['purchase_order_detail'],
    );
  });
}
