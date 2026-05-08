import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentUploadResponseDto {
  @ApiProperty({ description: 'File token for accessing the document', example: 'ft_a1b2c3d4e5f67890' })
  fileToken: string;

  @ApiProperty({ description: 'Original file name', example: 'invoice-2026-001.pdf' })
  originalName: string;

  @ApiProperty({ description: 'File MIME type', example: 'application/pdf' })
  mimeType: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 204800 })
  size?: number;
}

export class DocumentListItemResponseDto {
  @ApiProperty({ description: 'File token', example: 'ft_a1b2c3d4e5f67890' })
  fileToken: string;

  @ApiProperty({ description: 'Original file name', example: 'invoice-2026-001.pdf' })
  originalName: string;

  @ApiProperty({ description: 'File MIME type', example: 'application/pdf' })
  mimeType: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 204800 })
  size?: number;

  @ApiPropertyOptional({ description: 'Upload timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;
}

export class DocumentInfoResponseDto {
  @ApiProperty({ description: 'File token', example: 'ft_a1b2c3d4e5f67890' })
  fileToken: string;

  @ApiProperty({ description: 'Original file name', example: 'invoice-2026-001.pdf' })
  originalName: string;

  @ApiProperty({ description: 'File MIME type', example: 'application/pdf' })
  mimeType: string;

  @ApiPropertyOptional({ description: 'File size in bytes', example: 204800 })
  size?: number;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Upload timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Uploaded by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;
}

export class DocumentPresignedUrlResponseDto {
  @ApiProperty({ description: 'Presigned URL for document access', example: 'https://storage.example.com/documents/ft_a1b2c3d4e5f67890?token=xyz' })
  url: string;

  @ApiPropertyOptional({ description: 'URL expiry time in seconds', example: 3600 })
  expiresIn?: number;
}

export class DocumentDeleteResponseDto {
  @ApiProperty({ description: 'Whether the deletion was successful', example: true })
  success: boolean;

  @ApiPropertyOptional({ description: 'Deleted file token', example: 'ft_a1b2c3d4e5f67890' })
  fileToken?: string;
}

export class DocumentListResponseDto {
  @ApiProperty({ description: 'List of Document records', type: [DocumentListItemResponseDto] })
  data: DocumentListItemResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class DocumentMutationResponseDto {
  @ApiProperty({ description: 'File token', example: 'ft_a1b2c3d4e5f67890' })
  fileToken: string;
}
