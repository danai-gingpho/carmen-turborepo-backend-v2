import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreatePurchaseOrderDetailCommentSchema = z.object({
  purchase_order_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePurchaseOrderDetailComment = z.infer<typeof CreatePurchaseOrderDetailCommentSchema>;

export class CreatePurchaseOrderDetailCommentDto extends createZodDto(CreatePurchaseOrderDetailCommentSchema) {}

export const UpdatePurchaseOrderDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePurchaseOrderDetailComment = z.infer<typeof UpdatePurchaseOrderDetailCommentSchema>;

export class UpdatePurchaseOrderDetailCommentDto extends createZodDto(UpdatePurchaseOrderDetailCommentSchema) {}

export interface PurchaseOrderDetailCommentResponse {
  id: string;
  purchase_order_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
