import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_workflow_type } from '@repo/prisma-shared-schema-tenant';

export const WorkflowCreate = z.object({
  name: z.string(),
  workflow_type: z.enum(
    Object.values(enum_workflow_type) as [string, ...string[]],
  ),
  description: z.string().optional(),
  data: z.any().optional(),
  is_active: z.boolean().optional().default(true),
});

export type ICreateWorkflow = z.infer<typeof WorkflowCreate>;
export class WorkflowCreateDto extends createZodDto(WorkflowCreate) {}

export const WorkflowUpdate = z.object({
  name: z.string().optional(),
  workflow_type: z
    .enum(Object.values(enum_workflow_type) as [string, ...string[]])
    .optional(),
  description: z.string().optional(),
  data: z.any().optional(),
  is_active: z.boolean().optional(),
});

export type IUpdateWorkflow = z.infer<typeof WorkflowUpdate> & { id: string };
export class WorkflowUpdateDto extends createZodDto(WorkflowUpdate) {}
