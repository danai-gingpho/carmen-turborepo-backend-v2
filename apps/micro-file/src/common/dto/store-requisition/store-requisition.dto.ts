import { z } from 'zod';
import { EmbeddedDepartmentSchema, EmbeddedWorkflowSchema, ValidateSchema } from '../embedded.dto';
import { CreateStoreRequisitionDetailSchema } from './store-requisition-detail.dto';
import { createZodDto } from 'nestjs-zod';
import { enum_stage_role } from '@repo/prisma-shared-schema-tenant';

// Embedded Location Schema for Store Requisition (from/to locations)
const EmbeddedFromLocationSchema = z.object({
  from_location_id: ValidateSchema.shape.uuid.optional(),
});

const EmbeddedToLocationSchema = z.object({
  to_location_id: ValidateSchema.shape.uuid.optional(),
});

// Create Store Requisition Schema (with state_role like PR)
export const CreateStoreRequisitionSchema = z.object({
  state_role: z.literal(enum_stage_role.create),
  details: z.object({
    sr_date: z.string().datetime().pipe(z.coerce.date()),
    expected_date: z.string().datetime().pipe(z.coerce.date()).optional(),
    description: z.string().optional().nullable(),
    requestor_id: z.string().uuid().optional(),
    info: z.any().optional(),
    dimension: z.any().optional(),
  })
    .merge(EmbeddedWorkflowSchema)
    .merge(EmbeddedDepartmentSchema)
    .merge(EmbeddedFromLocationSchema)
    .merge(EmbeddedToLocationSchema)
    .extend({
      store_requisition_detail: z.object({
        add: z.array(CreateStoreRequisitionDetailSchema).optional(),
      }).optional(),
    }),
});

// Update Store Requisition Schema
export const UpdateStoreRequisitionSchema = CreateStoreRequisitionSchema.extend({
  details: CreateStoreRequisitionSchema.shape.details.extend({
    doc_version: z.number(),
    store_requisition_detail: z.object({
      add: z.array(CreateStoreRequisitionDetailSchema).optional(),
      update: z.array(CreateStoreRequisitionDetailSchema.extend({
        id: z.string().uuid(),
      })).optional(),
      remove: z.array(z.object({ id: z.string().uuid() })).optional(),
    }).optional(),
  }),
});

// Types
export type CreateStoreRequisition = z.infer<typeof CreateStoreRequisitionSchema>;
export type UpdateStoreRequisition = z.infer<typeof UpdateStoreRequisitionSchema>;

// DTOs
export class CreateStoreRequisitionDto extends createZodDto(CreateStoreRequisitionSchema) {}
export class UpdateStoreRequisitionDto extends createZodDto(UpdateStoreRequisitionSchema) {}
