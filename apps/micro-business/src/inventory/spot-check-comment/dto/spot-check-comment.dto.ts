import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateSpotCheckCommentSchema = z.object({
  spot_check_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateSpotCheckComment = z.infer<typeof CreateSpotCheckCommentSchema>;

export class CreateSpotCheckCommentDto extends createZodDto(CreateSpotCheckCommentSchema) {}

export const UpdateSpotCheckCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateSpotCheckComment = z.infer<typeof UpdateSpotCheckCommentSchema>;

export class UpdateSpotCheckCommentDto extends createZodDto(UpdateSpotCheckCommentSchema) {}

export interface SpotCheckCommentResponse {
  id: string;
  spot_check_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
