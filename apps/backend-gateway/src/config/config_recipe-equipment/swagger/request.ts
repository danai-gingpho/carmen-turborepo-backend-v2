import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecipeEquipmentCreateRequest {
  @ApiProperty({ description: 'Equipment code', example: 'EQ-001' })
  code: string;

  @ApiProperty({ description: 'Equipment name', example: 'Commercial Oven' })
  name: string;

  @ApiPropertyOptional({ description: 'Equipment description', example: 'Large capacity commercial oven' })
  description?: string;

  @ApiPropertyOptional({ description: 'Equipment category ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  category_id?: string;

  @ApiPropertyOptional({ description: 'Brand name', example: 'Rational' })
  brand?: string;

  @ApiPropertyOptional({ description: 'Model number', example: 'SCC-61' })
  model?: string;

  @ApiPropertyOptional({ description: 'Serial number', example: 'SN-2026-001' })
  serial_no?: string;

  @ApiPropertyOptional({ description: 'Capacity', example: '6 trays' })
  capacity?: string;

  @ApiPropertyOptional({ description: 'Power rating', example: '10kW' })
  power_rating?: string;

  @ApiPropertyOptional({ description: 'Station assignment', example: 'Hot Kitchen' })
  station?: string;

  @ApiPropertyOptional({ description: 'Operation instructions', example: 'Preheat for 15 minutes before use' })
  operation_instructions?: string;

  @ApiPropertyOptional({ description: 'Safety notes', example: 'Wear heat-resistant gloves' })
  safety_notes?: string;

  @ApiPropertyOptional({ description: 'Cleaning instructions', example: 'Run self-cleaning cycle daily' })
  cleaning_instructions?: string;

  @ApiPropertyOptional({ description: 'Maintenance schedule', example: 'Monthly filter cleaning' })
  maintenance_schedule?: string;

  @ApiPropertyOptional({ description: 'Last maintenance date', example: '2026-02-15T00:00:00.000Z' })
  last_maintenance_date?: string;

  @ApiPropertyOptional({ description: 'Next maintenance date', example: '2026-03-15T00:00:00.000Z' })
  next_maintenance_date?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Primary oven for baking station' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the equipment is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Whether the equipment is portable', example: false, default: false })
  is_portable?: boolean;

  @ApiPropertyOptional({ description: 'Available quantity', example: 2 })
  available_qty?: number;

  @ApiPropertyOptional({ description: 'Total quantity', example: 3 })
  total_qty?: number;

  @ApiPropertyOptional({ description: 'Usage count', example: 150 })
  usage_count?: number;

  @ApiPropertyOptional({ description: 'Average usage time in minutes', example: 45.5 })
  average_usage_time?: number;

  @ApiPropertyOptional({ description: 'Attachments (JSON)', example: [] })
  attachments?: unknown;

  @ApiPropertyOptional({ description: 'Manual URLs (JSON)', example: [] })
  manuals_urls?: unknown;

  @ApiPropertyOptional({ description: 'Additional info as JSON', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data as JSON', example: {} })
  dimension?: unknown;
}

export class RecipeEquipmentUpdateRequest {
  @ApiPropertyOptional({ description: 'Equipment code', example: 'EQ-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Equipment name', example: 'Commercial Oven' })
  name?: string;

  @ApiPropertyOptional({ description: 'Equipment description', example: 'Large capacity commercial oven' })
  description?: string;

  @ApiPropertyOptional({ description: 'Equipment category ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  category_id?: string;

  @ApiPropertyOptional({ description: 'Brand name', example: 'Rational' })
  brand?: string;

  @ApiPropertyOptional({ description: 'Model number', example: 'SCC-61' })
  model?: string;

  @ApiPropertyOptional({ description: 'Serial number', example: 'SN-2026-001' })
  serial_no?: string;

  @ApiPropertyOptional({ description: 'Capacity', example: '6 trays' })
  capacity?: string;

  @ApiPropertyOptional({ description: 'Power rating', example: '10kW' })
  power_rating?: string;

  @ApiPropertyOptional({ description: 'Station assignment', example: 'Hot Kitchen' })
  station?: string;

  @ApiPropertyOptional({ description: 'Operation instructions', example: 'Preheat for 15 minutes before use' })
  operation_instructions?: string;

  @ApiPropertyOptional({ description: 'Safety notes', example: 'Wear heat-resistant gloves' })
  safety_notes?: string;

  @ApiPropertyOptional({ description: 'Cleaning instructions', example: 'Run self-cleaning cycle daily' })
  cleaning_instructions?: string;

  @ApiPropertyOptional({ description: 'Maintenance schedule', example: 'Monthly filter cleaning' })
  maintenance_schedule?: string;

  @ApiPropertyOptional({ description: 'Last maintenance date', example: '2026-02-15T00:00:00.000Z' })
  last_maintenance_date?: string;

  @ApiPropertyOptional({ description: 'Next maintenance date', example: '2026-03-15T00:00:00.000Z' })
  next_maintenance_date?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Primary oven for baking station' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the equipment is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Whether the equipment is portable', example: false })
  is_portable?: boolean;

  @ApiPropertyOptional({ description: 'Available quantity', example: 2 })
  available_qty?: number;

  @ApiPropertyOptional({ description: 'Total quantity', example: 3 })
  total_qty?: number;

  @ApiPropertyOptional({ description: 'Usage count', example: 150 })
  usage_count?: number;

  @ApiPropertyOptional({ description: 'Average usage time in minutes', example: 45.5 })
  average_usage_time?: number;

  @ApiPropertyOptional({ description: 'Attachments (JSON)', example: [] })
  attachments?: unknown;

  @ApiPropertyOptional({ description: 'Manual URLs (JSON)', example: [] })
  manuals_urls?: unknown;

  @ApiPropertyOptional({ description: 'Additional info as JSON', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data as JSON', example: {} })
  dimension?: unknown;
}
