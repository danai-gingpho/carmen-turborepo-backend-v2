import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateStockInDetailCommentSchema = z.object({
  stock_in_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateStockInDetailComment = z.infer<typeof CreateStockInDetailCommentSchema>;

export class CreateStockInDetailCommentDto extends createZodDto(CreateStockInDetailCommentSchema) {}

export const UpdateStockInDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateStockInDetailComment = z.infer<typeof UpdateStockInDetailCommentSchema>;

export class UpdateStockInDetailCommentDto extends createZodDto(UpdateStockInDetailCommentSchema) {}

export interface StockInDetailCommentResponse {
  id: string;
  stock_in_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
