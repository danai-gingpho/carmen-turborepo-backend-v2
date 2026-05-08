import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePurchaseRequestDetailCommentSchema = z.object({
  purchase_request_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePurchaseRequestDetailComment = z.infer<typeof CreatePurchaseRequestDetailCommentSchema>;

export class CreatePurchaseRequestDetailCommentDto extends createZodDto(CreatePurchaseRequestDetailCommentSchema) {}

export const UpdatePurchaseRequestDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePurchaseRequestDetailComment = z.infer<typeof UpdatePurchaseRequestDetailCommentSchema>;

export class UpdatePurchaseRequestDetailCommentDto extends createZodDto(UpdatePurchaseRequestDetailCommentSchema) {}

export interface PurchaseRequestDetailCommentResponse {
  id: string;
  purchase_request_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
