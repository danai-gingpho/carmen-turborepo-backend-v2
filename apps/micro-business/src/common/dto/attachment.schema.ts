import { z } from 'zod';

export const AttachmentSchema = z.object({
  fileName: z.string(),
  fileToken: z.string(), // Token from files.service (format: bu_code/uuid)
  fileUrl: z.string().optional(), // Presigned URL from files.service
  contentType: z.string(),
  size: z.number().optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;
