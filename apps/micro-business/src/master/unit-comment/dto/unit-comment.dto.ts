import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateUnitCommentSchema = z.object({
  unit_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateUnitComment = z.infer<typeof CreateUnitCommentSchema>;

export class CreateUnitCommentDto extends createZodDto(CreateUnitCommentSchema) {}

export const UpdateUnitCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateUnitComment = z.infer<typeof UpdateUnitCommentSchema>;

export class UpdateUnitCommentDto extends createZodDto(UpdateUnitCommentSchema) {}

export interface UnitCommentResponse {
  id: string;
  unit_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
