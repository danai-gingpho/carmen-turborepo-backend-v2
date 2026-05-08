import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import {
  AttachmentSchema,
  Attachment,
} from '../../../common/dto/attachment.schema';

export { AttachmentSchema, Attachment };

export const CreateVendorBusinessTypeCommentSchema = z.object({
  vendor_business_type_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreateVendorBusinessTypeComment = z.infer<typeof CreateVendorBusinessTypeCommentSchema>;

export class CreateVendorBusinessTypeCommentDto extends createZodDto(CreateVendorBusinessTypeCommentSchema) {}

export const UpdateVendorBusinessTypeCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdateVendorBusinessTypeComment = z.infer<typeof UpdateVendorBusinessTypeCommentSchema>;

export class UpdateVendorBusinessTypeCommentDto extends createZodDto(UpdateVendorBusinessTypeCommentSchema) {}

export interface VendorBusinessTypeCommentResponse {
  id: string;
  vendor_business_type_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
