import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePricelistCommentSchema = z.object({
  pricelist_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePricelistComment = z.infer<typeof CreatePricelistCommentSchema>;

export class CreatePricelistCommentDto extends createZodDto(CreatePricelistCommentSchema) {}

export const UpdatePricelistCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePricelistComment = z.infer<typeof UpdatePricelistCommentSchema>;

export class UpdatePricelistCommentDto extends createZodDto(UpdatePricelistCommentSchema) {}

export interface PricelistCommentResponse {
  id: string;
  pricelist_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
