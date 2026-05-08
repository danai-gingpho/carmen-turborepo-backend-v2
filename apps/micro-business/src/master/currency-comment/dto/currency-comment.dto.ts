import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateCurrencyCommentSchema = z.object({
  currency_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateCurrencyComment = z.infer<typeof CreateCurrencyCommentSchema>;

export class CreateCurrencyCommentDto extends createZodDto(CreateCurrencyCommentSchema) {}

export const UpdateCurrencyCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateCurrencyComment = z.infer<typeof UpdateCurrencyCommentSchema>;

export class UpdateCurrencyCommentDto extends createZodDto(UpdateCurrencyCommentSchema) {}

export interface CurrencyCommentResponse {
  id: string;
  currency_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
