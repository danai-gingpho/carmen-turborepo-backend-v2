import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePeriodCommentSchema = z.object({
  period_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePeriodComment = z.infer<typeof CreatePeriodCommentSchema>;

export class CreatePeriodCommentDto extends createZodDto(CreatePeriodCommentSchema) {}

export const UpdatePeriodCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePeriodComment = z.infer<typeof UpdatePeriodCommentSchema>;

export class UpdatePeriodCommentDto extends createZodDto(UpdatePeriodCommentSchema) {}

export interface PeriodCommentResponse {
  id: string;
  period_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
