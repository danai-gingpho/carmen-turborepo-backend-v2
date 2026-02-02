import { ApproveQuantityAndUnitSchema, EmbeddedCurrencySchema, EmbeddedDiscountSchema, EmbeddedInventorySchema, EmbeddedLocationSchema, EmbeddedPriceListSchema, EmbeddedProductSchema, EmbeddedTaxSchema, EmbeddedVendorSchema, FocSchema, PriceSchema, RequestedQuantityAndUnitSchema, ValidateSchema } from '../embedded.dto';
import { z } from 'zod'
import { state_status } from './state_role/purchase-request.state-role.dto';

// Import validate functions
import {
  validateProductIdExists,
  validateProductIdsExist,
} from '../../validate/product.validate';

import {
  validateLocationIdExists,
  validateLocationIdsExist,
} from '../../validate/location.validate';

import {
  validateDeliveryPointIdExists,
  validateDeliveryPointIdsExist,
} from '../../validate/delivery-point.validate';

import {
  validateUnitIdExists,
  validateUnitIdsExist,
} from '../../validate/unit.validate';

import {
  validateCurrencyIdExists,
  validateCurrencyIdsExist,
} from '../../validate/currency.validate';

import {
  validateTaxProfileIdExists,
  validateTaxProfileIdsExist,
} from '../../validate/tax-profile.validate';

import {
  validateVendorIdExists,
  validateVendorIdsExist,
} from '../../validate/vendor.validate';

import {
  validatePriceListIdExists,
  validatePriceListIdsExist,
} from '../../validate/price-list.validate';

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