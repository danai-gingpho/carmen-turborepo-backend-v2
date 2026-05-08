import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateConfigRunningCodeCommentSchema = z.object({
  config_running_code_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateConfigRunningCodeComment = z.infer<typeof CreateConfigRunningCodeCommentSchema>;

export class CreateConfigRunningCodeCommentDto extends createZodDto(CreateConfigRunningCodeCommentSchema) {}

export const UpdateConfigRunningCodeCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateConfigRunningCodeComment = z.infer<typeof UpdateConfigRunningCodeCommentSchema>;

export class UpdateConfigRunningCodeCommentDto extends createZodDto(UpdateConfigRunningCodeCommentSchema) {}

export interface ConfigRunningCodeCommentResponse {
  id: string;
  config_running_code_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
