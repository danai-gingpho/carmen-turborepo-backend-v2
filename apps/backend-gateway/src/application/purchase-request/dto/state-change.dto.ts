import { enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { ApproveQuantityAndUnitSchema, CreatePurchaseRequestDetailSchema, EmbeddedCurrencySchema, EmbeddedDepartmentSchema, EmbeddedDiscountSchema, EmbeddedTaxSchema, EmbeddedVendorSchema, EmbeddedWorkflowSchema, FocSchema, PriceSchema, state_status } from '@/common'
import { z } from 'zod'

/* For some reason it's seem union type validate won't work with builded data so I have to duplicate it in PR's folder and fix it later */

export const ApprovePurchaseRequestDetailSchema = z.object({
  id: z.string().uuid(),
  description: z.string().optional().nullable(),
  purchase_request_id: z.string().uuid(),
  state_status: z.nativeEnum(state_status),
  state_message: z.string().nullable(),
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

export const ApproveByStateRoleSchema2 = z.discriminatedUnion('state_role', [
  z.object({
    state_role: z.literal(enum_stage_role.approve),
    details: z.array(ApprovePurchaseRequestDetailSchema)
  }),
  z.object({
    state_role: z.literal(enum_stage_role.purchase),
    details: z.array(PurchaseRoleApprovePurchaseRequestDetailSchema)
  })
]);

export const SavePurchaseRequestSchema = z.discriminatedUnion('state_role', [
  z.object({
    state_role: z.literal(enum_stage_role.create),
    details: z.object({
      description: z.string().optional().nullable(),
      requestor_id: z.string().uuid().optional(),
    })
      .merge(EmbeddedWorkflowSchema)
      .merge(EmbeddedDepartmentSchema)
      .extend({
        purchase_request_detail: z.object({
          add: z.array(CreatePurchaseRequestDetailSchema).optional(),
          update: z.array(CreatePurchaseRequestDetailSchema).optional(),
          remove: z.array(z.object({ id: z.string() })).optional()
        })
      })
  }),
  z.object({
    state_role: z.literal(enum_stage_role.approve),
    details: z.array(ApprovePurchaseRequestDetailSchema.omit({ state_status: true, state_message: true })),
  }),
  z.object({
    state_role: z.literal(enum_stage_role.purchase),
    details: z.array(PurchaseRoleApprovePurchaseRequestDetailSchema.omit({ state_status: true, state_message: true }))
  })
])