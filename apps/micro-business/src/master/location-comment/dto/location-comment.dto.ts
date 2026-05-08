import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateLocationCommentSchema = z.object({
  location_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateLocationComment = z.infer<typeof CreateLocationCommentSchema>;

export class CreateLocationCommentDto extends createZodDto(CreateLocationCommentSchema) {}

export const UpdateLocationCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateLocationComment = z.infer<typeof UpdateLocationCommentSchema>;

export class UpdateLocationCommentDto extends createZodDto(UpdateLocationCommentSchema) {}

export interface LocationCommentResponse {
  id: string;
  location_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
