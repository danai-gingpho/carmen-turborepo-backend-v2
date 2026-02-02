import { z } from 'zod';
import { EmbeddedDepartmentSchema, EmbeddedWorkflowSchema } from '../embedded.dto';
import { ProductCreate } from '../product/product.dto';
import { CreatePurchaseRequestDetailSchema } from './purchase-request-detail.dto';
import { createZodDto } from 'nestjs-zod';
import { enum_stage_role, PrismaClient } from '@repo/prisma-shared-schema-tenant/dist';

// Import validate functions
import {
  validateProductIdExists,
  validateProductIdsExist,
} from '../../validate/product.validate';

import {
  validateDepartmentIdExists,
  validateDepartmentIdsExist,
} from '../../validate/department.validate';

import {
  validateWorkflowIdExists,
  validateWorkflowIdsExist,
} from '../../validate/workflow.validate';

import {
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
} from '../../validate/datetime.validate';

// Re-export validate functions for use with PurchaseRequest
export {
  validateProductIdExists,
  validateProductIdsExist,
  validateDepartmentIdExists,
  validateDepartmentIdsExist,
  validateWorkflowIdExists,
  validateWorkflowIdsExist,
  toISOString,
  toISOStringOrThrow,
  isValidDate,
  toDate,
  toDateOrThrow,
};

const ProductSchema = z.object({
  product_id: z.string().uuid(),
  product_name: ProductCreate.shape.name,
  product_local_name: ProductCreate.shape.local_name,
})

export const CreatePurchaseRequestSchema = z.object({
  state_role: z.literal(enum_stage_role.create),
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

const UpdatePurchaseRequestDetailSchema = CreatePurchaseRequestDetailSchema.extend({
  id: z.string().uuid(),
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

// ============================================================================
// Factory Functions for Async Validation with Database
// ============================================================================

/**
 * Create CreatePurchaseRequestSchema with async database validation
 */
export function createPurchaseRequestCreateValidation(prisma: PrismaClient) {
  return CreatePurchaseRequestSchema.superRefine(async (data, ctx) => {
    const details = data.details;

    // Validate workflow_id
    if (details.workflow_id) {
      const workflow = await validateWorkflowIdExists(prisma, details.workflow_id);
      if (!workflow) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Workflow not found',
          path: ['details', 'workflow_id'],
        });
      }
    }

    // Validate department_id
    if (details.department_id) {
      const department = await validateDepartmentIdExists(prisma, details.department_id);
      if (!department) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Department not found',
          path: ['details', 'department_id'],
        });
      }
    }
  });
}