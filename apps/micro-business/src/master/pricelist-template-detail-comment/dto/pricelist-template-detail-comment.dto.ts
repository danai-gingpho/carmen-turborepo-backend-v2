import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePricelistTemplateDetailCommentSchema = z.object({
  pricelist_template_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePricelistTemplateDetailComment = z.infer<typeof CreatePricelistTemplateDetailCommentSchema>;

export class CreatePricelistTemplateDetailCommentDto extends createZodDto(CreatePricelistTemplateDetailCommentSchema) {}

export const UpdatePricelistTemplateDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePricelistTemplateDetailComment = z.infer<typeof UpdatePricelistTemplateDetailCommentSchema>;

export class UpdatePricelistTemplateDetailCommentDto extends createZodDto(UpdatePricelistTemplateDetailCommentSchema) {}

export interface PricelistTemplateDetailCommentResponse {
  id: string;
  pricelist_template_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
