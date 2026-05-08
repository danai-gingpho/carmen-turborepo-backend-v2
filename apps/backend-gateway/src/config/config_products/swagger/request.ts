import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCreateRequestDto {
  @ApiProperty({ description: 'Product code', example: 'PRD-001' })
  code: string;

  @ApiProperty({ description: 'Product name', example: 'Olive Oil Extra Virgin' })
  name: string;

  @ApiPropertyOptional({ description: 'Local name of the product', example: 'น้ำมันมะกอก' })
  local_name?: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'Premium extra virgin olive oil' })
  description?: string;

  @ApiProperty({ description: 'Inventory unit ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_unit_id: string;

  @ApiPropertyOptional({ description: 'Inventory unit name', example: 'Liter' })
  inventory_unit_name?: string;

  @ApiPropertyOptional({ description: 'Product status type', example: 'active', enum: ['active', 'inactive', 'discontinued'] })
  product_status_type?: string;

  @ApiPropertyOptional({ description: 'Product item group ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_item_group_id?: string;

  @ApiPropertyOptional({ description: 'Whether the product is used in recipes', example: true })
  is_used_in_recipe?: boolean;

  @ApiPropertyOptional({ description: 'Whether the product is sold directly', example: false })
  is_sold_directly?: boolean;

  @ApiPropertyOptional({ description: 'Product barcode', example: '8850000000001' })
  barcode?: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'SKU-OIL-001' })
  sku?: string;

  @ApiPropertyOptional({ description: 'Price deviation limit', example: 10.0 })
  price_deviation_limit?: number;

  @ApiPropertyOptional({ description: 'Quantity deviation limit', example: 5.0 })
  qty_deviation_limit?: number;

  @ApiPropertyOptional({ description: 'Standard cost per inventory unit', example: 100 })
  standard_cost?: number;

  @ApiPropertyOptional({ description: 'Tax profile ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Tax profile name', example: 'VAT 7%' })
  tax_profile_name?: string;

  @ApiPropertyOptional({ description: 'Tax rate', example: 7.0 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Whether the product is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Imported from Italy' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({
    description: 'Locations to assign to the product',
    example: {
      add: [{ location_id: 'uuid', min_qty: 0, max_qty: 100, re_order_qty: 10, par_qty: 50 }],
    },
  })
  locations?: {
    add?: { location_id: string; min_qty?: number; max_qty?: number; re_order_qty?: number; par_qty?: number }[];
  };
}

export class ProductUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Olive Oil Extra Virgin' })
  name?: string;

  @ApiPropertyOptional({ description: 'Local name of the product', example: 'น้ำมันมะกอก' })
  local_name?: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'Premium extra virgin olive oil' })
  description?: string;

  @ApiPropertyOptional({ description: 'Inventory unit ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_unit_id?: string;

  @ApiPropertyOptional({ description: 'Product status type', example: 'active', enum: ['active', 'inactive', 'discontinued'] })
  product_status_type?: string;

  @ApiPropertyOptional({ description: 'Product item group ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_item_group_id?: string;

  @ApiPropertyOptional({ description: 'Whether the product is used in recipes', example: true })
  is_used_in_recipe?: boolean;

  @ApiPropertyOptional({ description: 'Whether the product is sold directly', example: false })
  is_sold_directly?: boolean;

  @ApiPropertyOptional({ description: 'Whether the product is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Imported from Italy' })
  note?: string;

  @ApiPropertyOptional({
    description: 'Locations to add, update, or remove from the product',
    example: {
      add: [{ location_id: 'uuid', min_qty: 0, max_qty: 100, re_order_qty: 10, par_qty: 50 }],
      update: [{ location_id: 'uuid', min_qty: 5, max_qty: 200, re_order_qty: 20, par_qty: 80 }],
      remove: [{ location_id: 'uuid' }],
    },
  })
  locations?: {
    add?: { location_id: string; min_qty?: number; max_qty?: number; re_order_qty?: number; par_qty?: number }[];
    update?: { location_id: string; min_qty?: number; max_qty?: number; re_order_qty?: number; par_qty?: number }[];
    remove?: { location_id: string }[];
  };
}
