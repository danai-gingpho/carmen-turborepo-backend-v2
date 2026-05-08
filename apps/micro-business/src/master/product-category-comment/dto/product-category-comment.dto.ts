import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateProductCategoryCommentSchema = z.object({
  product_category_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateProductCategoryComment = z.infer<typeof CreateProductCategoryCommentSchema>;

export class CreateProductCategoryCommentDto extends createZodDto(CreateProductCategoryCommentSchema) {}

export const UpdateProductCategoryCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateProductCategoryComment = z.infer<typeof UpdateProductCategoryCommentSchema>;

export class UpdateProductCategoryCommentDto extends createZodDto(UpdateProductCategoryCommentSchema) {}

export interface ProductCategoryCommentResponse {
  id: string;
  product_category_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
