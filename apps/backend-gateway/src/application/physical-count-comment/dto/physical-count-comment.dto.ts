import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const AttachmentSchema = z.object({
  fileName: z.string(),
  fileToken: z.string(),
  fileUrl: z.string().optional(),
  contentType: z.string(),
  size: z.number().optional(),
});

export type Attachment = z.infer<typeof AttachmentSchema>;

/**
 * Multipart body schema for PATCH update.
 * - `message` and `type` are plain text fields.
 * - `remove_attachments` is sent as a JSON-encoded string array of fileTokens
 *   (multipart cannot carry nested JSON natively).
 * - New files arrive via the `files` field (handled by FilesInterceptor).
 */
export const UpdatePhysicalCountCommentBodySchema = z.object({
  message: z.string().max(4000).optional().nullable(),
  type: z.enum(['user', 'system']).optional(),
  remove_attachments: z
    .preprocess((v) => {
      if (typeof v !== 'string') return v;
      const trimmed = v.trim();
      if (trimmed === '') return undefined;
      try {
        return JSON.parse(trimmed);
      } catch {
        return v;
      }
    }, z.array(z.string().min(1)).optional())
    .optional(),
});

export type UpdatePhysicalCountCommentBody = z.infer<typeof UpdatePhysicalCountCommentBodySchema>;

export class UpdatePhysicalCountCommentDto {
  @ApiPropertyOptional({
    description: 'Updated comment message (≤ 4000 chars)',
    example: 'Updated comment',
    nullable: true,
  })
  message?: string | null;

  @ApiPropertyOptional({
    description: 'Comment type',
    enum: ['user', 'system'],
  })
  type?: 'user' | 'system';

  @ApiPropertyOptional({
    description:
      'JSON-encoded string array of fileTokens to remove, e.g. \`["tok-1","tok-2"]\`',
    example: '["tok-1","tok-2"]',
  })
  remove_attachments?: string;

  @ApiPropertyOptional({
    description:
      'New attachments to add (0–10 files). Allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf. Max 10 MB each.',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  files?: unknown[];
}

export class UpdatePhysicalCountCommentBodyDto extends createZodDto(
  UpdatePhysicalCountCommentBodySchema,
) {}

/**
 * Swagger-only DTO for POST `:id/attachment` (multipart/form-data).
 * Runtime validation: count/size/mime checks performed in the controller.
 */
export class AddAttachmentsDto {
  @ApiPropertyOptional({
    description:
      'Attachments to add (1–10 files). Allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf. Max 10 MB each.',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  files?: unknown[];
}
