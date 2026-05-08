import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustmentTypeResponseDto {
  @ApiProperty({ description: 'Adjustment type ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Unique code for the adjustment type', example: 'ADJ-001' })
  code: string;

  @ApiProperty({ description: 'Name of the adjustment type', example: 'Stock Adjustment In' })
  name: string;

  @ApiProperty({ description: 'Type of adjustment', enum: ['STOCK_IN', 'STOCK_OUT'], example: 'STOCK_IN' })
  type: string;

  @ApiPropertyOptional({ description: 'Description of the adjustment type', example: 'Adjustment for incoming stock' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the adjustment type is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Used for inventory corrections' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info as JSON object', example: {} })
  info?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Dimension data as JSON array', example: [] })
  dimension?: unknown[];

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'ID of the user who created the record', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'ID of the user who last updated the record', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class AdjustmentTypeListResponseDto {
  @ApiProperty({ description: 'List of Adjustment Type records', type: [AdjustmentTypeResponseDto] })
  data: AdjustmentTypeResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class AdjustmentTypeMutationResponseDto {
  @ApiProperty({ description: 'Adjustment Type ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
