import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnitCommentCreateRequest {
  @ApiProperty({ description: 'Unit ID to attach the comment to', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  unit_id: string;

  @ApiPropertyOptional({ description: 'Comment message', example: 'This unit requires attention' })
  message?: string;

  @ApiPropertyOptional({ description: 'Attachments (JSON)', example: [] })
  attachments?: unknown;
}

export class UnitCommentUpdateRequest {
  @ApiPropertyOptional({ description: 'Comment message', example: 'Updated comment message' })
  message?: string;

  @ApiPropertyOptional({ description: 'Attachments (JSON)', example: [] })
  attachments?: unknown;
}
