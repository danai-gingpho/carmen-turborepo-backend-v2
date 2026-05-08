import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const UploadCommentWithFilesBodySchema = z.object({
  message: z.string().max(4000).optional().nullable(),
  type: z.enum(['user', 'system']).default('user'),
});

export type UploadCommentWithFilesBody = z.infer<typeof UploadCommentWithFilesBodySchema>;

export class UploadCommentWithFilesBodyDto extends createZodDto(
  UploadCommentWithFilesBodySchema,
) {}

/**
 * Swagger-only DTO describing the multipart/form-data shape.
 * Not used for runtime validation (the Zod schema above handles body fields,
 * and the FilesInterceptor handles `files`).
 */
export class UploadCommentWithFilesDto {
  @ApiPropertyOptional({
    description: 'Comment message (≤ 4000 chars). Required if no files.',
    example: 'Comment message',
    nullable: true,
  })
  message?: string | null;

  @ApiPropertyOptional({
    description: 'Comment type',
    enum: ['user', 'system'],
    default: 'user',
  })
  type?: 'user' | 'system';

  @ApiPropertyOptional({
    description:
      'Attachments (0–10 files). Allowed mime: image/jpeg, image/png, image/webp, image/gif, application/pdf. Max 10 MB each.',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  files?: unknown[];
}
