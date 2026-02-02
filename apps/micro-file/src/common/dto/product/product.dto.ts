import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_data_type, enum_product_status_type, PrismaClient } from '@repo/prisma-shared-schema-tenant';

// Import validate functions
import {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '../../validate/unit.validate';

import {
  validateProductItemGroupIdExists,
  validateProductItemGroupIdsExist,
} from '../../validate/product-item-group.validate';

import {
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
} from '../../validate/tax-profile.validate';

import {
  validateLocationIdExists,
  validateLocationIdsExist,
} from '../../validate/location.validate';

import {
  validateProductCategoryIdExists,
  validateProductCategoryIdsExist,
} from '../../validate/product-category.validate';

import {
  validateProductSubCategoryIdExists,
  validateProductSubCategoryIdsExist,
} from '../../validate/product-sub-category.validate';

// Re-export validate functions for use with Product
export {
  validateUnitIdExists,
  validateUnitIdsExist,
  validateProductItemGroupIdExists,
  validateProductItemGroupIdsExist,
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
  validateLocationIdExists,
  validateLocationIdsExist,
  validateProductCategoryIdExists,
  validateProductCategoryIdsExist,
  validateProductSubCategoryIdExists,
  validateProductSubCategoryIdsExist,
};

export const ProductCreate = z.object({
  name: z.string(),
  code: z.string(),
  local_name: z.string().optional(),
  description: z.string().optional(),
  inventory_unit_id: z.string(),
  product_status_type: z.nativeEnum(
    enum_product_status_type
  ),
  product_item_group_id: z.string().optional(),
  product_info: z
    .object({
      is_used_in_recipe: z.boolean().default(true).optional(),
      is_sold_directly: z.boolean().default(false).optional(),
      barcode: z.string().optional(),
      sku: z.string().optional(),
      price_deviation_limit: z.number().optional(),
      qty_deviation_limit: z.number().optional(),
      tax_profile_id: z.string().optional(),
      tax_profile_name: z.string().optional(),
      tax_rate: z.number().optional(),
      info: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
            data_type: z
              .nativeEnum(enum_data_type)
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  locations: z
    .object({
      add: z.array(z.object({ location_id: z.string() })).optional(),
    })
    .optional(),
  order_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  ingredient_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
          }),
        )
        .optional(),
    })
    .optional(),
});

export type ICreateProduct = z.infer<typeof ProductCreate>;
export class ProductCreateDto extends createZodDto(ProductCreate) { }

export const ProductUpdate = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  local_name: z.string().optional(),
  description: z.string().optional(),
  inventory_unit_id: z.string().optional(),
  product_status_type: z
    .nativeEnum(enum_product_status_type)
    .optional(),
  product_item_group_id: z.string().optional(),
  product_info: z
    .object({
      is_used_in_recipe: z.boolean().optional(),
      is_sold_directly: z.boolean().optional(),
      barcode: z.string().optional(),
      sku: z.string().optional(),
      price_deviation_limit: z.number().optional(),
      qty_deviation_limit: z.number().optional(),
      tax_profile_id: z.string().optional(),
      tax_profile_name: z.string().optional(),
      tax_profile_rate: z.number().optional(),
      info: z
        .array(
          z.object({
            label: z.string().optional(),
            value: z.string().optional(),
            data_type: z
              .nativeEnum(enum_data_type)
              .optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  locations: z
    .object({
      add: z.array(z.object({ location_id: z.string() })).optional(),
      remove: z.array(z.object({ product_location_id: z.string() })).optional(),
    })
    .optional(),
  order_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
          }),
        )
        .optional(),
      update: z
        .array(
          z.object({
            product_order_unit_id: z.string(),
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().optional(),
            is_active: z.boolean().optional(),
          }),
        )
        .optional(),
      remove: z
        .array(z.object({ product_order_unit_id: z.string() }))
        .optional(),
    })
    .optional(),

  ingredient_units: z
    .object({
      add: z
        .array(
          z.object({
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_default: z.boolean().default(false).optional(),
            is_active: z.boolean().default(true).optional(),
          }),
        )
        .optional(),
      update: z
        .array(
          z.object({
            product_ingredient_unit_id: z.string(),
            from_unit_id: z.string(),
            from_unit_qty: z.number(),
            to_unit_id: z.string(),
            to_unit_qty: z.number(),
            description: z.string().optional(),
            is_active: z.boolean().optional(),
            is_default: z.boolean().optional(),
          }),
        )
        .optional(),
      remove: z
        .array(z.object({ product_ingredient_unit_id: z.string() }))
        .optional(),
    })
    .optional(),
});

export type IUpdateProduct = z.infer<typeof ProductUpdate> & { id: string };
export class ProductUpdateDto extends createZodDto(ProductUpdate) { }

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create ProductCreate schema with async database validation
 */
export function createProductCreateValidation(prisma: PrismaClient) {
  return ProductCreate.superRefine(async (data, ctx) => {
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

      // Validate product_item_group_id
      if (data.product_item_group_id) {
        const itemGroup = await validateProductItemGroupIdExists(prisma, data.product_item_group_id);
        if (!itemGroup) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Product item group not found',
            path: ['product_item_group_id'],
          });
        }
      }

    // Validate product_info fields
    if (data.product_info) {

      // Validate tax_profile_id
      if (data.product_info.tax_profile_id) {
        const taxProfile = await validateTaxProfileIdExists(prisma, data.product_info.tax_profile_id);
        if (!taxProfile) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tax profile not found',
            path: ['product_info', 'tax_profile_id'],
          });
        }
      }
    }

    // Validate locations
    if (data.locations?.add) {
      for (let i = 0; i < data.locations.add.length; i++) {
        const loc = data.locations.add[i];
        const location = await validateLocationIdExists(prisma, loc.location_id);
        if (!location) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Location not found',
            path: ['locations', 'add', i, 'location_id'],
          });
        }
      }
    }

    // Validate order_units
    if (data.order_units?.add) {
      for (let i = 0; i < data.order_units.add.length; i++) {
        const ou = data.order_units.add[i];
        const fromUnit = await validateUnitIdExists(prisma, ou.from_unit_id);
        if (!fromUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'From unit not found',
            path: ['order_units', 'add', i, 'from_unit_id'],
          });
        }
        const toUnit = await validateUnitIdExists(prisma, ou.to_unit_id);
        if (!toUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'To unit not found',
            path: ['order_units', 'add', i, 'to_unit_id'],
          });
        }
      }
    }

    // Validate ingredient_units
    if (data.ingredient_units?.add) {
      for (let i = 0; i < data.ingredient_units.add.length; i++) {
        const iu = data.ingredient_units.add[i];
        const fromUnit = await validateUnitIdExists(prisma, iu.from_unit_id);
        if (!fromUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'From unit not found',
            path: ['ingredient_units', 'add', i, 'from_unit_id'],
          });
        }
        const toUnit = await validateUnitIdExists(prisma, iu.to_unit_id);
        if (!toUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'To unit not found',
            path: ['ingredient_units', 'add', i, 'to_unit_id'],
          });
        }
      }
    }
  });
}

/**
 * Create ProductUpdate schema with async database validation
 */
export function createProductUpdateValidation(prisma: PrismaClient) {
  return ProductUpdate.superRefine(async (data, ctx) => {
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
       // Validate product_item_group_id
      if (data.product_item_group_id) {
        const itemGroup = await validateProductItemGroupIdExists(prisma, data.product_item_group_id);
        if (!itemGroup) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Product item group not found',
            path: ['product_item_group_id'],
          });
        }
      }

    // Validate product_info fields
    if (data.product_info) {
   

      // Validate tax_profile_id
      if (data.product_info.tax_profile_id) {
        const taxProfile = await validateTaxProfileIdExists(prisma, data.product_info.tax_profile_id);
        if (!taxProfile) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tax profile not found',
            path: ['product_info', 'tax_profile_id'],
          });
        }
      }
    }

    // Validate locations.add
    if (data.locations?.add) {
      for (let i = 0; i < data.locations.add.length; i++) {
        const loc = data.locations.add[i];
        const location = await validateLocationIdExists(prisma, loc.location_id);
        if (!location) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Location not found',
            path: ['locations', 'add', i, 'location_id'],
          });
        }
      }
    }

    // Validate order_units.add
    if (data.order_units?.add) {
      for (let i = 0; i < data.order_units.add.length; i++) {
        const ou = data.order_units.add[i];
        const fromUnit = await validateUnitIdExists(prisma, ou.from_unit_id);
        if (!fromUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'From unit not found',
            path: ['order_units', 'add', i, 'from_unit_id'],
          });
        }
        const toUnit = await validateUnitIdExists(prisma, ou.to_unit_id);
        if (!toUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'To unit not found',
            path: ['order_units', 'add', i, 'to_unit_id'],
          });
        }
      }
    }

    // Validate order_units.update
    if (data.order_units?.update) {
      for (let i = 0; i < data.order_units.update.length; i++) {
        const ou = data.order_units.update[i];
        const fromUnit = await validateUnitIdExists(prisma, ou.from_unit_id);
        if (!fromUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'From unit not found',
            path: ['order_units', 'update', i, 'from_unit_id'],
          });
        }
        const toUnit = await validateUnitIdExists(prisma, ou.to_unit_id);
        if (!toUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'To unit not found',
            path: ['order_units', 'update', i, 'to_unit_id'],
          });
        }
      }
    }

    // Validate ingredient_units.add
    if (data.ingredient_units?.add) {
      for (let i = 0; i < data.ingredient_units.add.length; i++) {
        const iu = data.ingredient_units.add[i];
        const fromUnit = await validateUnitIdExists(prisma, iu.from_unit_id);
        if (!fromUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'From unit not found',
            path: ['ingredient_units', 'add', i, 'from_unit_id'],
          });
        }
        const toUnit = await validateUnitIdExists(prisma, iu.to_unit_id);
        if (!toUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'To unit not found',
            path: ['ingredient_units', 'add', i, 'to_unit_id'],
          });
        }
      }
    }

    // Validate ingredient_units.update
    if (data.ingredient_units?.update) {
      for (let i = 0; i < data.ingredient_units.update.length; i++) {
        const iu = data.ingredient_units.update[i];
        const fromUnit = await validateUnitIdExists(prisma, iu.from_unit_id);
        if (!fromUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'From unit not found',
            path: ['ingredient_units', 'update', i, 'from_unit_id'],
          });
        }
        const toUnit = await validateUnitIdExists(prisma, iu.to_unit_id);
        if (!toUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'To unit not found',
            path: ['ingredient_units', 'update', i, 'to_unit_id'],
          });
        }
      }
    }
  });
}
