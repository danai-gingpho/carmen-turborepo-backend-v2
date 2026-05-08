import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePricelistTemplateCommentSchema = z.object({
  pricelist_template_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePricelistTemplateComment = z.infer<typeof CreatePricelistTemplateCommentSchema>;

export class CreatePricelistTemplateCommentDto extends createZodDto(CreatePricelistTemplateCommentSchema) {}

export const UpdatePricelistTemplateCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePricelistTemplateComment = z.infer<typeof UpdatePricelistTemplateCommentSchema>;

export class UpdatePricelistTemplateCommentDto extends createZodDto(UpdatePricelistTemplateCommentSchema) {}

export interface PricelistTemplateCommentResponse {
  id: string;
  pricelist_template_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
