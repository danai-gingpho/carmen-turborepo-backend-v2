import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockOutDetailCreateRequestDto {
  @ApiProperty({ description: 'Stock out ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  stock_out_id: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Kitchen usage - dinner service' })
  description?: string;

  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 50 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Used for evening service' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class StockOutDetailUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Updated description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 50 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Updated notes' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}
