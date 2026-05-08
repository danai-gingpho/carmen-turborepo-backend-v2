import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty({ description: 'Original file name', example: 'document.pdf' })
  fileName: string;

  @ApiProperty({ description: 'File token from file service (format: bu_code/uuid)', example: 'bu-code/uuid-here' })
  fileToken: string;

  @ApiPropertyOptional({ description: 'Presigned URL from file service', example: 'https://minio.example.com/presigned-url' })
  fileUrl?: string;

  @ApiProperty({ description: 'Content type of the file', example: 'application/pdf' })
  contentType: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1024 })
  size?: number;
}

export class CreatePurchaseRequestCommentRequestDto {
  @ApiProperty({ description: 'The ID of the purchase request', example: '123e4567-e89b-12d3-a456-426614174000' })
  purchase_request_id: string;

  @ApiPropertyOptional({ description: 'The comment message', example: 'This is a comment on the purchase request' })
  message?: string | null;

  @ApiPropertyOptional({ description: 'The type of comment', enum: ['user', 'system'], default: 'user', example: 'user' })
  type?: string;

  @ApiPropertyOptional({ description: 'Array of file attachments', type: [AttachmentDto] })
  attachments?: AttachmentDto[];
}

export class UpdatePurchaseRequestCommentRequestDto {
  @ApiPropertyOptional({ description: 'The updated comment message', example: 'Updated comment text' })
  message?: string | null;

  @ApiPropertyOptional({ description: 'Updated array of file attachments', type: [AttachmentDto] })
  attachments?: AttachmentDto[];
}

export class AddAttachmentRequestDto {
  @ApiProperty({ description: 'Original file name', example: 'document.pdf' })
  fileName: string;

  @ApiProperty({ description: 'File token from file service (format: bu_code/uuid)', example: 'bu-code/uuid-here' })
  fileToken: string;

  @ApiPropertyOptional({ description: 'Presigned URL from file service', example: 'https://minio.example.com/presigned-url' })
  fileUrl?: string;

  @ApiProperty({ description: 'Content type of the file', example: 'application/pdf' })
  contentType: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1024 })
  size?: number;
}
