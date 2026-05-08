import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePricelistDetailCommentSchema = z.object({
  pricelist_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePricelistDetailComment = z.infer<typeof CreatePricelistDetailCommentSchema>;

export class CreatePricelistDetailCommentDto extends createZodDto(CreatePricelistDetailCommentSchema) {}

export const UpdatePricelistDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePricelistDetailComment = z.infer<typeof UpdatePricelistDetailCommentSchema>;

export class UpdatePricelistDetailCommentDto extends createZodDto(UpdatePricelistDetailCommentSchema) {}

export interface PricelistDetailCommentResponse {
  id: string;
  pricelist_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
