import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorEmbeddedDto {
  @ApiPropertyOptional({ description: 'Vendor ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'Global Foods Co.' })
  name?: string;
}

export class CurrencyEmbeddedDto {
  @ApiPropertyOptional({ description: 'Currency ID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  id?: string;

  @ApiPropertyOptional({ description: 'Currency name', example: 'Thai Baht' })
  name?: string;
}

export class TaxProfileEmbeddedDto {
  @ApiPropertyOptional({ description: 'Tax profile ID', example: 'e5f6a7b8-c901-2345-ef01-234567890abc' })
  id?: string;

  @ApiPropertyOptional({ description: 'Tax profile name', example: 'VAT 7%' })
  name?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 7.0 })
  rate?: number;
}

export class PriceListDetailEmbeddedDto {
  @ApiProperty({ description: 'Price list detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Minimum order quantity', example: 10 })
  moq_qty?: number;

  @ApiPropertyOptional({ description: 'Unit ID', example: 'd4e5f6a7-b8c9-0123-def0-1234567890ab' })
  unit_id?: string;

  @ApiPropertyOptional({ description: 'Unit name', example: 'Bottle' })
  unit_name?: string;

  @ApiPropertyOptional({ description: 'Lead time in days', example: 3 })
  lead_time_days?: number;

  @ApiPropertyOptional({ description: 'Price without tax', example: 250.0 })
  price_wirhout_tax?: number;

  @ApiPropertyOptional({ description: 'Tax amount', example: 17.5 })
  tax_amt?: number;

  @ApiPropertyOptional({ description: 'Price including tax', example: 267.5 })
  price?: number;

  @ApiPropertyOptional({ description: 'Tax profile ID', example: 'e5f6a7b8-c901-2345-ef01-234567890abc' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Whether the item is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Note', example: 'Imported from Italy' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Product ID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Olive Oil 1L' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Tax profile embedded object', type: TaxProfileEmbeddedDto })
  tax_profile?: TaxProfileEmbeddedDto;
}

export class PriceListResponseDto {
  @ApiProperty({ description: 'Price list ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Price list number', example: 'PL-2026-0001' })
  no?: string;

  @ApiProperty({ description: 'Price list name', example: 'Q1 2026 Food Supplies' })
  name: string;

  @ApiPropertyOptional({ description: 'Status', example: 'active' })
  status?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Quarterly price list for food supplies' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Vendor information', type: VendorEmbeddedDto })
  vendor?: VendorEmbeddedDto;

  @ApiPropertyOptional({ description: 'Currency information', type: CurrencyEmbeddedDto })
  currency?: CurrencyEmbeddedDto;

  @ApiPropertyOptional({ description: 'Effective period display string', example: '2026-01-01 - 2026-03-31' })
  effectivePeriod?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Negotiated rates' })
  note?: string;

  @ApiPropertyOptional({ description: 'Price list detail items', type: [PriceListDetailEmbeddedDto] })
  pricelist_detail?: PriceListDetailEmbeddedDto[];

  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class PriceListDetailResponseDto extends PriceListResponseDto {}

export class PriceCompareResponseDto {
  @ApiProperty({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'Global Foods Co.' })
  vendor_name?: string;

  @ApiProperty({ description: 'Product ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Olive Oil 1L' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Price', example: 267.5 })
  price?: number;

  @ApiPropertyOptional({ description: 'Price with VAT', example: 286.225 })
  price_with_vat?: number;

  @ApiPropertyOptional({ description: 'Price without VAT', example: 267.5 })
  price_without_vat?: number;

  @ApiPropertyOptional({ description: 'From date', example: '2026-01-01T00:00:00.000Z' })
  from_date?: Date;

  @ApiPropertyOptional({ description: 'To date', example: '2026-03-31T23:59:59.000Z' })
  to_date?: Date;
}

export class PriceListMutationResponseDto {
  @ApiProperty({ description: 'Price list ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class PriceListListResponseDto {
  @ApiProperty({ description: 'List of price list records', type: [PriceListResponseDto] })
  data: PriceListResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class CheckPriceListResponseDto {
  @ApiPropertyOptional({ description: 'Decoded token data', example: {} })
  data?: unknown;

  @ApiProperty({ description: 'Whether the token is valid', example: true })
  valid: boolean;
}
