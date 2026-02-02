import { ApproveQuantityAndUnitSchema, EmbeddedCurrencySchema, EmbeddedDiscountSchema, EmbeddedTaxSchema, EmbeddedVendorSchema, FocSchema, PriceSchema, state_status } from '@/common'
import { z } from 'zod'

/* For some reason it's seem union type validate won't work with builded data so I have to duplicate it in PR's folder and fix it later */

export const ApprovePurchaseRequestDetailSchema = z.object({
  id: z.string().uuid(),
  description: z.string().optional().nullable(),
  purchase_reuqest_id: z.string().uuid(),
  state_status: z.nativeEnum(state_status),
  state_message: z.string().nullable(),
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

export const ApproveByStateRoleSchema2 = z.discriminatedUnion('state_role', [
  ApprovePurchaseRequestDetailSchema.extend({
    state_role: z.literal('approve')
  }),
  PurchaseRoleApprovePurchaseRequestDetailSchema.extend({
    state_role: z.literal('purchase')
  })
]);