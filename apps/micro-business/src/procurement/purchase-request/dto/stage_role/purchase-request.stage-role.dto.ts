import { enum_stage_role } from '@repo/prisma-shared-schema-tenant'
import { z } from 'zod'
import { ApprovePurchaseRequestDetailSchema, PurchaseRoleApprovePurchaseRequestDetailSchema, stage_status } from '../purchase-request-detail.dto'
import { ValidateSchema } from '@/common/dto/embedded.dto'
import { createZodDto } from 'nestjs-zod';

// Re-export stage_status for backward compatibility
export { stage_status };

const ApproveByStageRoleApproveSchema = z.object({
  stage_role: z.literal(enum_stage_role.approve),
  details: z.array(ApprovePurchaseRequestDetailSchema)
})

const ApproveByStageRolePurchaseSchema = z.object({
  stage_role: z.literal(enum_stage_role.purchase),
  details: z.array(PurchaseRoleApprovePurchaseRequestDetailSchema)
})

export const ApproveByStageRoleSchema = z.discriminatedUnion('stage_role', [
  z.object({
    stage_role: z.literal(enum_stage_role.approve),
    details: z.array(ApprovePurchaseRequestDetailSchema)
  }),
  z.object({
    stage_role: z.literal(enum_stage_role.purchase),
    details: z.array(PurchaseRoleApprovePurchaseRequestDetailSchema)
  })
]);

const ReviewPurchaseRequestSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  des_stage: z.string().nullable(),
  details: z.array(
    z.object({
      id: ValidateSchema.shape.uuid,
      stage_status: z.nativeEnum(stage_status),
      stage_message: z.string().nullable(),
    })
  )
})

const RejectPurchaseRequestSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  details: z.array(
    z.object({
      id: ValidateSchema.shape.uuid,
      stage_status: z.nativeEnum(stage_status),
      stage_message: z.string().nullable(),
    })
  )
})

const SubmitPurchaseRequestSchema = z.object({
  stage_role: z.nativeEnum(enum_stage_role),
  details: z.array(
    z.object({
      id: ValidateSchema.shape.uuid,
      stage_status: z.nativeEnum(stage_status),
      stage_message: z.string().nullable(),
    })
  )
})

export type ApproveByStageRoleApprove = z.infer<typeof ApproveByStageRoleApproveSchema>
export type ApproveByStageRolePurchase = z.infer<typeof ApproveByStageRolePurchaseSchema>
export type SubmitPurchaseRequest = z.infer<typeof SubmitPurchaseRequestSchema>


export class ReviewPurchaseRequestDto extends createZodDto(ReviewPurchaseRequestSchema) { }
export class RejectPurchaseRequestDto extends createZodDto(RejectPurchaseRequestSchema) { }
export class SubmitPurchaseRequestDto extends createZodDto(SubmitPurchaseRequestSchema) { }
