import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnitCreateRequestDto {
  @ApiProperty({ description: 'Unit name', example: 'Kilogram' })
  name: string;

  @ApiPropertyOptional({ description: 'Unit description', example: 'Standard metric unit of mass' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the unit is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({
    description:
      'Number of decimal places for display and rounding. Defaults to 2 if omitted.',
    example: 2,
    minimum: 0,
  })
  decimal_place?: number;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Used for dry goods' })
  note?: string;
}

export class UnitUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Unit name', example: 'Kilogram' })
  name?: string;

  @ApiPropertyOptional({ description: 'Unit description', example: 'Standard metric unit of mass' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the unit is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({
    description:
      'Number of decimal places for display and rounding. Defaults to 2 if omitted.',
    example: 2,
    minimum: 0,
  })
  decimal_place?: number;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Used for dry goods' })
  note?: string;
}
