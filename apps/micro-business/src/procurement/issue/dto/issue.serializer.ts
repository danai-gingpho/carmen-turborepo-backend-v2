import { z } from 'zod';

export const IssueStatusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed']);
export const IssuePriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

export const IssueDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: IssueStatusEnum.nullable().optional(),
  priority: IssuePriorityEnum.nullable().optional(),
  assigned_to_id: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  resolution: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  info: z.any().nullable().optional(),
  dimension: z.any().nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
  created_by_id: z.string().nullable().optional(),
  updated_at: z.coerce.date().nullable().optional(),
  updated_by_id: z.string().nullable().optional(),
});

export const IssueListItemResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: IssueStatusEnum.nullable().optional(),
  priority: IssuePriorityEnum.nullable().optional(),
  assigned_to_id: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  created_at: z.coerce.date().nullable().optional(),
});

export const IssueMutationResponseSchema = z.object({
  id: z.string(),
});

export type IssueStatus = z.infer<typeof IssueStatusEnum>;
export type IssuePriority = z.infer<typeof IssuePriorityEnum>;
export type IssueDetailResponse = z.infer<typeof IssueDetailResponseSchema>;
export type IssueListItemResponse = z.infer<typeof IssueListItemResponseSchema>;
export type IssueMutationResponse = z.infer<typeof IssueMutationResponseSchema>;
