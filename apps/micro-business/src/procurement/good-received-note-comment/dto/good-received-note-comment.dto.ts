import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateGoodReceivedNoteCommentSchema = z.object({
  good_received_note_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateGoodReceivedNoteComment = z.infer<typeof CreateGoodReceivedNoteCommentSchema>;

export class CreateGoodReceivedNoteCommentDto extends createZodDto(CreateGoodReceivedNoteCommentSchema) {}

export const UpdateGoodReceivedNoteCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateGoodReceivedNoteComment = z.infer<typeof UpdateGoodReceivedNoteCommentSchema>;

export class UpdateGoodReceivedNoteCommentDto extends createZodDto(UpdateGoodReceivedNoteCommentSchema) {}

export interface GoodReceivedNoteCommentResponse {
  id: string;
  good_received_note_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
