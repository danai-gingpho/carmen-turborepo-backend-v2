import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateCreditTermCommentSchema = z.object({
  credit_term_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateCreditTermComment = z.infer<typeof CreateCreditTermCommentSchema>;

export class CreateCreditTermCommentDto extends createZodDto(CreateCreditTermCommentSchema) {}

export const UpdateCreditTermCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateCreditTermComment = z.infer<typeof UpdateCreditTermCommentSchema>;

export class UpdateCreditTermCommentDto extends createZodDto(UpdateCreditTermCommentSchema) {}

export interface CreditTermCommentResponse {
  id: string;
  credit_term_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
