import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePhysicalCountCommentSchema = z.object({
  physical_count_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePhysicalCountComment = z.infer<typeof CreatePhysicalCountCommentSchema>;

export class CreatePhysicalCountCommentDto extends createZodDto(CreatePhysicalCountCommentSchema) {}

export const UpdatePhysicalCountCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePhysicalCountComment = z.infer<typeof UpdatePhysicalCountCommentSchema>;

export class UpdatePhysicalCountCommentDto extends createZodDto(UpdatePhysicalCountCommentSchema) {}

export interface PhysicalCountCommentResponse {
  id: string;
  physical_count_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
