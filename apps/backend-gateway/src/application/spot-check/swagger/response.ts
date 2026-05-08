import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SpotCheckDetailResponseDto {
  @ApiProperty({ description: 'Spot check detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Spot check ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  spot_check_id: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiProperty({ description: 'Product ID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Olive Oil 1L' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'น้ำมันมะกอก 1 ลิตร' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'SKU-OIL-001' })
  product_sku?: string;

  @ApiProperty({ description: 'Inventory unit ID', example: 'd4e5f6a7-b8c9-0123-defa-234567890123' })
  inventory_unit_id: string;

  @ApiPropertyOptional({ description: 'On-hand quantity from system', example: 50.0 })
  on_hand_qty?: number;

  @ApiPropertyOptional({ description: 'Counted quantity', example: 48.0 })
  actual_qty?: number;

  @ApiPropertyOptional({ description: 'Difference quantity (actual_qty - on_hand_qty)', example: -2.0 })
  diff_qty?: number;

  @ApiPropertyOptional({ description: 'Counted at timestamp', example: '2026-03-10T09:30:00.000Z' })
  counted_at?: Date;

  @ApiPropertyOptional({ description: 'Counted by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  counted_by_id?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Item description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Item note' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T08:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class SpotCheckResponseDto {
  @ApiProperty({ description: 'Spot check ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Spot check number', example: 'SC-2026-0001' })
  spot_check_no?: string;

  @ApiProperty({ description: 'Start date', example: '2026-03-10T00:00:00.000Z' })
  start_date: Date;

  @ApiPropertyOptional({ description: 'End date', example: '2026-03-10T12:00:00.000Z' })
  end_date?: Date;

  @ApiProperty({ description: 'Location ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'LOC-001' })
  location_code?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Kitchen' })
  location_name?: string;

  @ApiProperty({ description: 'Document status', example: 'pending', enum: ['pending', 'in_progress', 'void', 'completed'] })
  doc_status: string;

  @ApiProperty({ description: 'Spot check method', example: 'random', enum: ['random', 'high_value', 'manual'] })
  method: string;

  @ApiProperty({ description: 'Sample size', example: 10 })
  size: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Weekly spot check' })
  description?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Focus on high-value items' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T08:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Spot check details (line items)', type: [SpotCheckDetailResponseDto] })
  tb_spot_check_detail?: SpotCheckDetailResponseDto[];
}

export class SpotCheckListResponseDto {
  @ApiProperty({ description: 'List of Spot Check records', type: [SpotCheckResponseDto] })
  data: SpotCheckResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class SpotCheckMutationResponseDto {
  @ApiProperty({ description: 'Spot Check ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Spot check number', example: 'SC-2026-0001' })
  spot_check_no?: string;

  @ApiPropertyOptional({ description: 'Document status', example: 'draft' })
  doc_status?: string;
}

export class SpotCheckPendingCountResponseDto {
  @ApiProperty({ description: 'Number of pending spot checks', example: 5 })
  count: number;
}

// ==================== Current Spot Check by Location ====================

export class SpotCheckCurrentPeriodDto {
  @ApiProperty({ description: 'Period ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Period code (YYMM)', example: '2603' })
  period: string;

  @ApiProperty({ description: 'Period start date', example: '2026-03-01T00:00:00.000Z' })
  start_at: Date;

  @ApiProperty({ description: 'Period end date', example: '2026-03-31T23:59:59.999Z' })
  end_at: Date;
}

export class SpotCheckLatestDto {
  @ApiProperty({ description: 'Spot check ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Spot check number', example: 'SC260301001' })
  spot_check_no?: string;

  @ApiProperty({ description: 'Document status', example: 'pending', enum: ['pending', 'in_progress', 'void', 'completed'] })
  doc_status: string;

  @ApiProperty({ description: 'Method', example: 'random', enum: ['random', 'high_value', 'manual'] })
  method: string;

  @ApiProperty({ description: 'Sample size', example: 10 })
  size: number;

  @ApiProperty({ description: 'Number of items counted', example: 8 })
  counted: number;

  @ApiProperty({ description: 'Start date', example: '2026-03-15T08:00:00.000Z' })
  start_date: Date;

  @ApiPropertyOptional({ description: 'End date', example: '2026-03-15T10:00:00.000Z' })
  end_date?: Date;
}

export class SpotCheckLocationItemDto {
  @ApiProperty({ description: 'Location ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'LOC-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Kitchen' })
  name?: string;

  @ApiPropertyOptional({ description: 'Location type', example: 'inventory', enum: ['inventory', 'consignment'] })
  location_type?: string;

  @ApiPropertyOptional({ description: 'Physical count type', example: 'yes', enum: ['yes', 'no'] })
  physical_count_type?: string;

  @ApiProperty({ description: 'Total products in this location', example: 45 })
  total_products: number;

  @ApiProperty({ description: 'Number of spot checks in current period', example: 2 })
  spot_check_count: number;

  @ApiPropertyOptional({ description: 'Latest spot check for this location', type: SpotCheckLatestDto })
  latest_spot_check?: SpotCheckLatestDto;
}

export class SpotCheckCurrentResponseDto {
  @ApiProperty({ description: 'Locations with spot check status', type: [SpotCheckLocationItemDto] })
  data: SpotCheckLocationItemDto[];
}
