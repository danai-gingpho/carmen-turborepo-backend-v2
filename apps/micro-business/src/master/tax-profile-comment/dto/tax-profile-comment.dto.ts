import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateTaxProfileCommentSchema = z.object({
  tax_profile_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateTaxProfileComment = z.infer<typeof CreateTaxProfileCommentSchema>;

export class CreateTaxProfileCommentDto extends createZodDto(CreateTaxProfileCommentSchema) {}

export const UpdateTaxProfileCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateTaxProfileComment = z.infer<typeof UpdateTaxProfileCommentSchema>;

export class UpdateTaxProfileCommentDto extends createZodDto(UpdateTaxProfileCommentSchema) {}

export interface TaxProfileCommentResponse {
  id: string;
  tax_profile_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
