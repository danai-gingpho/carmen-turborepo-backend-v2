import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateVendorCommentSchema = z.object({
  vendor_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateVendorComment = z.infer<typeof CreateVendorCommentSchema>;

export class CreateVendorCommentDto extends createZodDto(CreateVendorCommentSchema) {}

export const UpdateVendorCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateVendorComment = z.infer<typeof UpdateVendorCommentSchema>;

export class UpdateVendorCommentDto extends createZodDto(UpdateVendorCommentSchema) {}

export interface VendorCommentResponse {
  id: string;
  vendor_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
