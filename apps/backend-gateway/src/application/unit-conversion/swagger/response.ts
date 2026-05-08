import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnitConversionResponseDto {
  @ApiProperty({ description: 'Unit conversion ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Unit type (e.g. order, recipe, count)', example: 'order' })
  unit_type?: string;

  @ApiPropertyOptional({ description: 'From unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  from_unit_id?: string;

  @ApiProperty({ description: 'From unit name', example: 'kg' })
  from_unit_name: string;

  @ApiPropertyOptional({ description: 'From unit quantity', example: 1 })
  from_unit_qty?: number;

  @ApiPropertyOptional({ description: 'To unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  to_unit_id?: string;

  @ApiProperty({ description: 'To unit name', example: 'g' })
  to_unit_name: string;

  @ApiPropertyOptional({ description: 'To unit quantity', example: 1000 })
  to_unit_qty?: number;

  @ApiPropertyOptional({ description: 'Whether this is the default conversion', example: false })
  is_default?: boolean;

  @ApiPropertyOptional({ description: 'Description (JSON)', example: {} })
  description?: unknown;

  @ApiPropertyOptional({ description: 'Whether the conversion is active', example: true })
  is_active?: boolean;

  @ApiProperty({
    description: 'Number of decimal places for display and rounding',
    example: 2,
    minimum: 0,
  })
  decimal_place: number;

  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
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

export class UnitConversionListResponseDto {
  @ApiProperty({ description: 'List of unit conversion records', type: [UnitConversionResponseDto] })
  data: UnitConversionResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}
