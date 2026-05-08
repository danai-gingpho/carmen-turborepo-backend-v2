import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PhysicalCountCreateRequestDto {
  @ApiProperty({ description: 'Physical count period ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  physical_count_period_id: string;

  @ApiProperty({ description: 'Location ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Description of the physical count', example: 'Monthly stock count for kitchen storage' })
  description?: string | null;
}

export class PhysicalCountUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Description of the physical count', example: 'Updated description for physical count' })
  description?: string | null;
}

export class PhysicalCountSaveItemDto {
  @ApiProperty({ description: 'Physical count detail ID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  id: string;

  @ApiProperty({ description: 'Counted quantity', example: 150.5 })
  actual_qty: number;
}

export class PhysicalCountSaveItemsRequestDto {
  @ApiProperty({
    description: 'Array of items with counted quantities',
    type: [PhysicalCountSaveItemDto],
  })
  items: PhysicalCountSaveItemDto[];
}

export class PhysicalCountDetailCommentAttachmentDto {
  @ApiProperty({ description: 'Original file name', example: 'photo_001.jpg' })
  originalName: string;

  @ApiProperty({ description: 'File token for uploaded file', example: 'token-abc-123' })
  fileToken: string;

  @ApiProperty({ description: 'MIME content type', example: 'image/jpeg' })
  contentType: string;
}

export class PhysicalCountDetailCommentRequestDto {
  @ApiPropertyOptional({ description: 'Comment message text', example: 'Found discrepancy in this item count' })
  message?: string | null;

  @ApiPropertyOptional({
    description: 'Attached files for evidence',
    type: [PhysicalCountDetailCommentAttachmentDto],
    default: [],
  })
  attachments?: PhysicalCountDetailCommentAttachmentDto[];
}
