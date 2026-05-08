import { z } from 'zod';

// Workflow response schema (for findOne)
export const WorkflowResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  workflow_type: z.string(),
  data: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
  description: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type WorkflowResponse = z.infer<typeof WorkflowResponseSchema>;

// Workflow detail response schema (for findOne)
export const WorkflowDetailResponseSchema = WorkflowResponseSchema;

export type WorkflowDetailResponse = z.infer<typeof WorkflowDetailResponseSchema>;

// Workflow list item response schema (for findAll)
export const WorkflowListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  workflow_type: z.string(),
  data: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
  description: z.string().nullable().optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export type WorkflowListItemResponse = z.infer<typeof WorkflowListItemResponseSchema>;

// Workflow by type response schema (for findByType)
export const WorkflowByTypeResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  can_create: z.boolean(),
});

export type WorkflowByTypeResponse = z.infer<typeof WorkflowByTypeResponseSchema>;

// Mutation response schema
export const WorkflowMutationResponseSchema = z.object({
  id: z.string(),
});

export type WorkflowMutationResponse = z.infer<typeof WorkflowMutationResponseSchema>;
