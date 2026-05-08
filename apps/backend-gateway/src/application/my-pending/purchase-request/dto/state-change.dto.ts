import { ApproveQuantityAndUnitSchema, EmbeddedCurrencySchema, EmbeddedDiscountSchema, EmbeddedTaxSchema, EmbeddedVendorSchema, FocSchema, PriceSchema, stage_status } from '@/common'
import { z } from 'zod'
import { createZodDto } from 'nestjs-zod'

/* For some reason it's seem union type validate won't work with builded data so I have to duplicate it in PR's folder and fix it later */

export const ApprovePurchaseRequestDetailSchema = z.object({
  id: z.string().uuid(),
  description: z.string().optional().nullable(),
  purchase_reuqest_id: z.string().uuid(),
  stage_status: z.nativeEnum(stage_status),
  stage_message: z.string().nullable(),
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

// When stage_status === 'reject', the user only needs to send id + stage_message;
// inject sentinel defaults for fields the strict schemas mark as required so the frontend
// doesn't have to fill vendor/tax/foc/pricelist for an item it's rejecting.
const fillRejectDefaults = (val: unknown): unknown => {
  if (
    val && typeof val === 'object' &&
    (val as { stage_status?: unknown }).stage_status === stage_status.reject
  ) {
    return {
      is_tax_adjustment: false,
      foc_qty: 0,
      ...(val as object),
    };
  }
  return val;
};

export const ApproveByStageRoleSchema2 = z.preprocess(
  fillRejectDefaults,
  z.discriminatedUnion('stage_role', [
    ApprovePurchaseRequestDetailSchema.extend({
      stage_role: z.literal('approve')
    }),
    PurchaseRoleApprovePurchaseRequestDetailSchema.extend({
      stage_role: z.literal('purchase')
    })
  ])
);

// @ts-expect-error discriminatedUnion not supported by createZodDto
export class ApproveByStageRoleDto2 extends createZodDto(ApproveByStageRoleSchema2) {}