import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceListResponseDto {
  @ApiProperty({ description: 'Price list ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Price list number', example: 'PL-2026-001' })
  pricelist_no: string;

  @ApiPropertyOptional({ description: 'Price list name', example: 'Q1 2026 Food Supplies' })
  name?: string;

  @ApiPropertyOptional({ description: 'Price list status', example: 'draft' })
  status?: string;

  @ApiPropertyOptional({ description: 'URL token for external access', example: 'abc123token' })
  url_token?: string;

  @ApiPropertyOptional({ description: 'Vendor ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'ABC Food Supplies' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Effective from date', example: '2026-01-01T00:00:00.000Z' })
  effective_from_date?: Date;

  @ApiPropertyOptional({ description: 'Effective to date', example: '2026-03-31T23:59:59.000Z' })
  effective_to_date?: Date;

  @ApiPropertyOptional({ description: 'Currency ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Submission method', example: 'online' })
  submission_method?: string;

  @ApiPropertyOptional({ description: 'Submitted timestamp', example: '2026-01-15T10:30:00.000Z' })
  submitted_at?: Date;

  @ApiPropertyOptional({ description: 'Price list description', example: 'Quarterly price list for dry goods' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Prices valid for minimum order of 10,000 THB' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-01-15T10:30:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-01-15T10:30:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class PriceListListResponseDto {
  @ApiProperty({ description: 'List of Price List records', type: [PriceListResponseDto] })
  data: PriceListResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class PriceListMutationResponseDto {
  @ApiProperty({ description: 'Price List ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
