import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateCreditNoteDetailCommentSchema = z.object({
  credit_note_detail_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateCreditNoteDetailComment = z.infer<typeof CreateCreditNoteDetailCommentSchema>;

export class CreateCreditNoteDetailCommentDto extends createZodDto(CreateCreditNoteDetailCommentSchema) {}

export const UpdateCreditNoteDetailCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateCreditNoteDetailComment = z.infer<typeof UpdateCreditNoteDetailCommentSchema>;

export class UpdateCreditNoteDetailCommentDto extends createZodDto(UpdateCreditNoteDetailCommentSchema) {}

export interface CreditNoteDetailCommentResponse {
  id: string;
  credit_note_detail_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
