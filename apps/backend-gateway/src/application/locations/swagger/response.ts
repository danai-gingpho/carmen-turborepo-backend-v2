import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeliveryPointResponseDto {
  @ApiPropertyOptional({ description: 'Delivery point ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id?: string;

  @ApiPropertyOptional({ description: 'Delivery point name', example: 'Loading Dock A' })
  name?: string;

  @ApiPropertyOptional({ description: 'Whether the delivery point is active', example: true })
  is_active?: boolean;
}

export class UserLocationResponseDto {
  @ApiProperty({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  firstname?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  lastname?: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'M.' })
  middlename?: string;

  @ApiPropertyOptional({ description: 'Telephone number', example: '+66-2-123-4567' })
  telephone?: string;
}

export class ProductLocationResponseDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Rice 5kg' })
  name?: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Minimum quantity', example: 10 })
  min_qty?: number;

  @ApiPropertyOptional({ description: 'Maximum quantity', example: 500 })
  max_qty?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity', example: 50 })
  re_order_qty?: number;

  @ApiPropertyOptional({ description: 'Par quantity', example: 100 })
  par_qty?: number;
}

export class LocationListItemResponseDto {
  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Location code', example: 'WH-01' })
  code: string;

  @ApiProperty({ description: 'Location name', example: 'Main Warehouse' })
  name: string;

  @ApiProperty({ description: 'Location type', enum: ['inventory', 'direct', 'consignment'], example: 'inventory' })
  location_type: string;

  @ApiPropertyOptional({ description: 'Physical count type', enum: ['no', 'daily', 'weekly', 'monthly'], example: 'no' })
  physical_count_type?: string;

  @ApiPropertyOptional({ description: 'Location description', example: 'Primary storage warehouse' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the location is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Delivery point', type: DeliveryPointResponseDto })
  delivery_point?: DeliveryPointResponseDto;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;
}

export class LocationDetailResponseDto extends LocationListItemResponseDto {
  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Users assigned to this location', type: [UserLocationResponseDto] })
  user_location?: UserLocationResponseDto[];

  @ApiPropertyOptional({ description: 'Products assigned to this location', type: [ProductLocationResponseDto] })
  product_location?: ProductLocationResponseDto[];
}

export class ProductInventoryInfoResponseDto {
  @ApiProperty({ description: 'On-hand quantity', example: 150.0 })
  on_hand_qty: number;

  @ApiProperty({ description: 'On-order quantity', example: 50.0 })
  on_order_qty: number;

  @ApiProperty({ description: 'Reorder quantity threshold', example: 20.0 })
  re_order_qty: number;

  @ApiProperty({ description: 'Restock quantity', example: 100.0 })
  re_stock_qty: number;
}

export class LocationListResponseDto {
  @ApiProperty({ description: 'List of Location records', type: [LocationListItemResponseDto] })
  data: LocationListItemResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}
