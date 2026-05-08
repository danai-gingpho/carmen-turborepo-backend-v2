import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateWorkflowCommentSchema = z.object({
  workflow_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateWorkflowComment = z.infer<typeof CreateWorkflowCommentSchema>;

export class CreateWorkflowCommentDto extends createZodDto(CreateWorkflowCommentSchema) {}

export const UpdateWorkflowCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateWorkflowComment = z.infer<typeof UpdateWorkflowCommentSchema>;

export class UpdateWorkflowCommentDto extends createZodDto(UpdateWorkflowCommentSchema) {}

export interface WorkflowCommentResponse {
  id: string;
  workflow_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
