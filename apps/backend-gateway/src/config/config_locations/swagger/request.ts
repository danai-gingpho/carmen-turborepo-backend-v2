import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationCreateRequestDto {
  @ApiProperty({ description: 'Location code', example: 'LOC-001' })
  code: string;

  @ApiProperty({ description: 'Location name', example: 'Main Warehouse' })
  name: string;

  @ApiPropertyOptional({ description: 'Location type', example: 'inventory', enum: ['inventory', 'direct'] })
  location_type?: string;

  @ApiPropertyOptional({ description: 'Location description', example: 'Central warehouse for dry goods storage' })
  description?: string;

  @ApiPropertyOptional({ description: 'Delivery point ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  delivery_point_id?: string;

  @ApiPropertyOptional({ description: 'Delivery point name', example: 'Loading Dock A' })
  delivery_point_name?: string;

  @ApiPropertyOptional({ description: 'Physical count type', example: 'no', enum: ['no', 'daily', 'weekly', 'monthly'] })
  physical_count_type?: string;

  @ApiPropertyOptional({ description: 'Whether the location is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Temperature controlled area' })
  note?: string;
}

export class LocationUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Location code', example: 'LOC-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Warehouse' })
  name?: string;

  @ApiPropertyOptional({ description: 'Location type', example: 'inventory', enum: ['inventory', 'direct'] })
  location_type?: string;

  @ApiPropertyOptional({ description: 'Location description', example: 'Central warehouse for dry goods storage' })
  description?: string;

  @ApiPropertyOptional({ description: 'Delivery point ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  delivery_point_id?: string;

  @ApiPropertyOptional({ description: 'Physical count type', example: 'no', enum: ['no', 'daily', 'weekly', 'monthly'] })
  physical_count_type?: string;

  @ApiPropertyOptional({ description: 'Whether the location is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Temperature controlled area' })
  note?: string;
}
