import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePurchaseRequestTemplateCommentSchema = z.object({
  purchase_request_template_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePurchaseRequestTemplateComment = z.infer<typeof CreatePurchaseRequestTemplateCommentSchema>;

export class CreatePurchaseRequestTemplateCommentDto extends createZodDto(CreatePurchaseRequestTemplateCommentSchema) {}

export const UpdatePurchaseRequestTemplateCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePurchaseRequestTemplateComment = z.infer<typeof UpdatePurchaseRequestTemplateCommentSchema>;

export class UpdatePurchaseRequestTemplateCommentDto extends createZodDto(UpdatePurchaseRequestTemplateCommentSchema) {}

export interface PurchaseRequestTemplateCommentResponse {
  id: string;
  purchase_request_template_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
