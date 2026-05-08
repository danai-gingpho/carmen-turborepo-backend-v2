import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UnitResponseDto {
  @ApiProperty({ description: 'Unit ID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  id: string;

  @ApiPropertyOptional({ description: 'Unit name', example: 'Bottle' })
  name?: string;
}

export class ProductLocationResponseDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Product name', example: 'Olive Oil 1L' })
  name: string;

  @ApiProperty({ description: 'Product code', example: 'PRD-001' })
  code: string;

  @ApiProperty({ description: 'Inventory unit', type: UnitResponseDto })
  inventory_unit: UnitResponseDto;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class ProductListResponseDto {
  @ApiProperty({ description: 'List of Product records', type: [ProductLocationResponseDto] })
  data: ProductLocationResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

// ==================== Product Cost Response ====================

export class ProductCostResponseDto {
  @ApiProperty({ description: 'Total cost for the requested quantity', example: 1500.25 })
  total_cost: number;

  @ApiProperty({ description: 'Cost per unit from each lot (FIFO)', example: [150.00, 155.50], type: [Number] })
  cost_per_unit: number[];

  @ApiProperty({ description: 'Lot numbers used for cost allocation', example: ['LOT-2603-001', 'LOT-2603-002'], type: [String] })
  lot_no: string[];

  @ApiProperty({ description: 'Location ID', format: 'uuid', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  location_id: string;

  @ApiProperty({ description: 'Location name', example: 'Main Warehouse' })
  location_name: string;

  @ApiProperty({ description: 'Product ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Product name', example: 'Beef Tenderloin' })
  product_name: string;
}

