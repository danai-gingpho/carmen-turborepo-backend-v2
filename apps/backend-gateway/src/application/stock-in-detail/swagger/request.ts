import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockInDetailCreateRequestDto {
  @ApiProperty({ description: 'Stock in ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  stock_in_id: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Chicken breast delivery' })
  description?: string;

  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 100 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Cost per unit', example: 150.50 })
  cost_per_unit?: number;

  @ApiPropertyOptional({ description: 'Total cost', example: 15050.00 })
  total_cost?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Checked quality on arrival' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class StockInDetailUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Updated description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 100 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Cost per unit', example: 150.50 })
  cost_per_unit?: number;

  @ApiPropertyOptional({ description: 'Total cost', example: 15050.00 })
  total_cost?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Updated notes' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}
