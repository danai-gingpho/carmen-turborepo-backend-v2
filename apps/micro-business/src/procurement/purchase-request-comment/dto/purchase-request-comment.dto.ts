import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Attachment schema for files
// After uploading to MinIO via files.service, store the fileToken and fileUrl
export const AttachmentSchema = z.object({
  fileName: z.string(), // Original file name
  fileToken: z.string(), // Token from files.service (format: bu_code/uuid)
  fileUrl: z.string().optional(), // Presigned URL from files.service
  contentType: z.string(),
  size: z.number().optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

// Create comment schema
export const CreatePurchaseRequestCommentSchema = z.object({
  purchase_request_id: z.string().uuid(),
  message: z.string().optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
  attachments: z.array(AttachmentSchema).optional().default([]),
});

export type CreatePurchaseRequestComment = z.infer<typeof CreatePurchaseRequestCommentSchema>;

export class CreatePurchaseRequestCommentDto extends createZodDto(CreatePurchaseRequestCommentSchema) {}

// Update comment schema
export const UpdatePurchaseRequestCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export type UpdatePurchaseRequestComment = z.infer<typeof UpdatePurchaseRequestCommentSchema>;

export class UpdatePurchaseRequestCommentDto extends createZodDto(UpdatePurchaseRequestCommentSchema) {}

// Response interface
export interface PurchaseRequestCommentResponse {
  id: string;
  purchase_request_id: string;
  type: 'user' | 'system';
  user_id: string | null;
  message: string | null;
  attachments: Attachment[];
  created_at: string;
  created_by_id: string | null;
  updated_at: string;
  updated_by_id: string | null;
}
