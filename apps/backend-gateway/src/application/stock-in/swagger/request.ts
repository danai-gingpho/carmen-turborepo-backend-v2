import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockInDetailSwaggerDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Chicken breast delivery' })
  description?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Chicken Breast' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'อกไก่' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 10.0 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Cost per unit', example: 150.50 })
  cost_per_unit?: number;

  @ApiPropertyOptional({ description: 'Total cost', example: 1505.00 })
  total_cost?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Checked quality on arrival' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class UpdateStockInDetailSwaggerDto {
  @ApiProperty({ description: 'Detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Updated description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Chicken Breast' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'อกไก่' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 15.0 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Cost per unit', example: 155.00 })
  cost_per_unit?: number;

  @ApiPropertyOptional({ description: 'Total cost', example: 2325.00 })
  total_cost?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Updated note' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class RemoveStockInDetailSwaggerDto {
  @ApiProperty({ description: 'Detail ID to remove', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class StockInDetailOperationsSwaggerDto {
  @ApiPropertyOptional({ description: 'Details to add', type: [CreateStockInDetailSwaggerDto] })
  add?: CreateStockInDetailSwaggerDto[];

  @ApiPropertyOptional({ description: 'Details to update', type: [UpdateStockInDetailSwaggerDto] })
  update?: UpdateStockInDetailSwaggerDto[];

  @ApiPropertyOptional({ description: 'Details to remove', type: [RemoveStockInDetailSwaggerDto] })
  remove?: RemoveStockInDetailSwaggerDto[];
}

export class CreateStockInSwaggerDto {
  @ApiPropertyOptional({ description: 'Stock In date', example: '2026-03-26T00:00:00.000Z' })
  si_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Stock adjustment - items found during count' })
  description?: string;

  @ApiPropertyOptional({ description: 'Adjustment type ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  adjustment_type_id?: string;

  @ApiPropertyOptional({ description: 'Adjustment type code', example: 'ADJ-IN' })
  adjustment_type_code?: string;

  @ApiPropertyOptional({ description: 'Document status', example: 'draft' })
  doc_status?: string;

  @ApiPropertyOptional({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id?: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'MAIN-STORE' })
  location_code?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Store' })
  location_name?: string;

  @ApiPropertyOptional({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Found during physical count' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Stock In details (line items)', type: StockInDetailOperationsSwaggerDto })
  stock_in_detail?: StockInDetailOperationsSwaggerDto;
}

export class UpdateStockInSwaggerDto {
  @ApiPropertyOptional({ description: 'Stock In date', example: '2026-03-26T00:00:00.000Z' })
  si_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Updated stock adjustment' })
  description?: string;

  @ApiPropertyOptional({ description: 'Adjustment type ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  adjustment_type_id?: string;

  @ApiPropertyOptional({ description: 'Adjustment type code', example: 'ADJ-IN' })
  adjustment_type_code?: string;

  @ApiPropertyOptional({ description: 'Document status', example: 'draft' })
  doc_status?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Updated note' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Stock In details (line items)', type: StockInDetailOperationsSwaggerDto })
  stock_in_detail?: StockInDetailOperationsSwaggerDto;
}
