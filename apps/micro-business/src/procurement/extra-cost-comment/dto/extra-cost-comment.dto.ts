import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateExtraCostCommentSchema = z.object({
  extra_cost_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateExtraCostComment = z.infer<typeof CreateExtraCostCommentSchema>;

export class CreateExtraCostCommentDto extends createZodDto(CreateExtraCostCommentSchema) {}

export const UpdateExtraCostCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateExtraCostComment = z.infer<typeof UpdateExtraCostCommentSchema>;

export class UpdateExtraCostCommentDto extends createZodDto(UpdateExtraCostCommentSchema) {}

export interface ExtraCostCommentResponse {
  id: string;
  extra_cost_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
