import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty({ description: 'Original file name', example: 'document.pdf' }) fileName: string;
  @ApiProperty({ description: 'File token (format: bu_code/uuid)', example: 'bu-code/uuid-here' }) fileToken: string;
  @ApiPropertyOptional({ description: 'Presigned URL', example: 'https://minio.example.com/url' }) fileUrl?: string;
  @ApiProperty({ description: 'Content type', example: 'application/pdf' }) contentType: string;
  @ApiPropertyOptional({ description: 'File size in bytes', example: 1024 }) size?: number;
}

export class CreateConfigRunningCodeCommentRequestDto {
  @ApiProperty({ description: 'The ID of the config-running-code', example: '123e4567-e89b-12d3-a456-426614174000' }) config_running_code_id: string;
  @ApiPropertyOptional({ description: 'Comment message', example: 'This is a comment' }) message?: string | null;
  @ApiPropertyOptional({ description: 'Comment type', enum: ['user', 'system'], default: 'user', example: 'user' }) type?: string;
  @ApiPropertyOptional({ description: 'File attachments', type: [AttachmentDto] }) attachments?: AttachmentDto[];
}

export class UpdateConfigRunningCodeCommentRequestDto {
  @ApiPropertyOptional({ description: 'Updated message', example: 'Updated comment' }) message?: string | null;
  @ApiPropertyOptional({ description: 'Updated file attachments', type: [AttachmentDto] }) attachments?: AttachmentDto[];
}

export class AddAttachmentRequestDto {
  @ApiProperty({ description: 'Original file name', example: 'document.pdf' }) fileName: string;
  @ApiProperty({ description: 'File token (format: bu_code/uuid)', example: 'bu-code/uuid-here' }) fileToken: string;
  @ApiPropertyOptional({ description: 'Presigned URL', example: 'https://minio.example.com/url' }) fileUrl?: string;
  @ApiProperty({ description: 'Content type', example: 'application/pdf' }) contentType: string;
  @ApiPropertyOptional({ description: 'File size in bytes', example: 1024 }) size?: number;
}
