import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateDimensionCommentSchema = z.object({
  dimension_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateDimensionComment = z.infer<typeof CreateDimensionCommentSchema>;

export class CreateDimensionCommentDto extends createZodDto(CreateDimensionCommentSchema) {}

export const UpdateDimensionCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateDimensionComment = z.infer<typeof UpdateDimensionCommentSchema>;

export class UpdateDimensionCommentDto extends createZodDto(UpdateDimensionCommentSchema) {}

export interface DimensionCommentResponse {
  id: string;
  dimension_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
