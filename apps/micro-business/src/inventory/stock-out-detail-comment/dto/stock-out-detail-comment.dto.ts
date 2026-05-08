import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateStockOutDetailCommentSchema = z.object({
  stock_out_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateStockOutDetailComment = z.infer<typeof CreateStockOutDetailCommentSchema>;

export class CreateStockOutDetailCommentDto extends createZodDto(CreateStockOutDetailCommentSchema) {}

export const UpdateStockOutDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateStockOutDetailComment = z.infer<typeof UpdateStockOutDetailCommentSchema>;

export class UpdateStockOutDetailCommentDto extends createZodDto(UpdateStockOutDetailCommentSchema) {}

export interface StockOutDetailCommentResponse {
  id: string;
  stock_out_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
