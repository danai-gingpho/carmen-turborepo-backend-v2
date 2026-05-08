import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationResponseDto {
  @ApiProperty({ description: 'Location ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Location code', example: 'LOC-001' })
  code: string;

  @ApiProperty({ description: 'Location name', example: 'Main Warehouse' })
  name: string;

  @ApiPropertyOptional({ description: 'Location type', example: 'inventory' })
  location_type?: string;

  @ApiPropertyOptional({ description: 'Location description', example: 'Central warehouse for dry goods storage' })
  description?: string;

  @ApiPropertyOptional({ description: 'Delivery point ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  delivery_point_id?: string;

  @ApiPropertyOptional({ description: 'Delivery point name', example: 'Loading Dock A' })
  delivery_point_name?: string;

  @ApiPropertyOptional({ description: 'Physical count type', example: 'no' })
  physical_count_type?: string;

  @ApiPropertyOptional({ description: 'Whether the location is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Temperature controlled area' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-01-15T10:30:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-01-15T10:30:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class LocationListResponseDto {
  @ApiProperty({ description: 'List of Location records', type: [LocationResponseDto] })
  data: LocationResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class LocationMutationResponseDto {
  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
