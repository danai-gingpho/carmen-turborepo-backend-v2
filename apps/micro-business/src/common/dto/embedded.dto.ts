import { z } from 'zod'
import { PrismaClient } from '@repo/prisma-shared-schema-tenant';

// Import validate functions
import {
  validateDepartmentIdExists,
  validateDepartmentIdsExist,
} from '@/common/validate/department.validate';

import {
  validateLocationIdExists,
  validateLocationIdsExist,
} from '@/common/validate/location.validate';

import {
  validateVendorIdExists,
  validateVendorIdsExist,
} from '@/common/validate/vendor.validate';

import {
  validateProductIdExists,
  validateProductIdsExist,
} from '@/common/validate/product.validate';

import {
  validateWorkflowIdExists,
  validateWorkflowIdsExist,
} from '@/common/validate/workflow.validate';

import {
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
} from '@/common/validate/currency.validate';

import {
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
} from '@/common/validate/tax-profile.validate';

import {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '@/common/validate/unit.validate';

import {
  validatePriceListIdExists,
  validatePriceListIdsExist,
} from '@/common/validate/price-list.validate';

import {
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
} from '@/common/validate/datetime.validate';

// Re-export validate functions for use with embedded schemas
export {
  validateDepartmentIdExists,
  validateDepartmentIdsExist,
  validateLocationIdExists,
  validateLocationIdsExist,
  validateVendorIdExists,
  validateVendorIdsExist,
  validateProductIdExists,
  validateProductIdsExist,
  validateWorkflowIdExists,
  validateWorkflowIdsExist,
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
  validateUnitIdExists,
  validateUnitIdsExist,
  validatePriceListIdExists,
  validatePriceListIdsExist,
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
};

export const ValidateSchema = z.object({
  quantity: z.number().int(),
  price: z.number().min(0), // allows 0 and positive numbers
  uuid: z.string().uuid(),
  date: z.string().datetime().pipe(z.coerce.date()),
  factor: z.number(), // for unit conversion
})

export const EmbeddedDepartmentSchema = z.object({
  department_id: ValidateSchema.shape.uuid.optional()
})

export const EmbeddedLocationSchema = z.object({
  location_id: ValidateSchema.shape.uuid.optional()
})

export const EmbeddedVendorSchema = z.object({
  vendor_id: ValidateSchema.shape.uuid.optional()
})

export const EmbeddedProductSchema = z.object({
  product_id: ValidateSchema.shape.uuid.optional(),
})

export const EmbeddedWorkflowSchema = z.object({
  workflow_id: ValidateSchema.shape.uuid.optional(),
})

export const EmbeddedCurrencySchema = z.object({
  currency_id: z.string().uuid().optional(),
  exchange_rate: z.number().optional(),
  exchange_rate_date: ValidateSchema.shape.date.optional(),
})

export const EmbeddedDiscountSchema = z.object({
  discount_rate: ValidateSchema.shape.factor.optional(),
  discount_amount: z.number().min(-1).optional(),
  is_discount_adjustment: z.boolean().optional(),
  base_discount_amount: ValidateSchema.shape.price.optional(),
})

export const EmbeddedTaxSchema = z.object({
  tax_profile_id: z.string().uuid().optional(),
  tax_profile_name: z.string().optional(),
  tax_rate: ValidateSchema.shape.price.optional(),
  tax_amount: ValidateSchema.shape.price.optional(),
  is_tax_adjustment: z.boolean(),
  base_tax_amount: ValidateSchema.shape.price.optional(),
  total_amount: ValidateSchema.shape.price.optional()
})

export const InfoSchema = z.object({
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(), // Accept any object
  dimension: z.any().optional().nullable(), // Accept any object
})

export const EmbeddedPriceListSchema = z.object({
  pricelist_detail_id: z.string().uuid(),
  pricelist_no: z.string().optional(),
  pricelist_price: ValidateSchema.shape.price.optional()
})

export const FocSchema = z.object({
  foc_qty: ValidateSchema.shape.quantity,
  foc_unit_id: z.string().uuid().optional(),
  foc_unit_conversion_rate: ValidateSchema.shape.price.optional(),
  foc_base_qty: ValidateSchema.shape.quantity.optional(),
})

export const ApproveQuantityAndUnitSchema = z.object({
  approved_qty: ValidateSchema.shape.quantity.optional(),
  approved_unit_id: ValidateSchema.shape.uuid.optional(),
  approved_base_qty: ValidateSchema.shape.quantity.optional(),
  approved_unit_conversion_factor: ValidateSchema.shape.factor.optional()
})

export const RequestedQuantityAndUnitSchema = z.object({
  requested_qty: ValidateSchema.shape.quantity.optional(),
  requested_unit_id: ValidateSchema.shape.uuid.optional(),
  requested_unit_conversion_factor: ValidateSchema.shape.factor.optional(),
})

export const OrderQuantityAndUnitSchema = z.object({
  order_qty: ValidateSchema.shape.quantity.optional(),
  order_unit_id: ValidateSchema.shape.uuid.optional(),
  order_base_qty: ValidateSchema.shape.quantity.optional(),
  order_unit_conversion_factor: ValidateSchema.shape.factor.optional(),
})

export const ReceivedQuantityAndUnitSchema = z.object({
  received_qty: ValidateSchema.shape.quantity.optional(),
  received_unit_id: ValidateSchema.shape.uuid.optional(),
  received_base_qty: ValidateSchema.shape.quantity.optional(),
  received_unit_conversion_factor: ValidateSchema.shape.factor.optional()
})

export const PriceSchema = z.object({
  total_price: ValidateSchema.shape.price.optional(),
  sub_total_price: ValidateSchema.shape.price.optional(),
  net_amount: ValidateSchema.shape.price.optional(),
  // price:  ValidateSchema.shape.price.optional(),

  base_sub_total_price: ValidateSchema.shape.price.optional(),
  base_total_price: ValidateSchema.shape.price.optional(),
  base_net_amount: ValidateSchema.shape.price.optional(),
  base_price: ValidateSchema.shape.price.optional(),
})

export const EmbeddedInventorySchema = z.object({
  inventory_unit_id: z.string().uuid().optional(),
});

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create EmbeddedDepartmentSchema with async database validation
 */
export function createEmbeddedDepartmentValidation(prisma: PrismaClient) {
  return EmbeddedDepartmentSchema.superRefine(async (data, ctx) => {
    if (data.department_id) {
      const department = await validateDepartmentIdExists(prisma, data.department_id);
      if (!department) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Department not found',
          path: ['department_id'],
        });
      }
    }
  });
}

/**
 * Create EmbeddedLocationSchema with async database validation
 */
export function createEmbeddedLocationValidation(prisma: PrismaClient) {
  return EmbeddedLocationSchema.superRefine(async (data, ctx) => {
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
  });
}

/**
 * Create EmbeddedVendorSchema with async database validation
 */
export function createEmbeddedVendorValidation(prisma: PrismaClient) {
  return EmbeddedVendorSchema.superRefine(async (data, ctx) => {
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
  });
}

/**
 * Create EmbeddedProductSchema with async database validation
 */
export function createEmbeddedProductValidation(prisma: PrismaClient) {
  return EmbeddedProductSchema.superRefine(async (data, ctx) => {
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
  });
}

/**
 * Create EmbeddedWorkflowSchema with async database validation
 */
export function createEmbeddedWorkflowValidation(prisma: PrismaClient) {
  return EmbeddedWorkflowSchema.superRefine(async (data, ctx) => {
    if (data.workflow_id) {
      const workflow = await validateWorkflowIdExists(prisma, data.workflow_id);
      if (!workflow) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Workflow not found',
          path: ['workflow_id'],
        });
      }
    }
  });
}

/**
 * Create EmbeddedCurrencySchema with async database validation
 */
export function createEmbeddedCurrencyValidation(prisma: PrismaClient) {
  return EmbeddedCurrencySchema.superRefine(async (data, ctx) => {
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
 * Create EmbeddedTaxSchema with async database validation
 */
export function createEmbeddedTaxValidation(prisma: PrismaClient) {
  return EmbeddedTaxSchema.superRefine(async (data, ctx) => {
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
  });
}

/**
 * Create EmbeddedPriceListSchema with async database validation
 */
export function createEmbeddedPriceListValidation(prisma: PrismaClient) {
  return EmbeddedPriceListSchema.superRefine(async (data, ctx) => {
    if (data.pricelist_detail_id) {
      const priceList = await validatePriceListIdExists(prisma, data.pricelist_detail_id);
      if (!priceList) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Price list not found',
          path: ['pricelist_detail_id'],
        });
      }
    }
  });
}

/**
 * Create FocSchema with async database validation (validates foc_unit_id)
 */
export function createFocValidation(prisma: PrismaClient) {
  return FocSchema.superRefine(async (data, ctx) => {
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
  });
}

/**
 * Create ApproveQuantityAndUnitSchema with async database validation
 */
export function createApproveQuantityAndUnitValidation(prisma: PrismaClient) {
  return ApproveQuantityAndUnitSchema.superRefine(async (data, ctx) => {
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
 * Create RequestedQuantityAndUnitSchema with async database validation
 */
export function createRequestedQuantityAndUnitValidation(prisma: PrismaClient) {
  return RequestedQuantityAndUnitSchema.superRefine(async (data, ctx) => {
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
  });
}

/**
 * Create OrderQuantityAndUnitSchema with async database validation
 */
export function createOrderQuantityAndUnitValidation(prisma: PrismaClient) {
  return OrderQuantityAndUnitSchema.superRefine(async (data, ctx) => {
    if (data.order_unit_id) {
      const unit = await validateUnitIdExists(prisma, data.order_unit_id);
      if (!unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Order unit not found',
          path: ['order_unit_id'],
        });
      }
    }
  });
}

/**
 * Create ReceivedQuantityAndUnitSchema with async database validation
 */
export function createReceivedQuantityAndUnitValidation(prisma: PrismaClient) {
  return ReceivedQuantityAndUnitSchema.superRefine(async (data, ctx) => {
    if (data.received_unit_id) {
      const unit = await validateUnitIdExists(prisma, data.received_unit_id);
      if (!unit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Received unit not found',
          path: ['received_unit_id'],
        });
      }
    }
  });
}