import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export class CreatePurchaseRequestCommentDto extends createZodDto(
  CreatePurchaseRequestCommentSchema,
) {
  @ApiProperty({
    description: 'The ID of the purchase request',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  purchase_request_id: string;

  @ApiPropertyOptional({
    description: 'The comment message',
    example: 'This is a comment on the purchase request',
  })
  message?: string | null;

  @ApiPropertyOptional({
    description: 'The type of comment',
    enum: ['user', 'system'],
    default: 'user',
  })
  type?: 'user' | 'system';

  @ApiPropertyOptional({
    description: 'Array of file attachments (upload files via files.service first)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fileName: { type: 'string', example: 'document.pdf' },
        fileToken: { type: 'string', example: 'bu-code/uuid-here' },
        fileUrl: { type: 'string', example: 'https://minio.example.com/presigned-url' },
        contentType: { type: 'string', example: 'application/pdf' },
        size: { type: 'number', example: 1024 },
      },
    },
  })
  attachments?: Attachment[];
}

// Update comment schema
export const UpdatePurchaseRequestCommentSchema = z.object({
  message: z.string().optional().nullable(),
  attachments: z.array(AttachmentSchema).optional(),
});

export class UpdatePurchaseRequestCommentDto extends createZodDto(
  UpdatePurchaseRequestCommentSchema,
) {
  @ApiPropertyOptional({
    description: 'The updated comment message',
    example: 'Updated comment text',
  })
  message?: string | null;

  @ApiPropertyOptional({
    description: 'Updated array of file attachments (upload files via files.service first)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fileName: { type: 'string', example: 'document.pdf' },
        fileToken: { type: 'string', example: 'bu-code/uuid-here' },
        fileUrl: { type: 'string', example: 'https://minio.example.com/presigned-url' },
        contentType: { type: 'string', example: 'application/pdf' },
        size: { type: 'number', example: 1024 },
      },
    },
  })
  attachments?: Attachment[];
}

// Add attachment DTO
export class AddAttachmentDto {
  @ApiProperty({
    description: 'Original file name',
    example: 'document.pdf',
  })
  fileName: string;

  @ApiProperty({
    description: 'File token from the file service (format: bu_code/uuid)',
    example: 'bu-code/uuid-here',
  })
  fileToken: string;

  @ApiPropertyOptional({
    description: 'Presigned URL from the file service',
    example: 'https://minio.example.com/presigned-url',
  })
  fileUrl?: string;

  @ApiProperty({
    description: 'Content type of the file',
    example: 'application/pdf',
  })
  contentType: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024,
  })
  size?: number;
}
