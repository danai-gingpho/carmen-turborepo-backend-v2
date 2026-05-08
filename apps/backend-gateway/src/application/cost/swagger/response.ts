import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCostEstimateLotDto {
  @ApiProperty({ description: 'Lot number', example: 'ADI-2026-04-0001' })
  lot_no: string;

  @ApiProperty({ description: 'Quantity allocated from this lot', example: 3 })
  qty: number;

  @ApiProperty({ description: 'Cost per unit for this lot', example: 33 })
  cost_per_unit: number;

  @ApiProperty({ description: 'Line cost (qty × cost_per_unit)', example: 99 })
  line_cost: number;
}

export class ProductCostEstimateResponseDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Beef Tenderloin' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Inventory unit name', example: 'kg' })
  inventory_unit_name?: string;

  @ApiProperty({ description: 'Location ID', format: 'uuid' })
  location_id: string;

  @ApiPropertyOptional({ description: 'Location code', example: '1FB02' })
  location_code?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Kitchen' })
  location_name?: string;

  @ApiProperty({ description: 'Requested quantity to deduct', example: 5 })
  requested_qty: number;

  @ApiProperty({ description: 'Total cost for the requested quantity', example: 165 })
  total_cost: number;

  @ApiProperty({ description: 'Weighted average cost per unit', example: 33 })
  average_cost_per_unit: number;

  @ApiProperty({ description: 'Per-lot allocation (FIFO)', type: [ProductCostEstimateLotDto] })
  lots: ProductCostEstimateLotDto[];
}

export class LastReceivingResponseDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Beef Tenderloin' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Inventory unit name', example: 'kg' })
  inventory_unit_name?: string;

  @ApiProperty({ description: 'Transaction detail row id', format: 'uuid' })
  transaction_detail_id: string;

  @ApiProperty({ description: 'Parent inventory transaction id', format: 'uuid' })
  inventory_transaction_id: string;

  @ApiPropertyOptional({ description: 'Receiving document type', example: 'good_received_note' })
  doc_type?: string;

  @ApiPropertyOptional({ description: 'Receiving document number', example: 'GRN-2026-04-0007' })
  doc_no?: string;

  @ApiPropertyOptional({ description: 'Transaction date', example: '2026-04-24T07:19:40.263Z' })
  transaction_date?: Date;

  @ApiPropertyOptional({ description: 'Location ID', format: 'uuid' })
  location_id?: string;

  @ApiPropertyOptional({ description: 'Location code', example: '1FB02' })
  location_code?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Kitchen' })
  location_name?: string;

  @ApiPropertyOptional({ description: 'Lot number', example: 'ADI-2026-04-0006' })
  lot_no?: string;

  @ApiProperty({ description: 'Received quantity', example: 2 })
  qty: number;

  @ApiProperty({ description: 'Cost per unit at time of receiving', example: 13 })
  cost_per_unit: number;

  @ApiProperty({ description: 'Total cost for the received quantity', example: 26 })
  total_cost: number;
}
