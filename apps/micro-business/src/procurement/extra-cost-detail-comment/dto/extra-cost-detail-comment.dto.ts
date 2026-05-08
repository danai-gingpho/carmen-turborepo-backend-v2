import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateExtraCostDetailCommentSchema = z.object({
  extra_cost_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateExtraCostDetailComment = z.infer<typeof CreateExtraCostDetailCommentSchema>;

export class CreateExtraCostDetailCommentDto extends createZodDto(CreateExtraCostDetailCommentSchema) {}

export const UpdateExtraCostDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateExtraCostDetailComment = z.infer<typeof UpdateExtraCostDetailCommentSchema>;

export class UpdateExtraCostDetailCommentDto extends createZodDto(UpdateExtraCostDetailCommentSchema) {}

export interface ExtraCostDetailCommentResponse {
  id: string;
  extra_cost_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
