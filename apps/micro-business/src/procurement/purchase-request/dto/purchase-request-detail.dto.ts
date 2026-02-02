import { ApproveQuantityAndUnitSchema, EmbeddedCurrencySchema, EmbeddedDiscountSchema, EmbeddedInventorySchema, EmbeddedLocationSchema, EmbeddedPriceListSchema, EmbeddedProductSchema, EmbeddedTaxSchema, EmbeddedVendorSchema, FocSchema, PriceSchema, RequestedQuantityAndUnitSchema, ValidateSchema } from '@/common/dto/embedded.dto';
import { z } from 'zod'
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

// Define state_status here to avoid circular dependency
export enum state_status {
  submit = 'submit',
  pending = 'pending',
  approve = 'approve',
  reject = 'reject',
  review = 'review',
}

// Import validate functions
import {
  validateProductIdExists,
  validateProductIdsExist,
} from '@/common/validate/product.validate';

import {
  validateLocationIdExists,
  validateLocationIdsExist,
} from '@/common/validate/location.validate';

import {
  validateDeliveryPointIdExists,
  validateDeliveryPointIdsExist,
} from '@/common/validate/delivery-point.validate';

import {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '@/common/validate/unit.validate';

import {
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
} from '@/common/validate/currency.validate';

import {
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
} from '@/common/validate/tax-profile.validate';

import {
  validateVendorIdExists,
  validateVendorIdsExist,
} from '@/common/validate/vendor.validate';

import {
  validatePriceListIdExists,
  validatePriceListIdsExist,
} from '@/common/validate/price-list.validate';

// Re-export validate functions for use with PurchaseRequestDetail
export {
  validateProductIdExists,
  validateProductIdsExist,
  validateLocationIdExists,
  validateLocationIdsExist,
  validateDeliveryPointIdExists,
  validateDeliveryPointIdsExist,
  validateUnitIdExists,
  validateUnitIdsExist,
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
  validateVendorIdExists,
  validateVendorIdsExist,
  validatePriceListIdExists,
  validatePriceListIdsExist,
};

/* create pr's detail */

export const CreatePurchaseRequestDetailSchema = z.object({
  description: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  current_stage_status: z.nativeEnum(state_status).optional(),
})
  .merge(EmbeddedProductSchema)
  .merge(EmbeddedLocationSchema.extend({
    delivery_point_id: ValidateSchema.shape.uuid.optional(),
    delivery_date: ValidateSchema.shape.date.optional(),
  }))
  .merge(RequestedQuantityAndUnitSchema)
  .merge(EmbeddedCurrencySchema)
  .merge(FocSchema)
  .merge(EmbeddedCurrencySchema)
  .merge(EmbeddedInventorySchema);

/*
  approve pr's detail by other Role
*/
export const ApprovePurchaseRequestDetailSchema = z.object({
  id: ValidateSchema.shape.uuid,
  description: z.string().optional().nullable(),
  stage_status: z.nativeEnum(state_status),
  stage_message: z.string().nullable(),
  current_stage_status: z.nativeEnum(state_status).optional(),
})
  .merge(ApproveQuantityAndUnitSchema)

// Approve By Purchase Role

export const PurchaseRoleApprovePurchaseRequestDetailSchema = ApprovePurchaseRequestDetailSchema
  .merge(EmbeddedTaxSchema)
  .merge(EmbeddedDiscountSchema)
  .merge(EmbeddedCurrencySchema)
  .merge(EmbeddedVendorSchema)
  .merge(PriceSchema)
  .merge(FocSchema)
  .merge(EmbeddedPriceListSchema)

/*
  other state change
*/
export const StateChangeSchema = z.object({
  id: ValidateSchema.shape.uuid,
  stage_status: z.nativeEnum(state_status),
  stage_message: z.string().nullable(),
})

export type PurchaseRoleApprovePurchaseRequestDetail = z.infer<typeof PurchaseRoleApprovePurchaseRequestDetailSchema>

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create CreatePurchaseRequestDetailSchema with async database validation
 */
export function createPurchaseRequestDetailCreateValidation(prisma: PrismaClient) {
  return CreatePurchaseRequestDetailSchema.superRefine(async (data, ctx) => {
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

    // Validate location_id
    if (data.location_id) {
      const location = await validateLocationIdExists(prisma, data.location_id);
      if (!location) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Location not found',
          path: ['location_id'],
        });
      }
    }

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

    // Validate requested_unit_id
    if (data.requested_unit_id) {
      const unit = await validateUnitIdExists(prisma, data.requested_unit_id);
      if (!unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Requested unit not found',
          path: ['requested_unit_id'],
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

    // Validate foc_unit_id
    if (data.foc_unit_id) {
      const unit = await validateUnitIdExists(prisma, data.foc_unit_id);
      if (!unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'FOC unit not found',
          path: ['foc_unit_id'],
        });
      }
    }

    // Validate inventory_unit_id
    if (data.inventory_unit_id) {
      const unit = await validateUnitIdExists(prisma, data.inventory_unit_id);
      if (!unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Inventory unit not found',
          path: ['inventory_unit_id'],
        });
      }
    }
  });
}

/**
 * Create ApprovePurchaseRequestDetailSchema with async database validation
 */
export function createApprovePurchaseRequestDetailValidation(prisma: PrismaClient) {
  return ApprovePurchaseRequestDetailSchema.superRefine(async (data, ctx) => {
    // Validate approved_unit_id
    if (data.approved_unit_id) {
      const unit = await validateUnitIdExists(prisma, data.approved_unit_id);
      if (!unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Approved unit not found',
          path: ['approved_unit_id'],
        });
      }
    }
  });
}

/**
 * Create PurchaseRoleApprovePurchaseRequestDetailSchema with async database validation
 */
export function createPurchaseRoleApprovePurchaseRequestDetailValidation(prisma: PrismaClient) {
  return PurchaseRoleApprovePurchaseRequestDetailSchema.superRefine(async (data, ctx) => {
    // Validate approved_unit_id
    if (data.approved_unit_id) {
      const unit = await validateUnitIdExists(prisma, data.approved_unit_id);
      if (!unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Approved unit not found',
          path: ['approved_unit_id'],
        });
      }
    }

    // Validate tax_profile_id
    if (data.tax_profile_id) {
      const taxProfile = await validateTaxProfileIdExists(prisma, data.tax_profile_id);
      if (!taxProfile) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Tax profile not found',
          path: ['tax_profile_id'],
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

    // Validate pricelist_detail_id
    if (data.pricelist_detail_id) {
      const priceList = await validatePriceListIdExists(prisma, data.pricelist_detail_id);
      if (!priceList) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Price list detail not found',
          path: ['pricelist_detail_id'],
        });
      }
    }
  });
}