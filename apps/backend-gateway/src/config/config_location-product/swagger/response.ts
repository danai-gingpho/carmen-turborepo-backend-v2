import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationProductResponseDto {
  @ApiProperty({ description: 'Product Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Chicken Breast' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'อกไก่' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'SKU-001' })
  product_sku?: string;

  @ApiPropertyOptional({ description: 'Inventory unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_unit_id?: string;

  @ApiPropertyOptional({ description: 'Inventory unit name', example: 'kg' })
  inventory_unit_name?: string;
}

export class LocationProductListResponseDto {
  @ApiProperty({ description: 'List of Location Product records', type: [LocationProductResponseDto] })
  data: LocationProductResponseDto[];
}

export class LocationProductCompareItemDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Chicken Breast' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'อกไก่' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'SKU-001' })
  product_sku?: string;

  @ApiPropertyOptional({ description: 'Inventory unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_unit_id?: string;

  @ApiPropertyOptional({ description: 'Inventory unit name', example: 'kg' })
  inventory_unit_name?: string;
}

export class LocationProductCompareResponseDto {
  @ApiProperty({ description: 'Products found in both locations', type: [LocationProductCompareItemDto] })
  data: LocationProductCompareItemDto[];
}
