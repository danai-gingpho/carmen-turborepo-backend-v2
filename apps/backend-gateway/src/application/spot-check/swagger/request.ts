import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpotCheckCreateRequestDto {
  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Spot check method', example: 'random', enum: ['random', 'manual'] })
  method?: string;

  @ApiPropertyOptional({ description: 'Number of items to spot check (for random method)', example: 10 })
  items?: number | null;

  @ApiPropertyOptional({
    description: 'Array of product IDs (required for manual method)',
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
  })
  product_id?: string[] | null;

  @ApiPropertyOptional({ description: 'Description', example: 'Weekly spot check for dry goods storage' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Note', example: 'Focus on high-value items' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class SpotCheckUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Description', example: 'Updated spot check description' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Note', example: 'Updated note' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class SpotCheckSaveItemDto {
  @ApiProperty({ description: 'Spot check detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Counted quantity', example: 42.5 })
  actual_qty: number;
}

export class SpotCheckSaveItemsRequestDto {
  @ApiProperty({
    description: 'Array of items with counted quantities',
    type: [SpotCheckSaveItemDto],
  })
  items: SpotCheckSaveItemDto[];
}
