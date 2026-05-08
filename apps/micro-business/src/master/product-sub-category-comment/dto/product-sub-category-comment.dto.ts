import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateProductSubCategoryCommentSchema = z.object({
  product_sub_category_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateProductSubCategoryComment = z.infer<typeof CreateProductSubCategoryCommentSchema>;

export class CreateProductSubCategoryCommentDto extends createZodDto(CreateProductSubCategoryCommentSchema) {}

export const UpdateProductSubCategoryCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateProductSubCategoryComment = z.infer<typeof UpdateProductSubCategoryCommentSchema>;

export class UpdateProductSubCategoryCommentDto extends createZodDto(UpdateProductSubCategoryCommentSchema) {}

export interface ProductSubCategoryCommentResponse {
  id: string;
  product_sub_category_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
