import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceListDetailItemRequestDto {
  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Olive Oil 1L' })
  product_name?: string | null;

  @ApiPropertyOptional({ description: 'Unit ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  unit_id?: string;

  @ApiPropertyOptional({ description: 'Unit name', example: 'Bottle' })
  unit_name?: string | null;

  @ApiPropertyOptional({ description: 'Tax profile ID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Tax profile name', example: 'VAT 7%' })
  tax_profile_name?: string | null;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 7.0 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Minimum order quantity', example: 10 })
  moq_qty?: number;

  @ApiPropertyOptional({ description: 'Price without tax', example: 250.0 })
  price_without_tax?: number;

  @ApiPropertyOptional({ description: 'Tax amount', example: 17.5 })
  tax_amt?: number;

  @ApiPropertyOptional({ description: 'Price including tax', example: 267.5 })
  price?: number;

  @ApiPropertyOptional({ description: 'Lead time in days', example: 3 })
  lead_time_days?: number;

  @ApiPropertyOptional({ description: 'Whether the item is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Description', example: 'Premium olive oil' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Note', example: 'Imported from Italy' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;
}

export class PriceListDetailItemUpdateRequestDto extends PriceListDetailItemRequestDto {
  @ApiProperty({ description: 'Price list detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class PriceListDetailActionRequestDto {
  @ApiPropertyOptional({ description: 'Items to add', type: [PriceListDetailItemRequestDto] })
  add?: PriceListDetailItemRequestDto[];

  @ApiPropertyOptional({ description: 'Items to update (must include id)', type: [PriceListDetailItemUpdateRequestDto] })
  update?: PriceListDetailItemUpdateRequestDto[];

  @ApiPropertyOptional({ description: 'Item IDs to delete', type: [String], example: ['uuid-1', 'uuid-2'] })
  delete?: string[];
}

export class PriceListCreateRequestDto {
  @ApiProperty({ description: 'Price list name', example: 'Q1 2026 Food Supplies' })
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Quarterly price list for food supplies' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Status', example: 'draft' })
  status?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'Global Foods Co.' })
  vendor_name?: string | null;

  @ApiPropertyOptional({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string | null;

  @ApiProperty({ description: 'Effective from date (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  effective_from_date: Date;

  @ApiProperty({ description: 'Effective to date (ISO 8601)', example: '2026-03-31T23:59:59.000Z' })
  effective_to_date: Date;

  @ApiPropertyOptional({ description: 'Whether the price list is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Price list detail actions', type: PriceListDetailActionRequestDto })
  pricelist_detail?: PriceListDetailActionRequestDto;

  @ApiPropertyOptional({ description: 'Note', example: 'Negotiated rates' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;
}

export class PriceListUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Price list name', example: 'Q1 2026 Food Supplies - Updated' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Updated quarterly price list' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Status', example: 'active' })
  status?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'Global Foods Co.' })
  vendor_name?: string | null;

  @ApiPropertyOptional({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string | null;

  @ApiPropertyOptional({ description: 'Effective from date (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  effective_from_date?: Date;

  @ApiPropertyOptional({ description: 'Effective to date (ISO 8601)', example: '2026-03-31T23:59:59.000Z' })
  effective_to_date?: Date;

  @ApiPropertyOptional({ description: 'Whether the price list is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Price list detail actions', type: PriceListDetailActionRequestDto })
  pricelist_detail?: PriceListDetailActionRequestDto;

  @ApiPropertyOptional({ description: 'Note', example: 'Negotiated rates' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;
}

export class PriceCompareQueryDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiProperty({ description: 'Date for price comparison (YYYY-MM-DD)', example: '2026-03-10' })
  at_date: string;

  @ApiPropertyOptional({ description: 'Unit ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  unit_id?: string;

  @ApiProperty({ description: 'Currency ID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  currency_id: string;
}
