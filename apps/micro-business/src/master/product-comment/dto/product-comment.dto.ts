import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateProductCommentSchema = z.object({
  product_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateProductComment = z.infer<typeof CreateProductCommentSchema>;

export class CreateProductCommentDto extends createZodDto(CreateProductCommentSchema) {}

export const UpdateProductCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateProductComment = z.infer<typeof UpdateProductCommentSchema>;

export class UpdateProductCommentDto extends createZodDto(UpdateProductCommentSchema) {}

export interface ProductCommentResponse {
  id: string;
  product_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
