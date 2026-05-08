import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustmentTypeCreateRequest {
  @ApiProperty({ description: 'Unique code for the adjustment type', example: 'ADJ-001' })
  code: string;

  @ApiProperty({ description: 'Name of the adjustment type', example: 'Stock Adjustment In' })
  name: string;

  @ApiProperty({ description: 'Type of adjustment', enum: ['STOCK_IN', 'STOCK_OUT'], example: 'STOCK_IN' })
  type: string;

  @ApiPropertyOptional({ description: 'Description of the adjustment type', example: 'Adjustment for incoming stock' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the adjustment type is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Used for inventory corrections' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info as JSON object', example: {} })
  info?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Dimension data as JSON array', example: [] })
  dimension?: unknown[];
}

export class AdjustmentTypeUpdateRequest {
  @ApiPropertyOptional({ description: 'Unique code for the adjustment type', example: 'ADJ-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Name of the adjustment type', example: 'Stock Adjustment In' })
  name?: string;

  @ApiPropertyOptional({ description: 'Type of adjustment', enum: ['STOCK_IN', 'STOCK_OUT'], example: 'STOCK_IN' })
  type?: string;

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
}
