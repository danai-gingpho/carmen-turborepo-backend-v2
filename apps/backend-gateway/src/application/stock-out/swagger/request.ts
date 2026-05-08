import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStockOutDetailSwaggerDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Spoiled chicken breast' })
  description?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Chicken Breast' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'อกไก่' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 5.0 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Expired items' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class UpdateStockOutDetailSwaggerDto {
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

  @ApiPropertyOptional({ description: 'Quantity', example: 8.0 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Updated note' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class RemoveStockOutDetailSwaggerDto {
  @ApiProperty({ description: 'Detail ID to remove', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class StockOutDetailOperationsSwaggerDto {
  @ApiPropertyOptional({ description: 'Details to add', type: [CreateStockOutDetailSwaggerDto] })
  add?: CreateStockOutDetailSwaggerDto[];

  @ApiPropertyOptional({ description: 'Details to update', type: [UpdateStockOutDetailSwaggerDto] })
  update?: UpdateStockOutDetailSwaggerDto[];

  @ApiPropertyOptional({ description: 'Details to remove', type: [RemoveStockOutDetailSwaggerDto] })
  remove?: RemoveStockOutDetailSwaggerDto[];
}

export class CreateStockOutSwaggerDto {
  @ApiPropertyOptional({ description: 'Stock Out date', example: '2026-03-26T00:00:00.000Z' })
  so_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Stock adjustment - spoiled items' })
  description?: string;

  @ApiPropertyOptional({ description: 'Adjustment type ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  adjustment_type_id?: string;

  @ApiPropertyOptional({ description: 'Adjustment type code', example: 'ADJ-OUT' })
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

  @ApiPropertyOptional({ description: 'Note', example: 'Spoiled items removed from inventory' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Stock Out details (line items)', type: StockOutDetailOperationsSwaggerDto })
  stock_out_detail?: StockOutDetailOperationsSwaggerDto;
}

export class UpdateStockOutSwaggerDto {
  @ApiPropertyOptional({ description: 'Stock Out date', example: '2026-03-26T00:00:00.000Z' })
  so_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Updated stock out adjustment' })
  description?: string;

  @ApiPropertyOptional({ description: 'Adjustment type ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  adjustment_type_id?: string;

  @ApiPropertyOptional({ description: 'Adjustment type code', example: 'ADJ-OUT' })
  adjustment_type_code?: string;

  @ApiPropertyOptional({ description: 'Document status', example: 'draft' })
  doc_status?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Updated note' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Stock Out details (line items)', type: StockOutDetailOperationsSwaggerDto })
  stock_out_detail?: StockOutDetailOperationsSwaggerDto;
}
