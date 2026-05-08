import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateSpotCheckDetailCommentSchema = z.object({
  spot_check_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateSpotCheckDetailComment = z.infer<typeof CreateSpotCheckDetailCommentSchema>;

export class CreateSpotCheckDetailCommentDto extends createZodDto(CreateSpotCheckDetailCommentSchema) {}

export const UpdateSpotCheckDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateSpotCheckDetailComment = z.infer<typeof UpdateSpotCheckDetailCommentSchema>;

export class UpdateSpotCheckDetailCommentDto extends createZodDto(UpdateSpotCheckDetailCommentSchema) {}

export interface SpotCheckDetailCommentResponse {
  id: string;
  spot_check_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
