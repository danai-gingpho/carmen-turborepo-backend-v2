import { enum_workflow_type } from '@repo/prisma-shared-schema-tenant';
import { z } from 'zod';

const workflowTypeParamSchema = z.object({
  type: z.enum(Object.values(enum_workflow_type) as [string, ...string[]]),
})

type WorkflowTypeParam = z.infer<typeof workflowTypeParamSchema>

export class WorkflowTypeParamDto implements WorkflowTypeParam {
  type: enum_workflow_type
}

