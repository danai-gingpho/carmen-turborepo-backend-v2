import { ApproveQuantityAndUnitSchema, EmbeddedCurrencySchema, EmbeddedDiscountSchema, EmbeddedInventorySchema, EmbeddedLocationSchema, EmbeddedPriceListSchema, EmbeddedProductSchema, EmbeddedTaxSchema, EmbeddedVendorSchema, FocSchema, PriceSchema, RequestedQuantityAndUnitSchema, ValidateSchema } from '../embedded.dto';
import { z } from 'zod'

// Moved here to avoid circular dependency
export enum state_status {
  submit = 'submit',
  pending = 'pending',
  approve = 'approve',
  reject = 'reject',
  review = 'review',
}

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