import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseRequestDetailCommentResponseDto {
  @ApiProperty({ description: 'Comment ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
  @ApiProperty({ description: 'PurchaseRequestDetail ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  purchase_request_detail_id: string;
  @ApiPropertyOptional({ description: 'Comment type', enum: ['user', 'system'], example: 'user' })
  type?: string;
  @ApiPropertyOptional({ description: 'User ID of comment author', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id?: string;
  @ApiPropertyOptional({ description: 'Comment message', example: 'This is a comment' })
  message?: string;
  @ApiPropertyOptional({ description: 'File attachments (JSON)', example: [] })
  attachments?: unknown;
  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;
  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;
  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;
  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;
  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class PurchaseRequestDetailCommentListResponseDto {
  @ApiProperty({ description: 'List of purchase-request-detail comment records', type: [PurchaseRequestDetailCommentResponseDto] })
  data: PurchaseRequestDetailCommentResponseDto[];
  @ApiPropertyOptional({ description: 'Total count', example: 50 })
  total?: number;
  @ApiPropertyOptional({ description: 'Current page', example: 1 })
  page?: number;
  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class PurchaseRequestDetailCommentMutationResponseDto {
  @ApiProperty({ description: 'PurchaseRequestDetail comment ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
