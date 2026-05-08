import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddAttachmentDto {
  @ApiProperty({ description: 'Original file name', example: 'document.pdf' })
  fileName: string;

  @ApiProperty({ description: 'File token (format: bu_code/uuid)', example: 'bu-code/uuid-here' })
  fileToken: string;

  @ApiPropertyOptional({ description: 'Presigned URL', example: 'https://minio.example.com/presigned-url' })
  fileUrl?: string;

  @ApiProperty({ description: 'Content type', example: 'application/pdf' })
  contentType: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 1024 })
  size?: number;
}
