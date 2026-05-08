import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateCreditNoteCommentSchema = z.object({
  credit_note_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateCreditNoteComment = z.infer<typeof CreateCreditNoteCommentSchema>;

export class CreateCreditNoteCommentDto extends createZodDto(CreateCreditNoteCommentSchema) {}

export const UpdateCreditNoteCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateCreditNoteComment = z.infer<typeof UpdateCreditNoteCommentSchema>;

export class UpdateCreditNoteCommentDto extends createZodDto(UpdateCreditNoteCommentSchema) {}

export interface CreditNoteCommentResponse {
  id: string;
  credit_note_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
