import { enum_stage_role } from '@repo/prisma-shared-schema-tenant'
import { z } from 'zod'
import { ApprovePurchaseRequestDetailSchema, PurchaseRoleApprovePurchaseRequestDetailSchema } from '../purchase-request-detail.dto'
import { ValidateSchema } from '../../embedded.dto'
import { createZodDto } from 'nestjs-zod';

export enum state_status {
  submit = 'submit',
  pending = 'pending',
  approve = 'approve',
  reject = 'reject',
  review = 'review',
}

const ApproveByStateRoleApproveSchema = z.object({
  state_role: z.literal(enum_stage_role.approve),
  details: z.array(ApprovePurchaseRequestDetailSchema)
})

const ApproveByStateRolePurchaseSchema = z.object({
  state_role: z.literal(enum_stage_role.purchase),
  details: z.array(PurchaseRoleApprovePurchaseRequestDetailSchema)
})

export const ApproveByStateRoleSchema = z.discriminatedUnion('state_role', [
  z.object({
    state_role: z.literal(enum_stage_role.approve),
    details: z.array(ApprovePurchaseRequestDetailSchema)
  }),
  z.object({
    state_role: z.literal(enum_stage_role.purchase),
    details: z.array(PurchaseRoleApprovePurchaseRequestDetailSchema)
  })
]);

const ReviewPurchaseRequestSchema = z.object({
  state_role: z.nativeEnum(enum_stage_role),
  des_stage: z.string().nullable(),
  details: z.array(
    z.object({
      id: ValidateSchema.shape.uuid,
      stage_status: z.nativeEnum(state_status),
      stage_message: z.string().nullable(),
    })
  )
})

const RejectPurchaseRequestSchema = z.object({
  state_role: z.nativeEnum(enum_stage_role),
  details: z.array(
    z.object({
      id: ValidateSchema.shape.uuid,
      stage_status: z.nativeEnum(state_status),
      stage_message: z.string().nullable(),
    })
  )
})

const SubmitPurchaseRequestSchema = z.object({
  state_role: z.nativeEnum(enum_stage_role),
  details: z.array(
    z.object({
      id: ValidateSchema.shape.uuid,
      stage_status: z.nativeEnum(state_status),
      stage_message: z.string().nullable(),
    })
  )
})

export type ApproveByStateRoleApprove = z.infer<typeof ApproveByStateRoleApproveSchema>
export type ApproveByStateRolePurchase = z.infer<typeof ApproveByStateRolePurchaseSchema>
export type SubmitPurchaseRequest = z.infer<typeof SubmitPurchaseRequestSchema>


export class ReviewPurchaseRequestDto extends createZodDto(ReviewPurchaseRequestSchema) { }
export class RejectPurchaseRequestDto extends createZodDto(RejectPurchaseRequestSchema) { }
export class SubmitPurchaseRequestDto extends createZodDto(SubmitPurchaseRequestSchema) { }
