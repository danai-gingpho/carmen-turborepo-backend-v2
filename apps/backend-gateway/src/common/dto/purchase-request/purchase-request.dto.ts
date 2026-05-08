import { z } from 'zod';
import { EmbeddedDepartmentSchema, EmbeddedWorkflowSchema } from '../embedded.dto';

import { CreatePurchaseRequestDetailSchema } from './purchase-request-detail.dto';
import { createZodDto } from 'nestjs-zod';
import { enum_stage_role } from '@repo/prisma-shared-schema-tenant';

export const CreatePurchaseRequestSchema = z.object({
  stage_role: z.literal(enum_stage_role.create),
  details: z.object({
    pr_date: z.string().datetime().pipe(z.coerce.date()),
    description: z.string().optional().nullable(),
    requestor_id: z.string().uuid().optional(),
  })
    .merge(EmbeddedWorkflowSchema)
    .merge(EmbeddedDepartmentSchema)
    .extend({
      pr_date: z.string().datetime().pipe(z.coerce.date()),
      purchase_request_detail: z.object({
        add: z.array(CreatePurchaseRequestDetailSchema).optional(),
      }).optional()
    })
})

const UpdatePurchaseRequestSchema = CreatePurchaseRequestSchema
  .extend({
    doc_version: z.number().optional().readonly(),
    purchase_request_detail: z.object({
      add: z.array(CreatePurchaseRequestDetailSchema
      ).optional(),
      update: z.array(CreatePurchaseRequestDetailSchema.extend({
        id: z.string().uuid()
      })).optional(),
      remove: z.array(z.object({ id: z.string().uuid() })).optional(),
    }).optional(),
  })

export class UpdatePurchaseRequestDto extends createZodDto(UpdatePurchaseRequestSchema) { }

export type CreatePurchaseRequestDetail = z.infer<typeof CreatePurchaseRequestDetailSchema>

export type CreatePurchaseRequest = z.infer<typeof CreatePurchaseRequestSchema>;

export class CreatePurchaseRequestDetailDto extends createZodDto(CreatePurchaseRequestDetailSchema) { }

export class CreatePurchaseRequestDto extends createZodDto(CreatePurchaseRequestSchema) { }