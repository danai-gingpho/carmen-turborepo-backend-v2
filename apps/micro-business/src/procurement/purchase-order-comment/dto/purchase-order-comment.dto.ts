import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePurchaseOrderCommentSchema = z.object({
  purchase_order_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePurchaseOrderComment = z.infer<typeof CreatePurchaseOrderCommentSchema>;

export class CreatePurchaseOrderCommentDto extends createZodDto(CreatePurchaseOrderCommentSchema) {}

export const UpdatePurchaseOrderCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePurchaseOrderComment = z.infer<typeof UpdatePurchaseOrderCommentSchema>;

export class UpdatePurchaseOrderCommentDto extends createZodDto(UpdatePurchaseOrderCommentSchema) {}

export interface PurchaseOrderCommentResponse {
  id: string;
  purchase_order_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
