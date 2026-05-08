import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePhysicalCountDetailCommentSchema = z.object({
  physical_count_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePhysicalCountDetailComment = z.infer<typeof CreatePhysicalCountDetailCommentSchema>;

export class CreatePhysicalCountDetailCommentDto extends createZodDto(CreatePhysicalCountDetailCommentSchema) {}

export const UpdatePhysicalCountDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePhysicalCountDetailComment = z.infer<typeof UpdatePhysicalCountDetailCommentSchema>;

export class UpdatePhysicalCountDetailCommentDto extends createZodDto(UpdatePhysicalCountDetailCommentSchema) {}

export interface PhysicalCountDetailCommentResponse {
  id: string;
  physical_count_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
