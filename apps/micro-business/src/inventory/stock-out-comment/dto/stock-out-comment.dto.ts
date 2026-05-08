import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateStockOutCommentSchema = z.object({
  stock_out_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateStockOutComment = z.infer<typeof CreateStockOutCommentSchema>;

export class CreateStockOutCommentDto extends createZodDto(CreateStockOutCommentSchema) {}

export const UpdateStockOutCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateStockOutComment = z.infer<typeof UpdateStockOutCommentSchema>;

export class UpdateStockOutCommentDto extends createZodDto(UpdateStockOutCommentSchema) {}

export interface StockOutCommentResponse {
  id: string;
  stock_out_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
