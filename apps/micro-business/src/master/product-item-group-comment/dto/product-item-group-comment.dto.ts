import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateProductItemGroupCommentSchema = z.object({
  product_item_group_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateProductItemGroupComment = z.infer<typeof CreateProductItemGroupCommentSchema>;

export class CreateProductItemGroupCommentDto extends createZodDto(CreateProductItemGroupCommentSchema) {}

export const UpdateProductItemGroupCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateProductItemGroupComment = z.infer<typeof UpdateProductItemGroupCommentSchema>;

export class UpdateProductItemGroupCommentDto extends createZodDto(UpdateProductItemGroupCommentSchema) {}

export interface ProductItemGroupCommentResponse {
  id: string;
  product_item_group_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
