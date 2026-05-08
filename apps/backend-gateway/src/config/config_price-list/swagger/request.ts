import { ApiPropertyOptional } from '@nestjs/swagger';

export class ConfigPriceListCreateRequestDto {
  @ApiPropertyOptional({ description: 'Price list number', example: 'PL-2026-001' })
  pricelist_no?: string;

  @ApiPropertyOptional({ description: 'Price list name', example: 'Q1 2026 Food Supplies' })
  name?: string;

  @ApiPropertyOptional({ description: 'Price list status', example: 'draft', enum: ['draft', 'sent', 'received', 'approved', 'rejected', 'expired'] })
  status?: string;

  @ApiPropertyOptional({ description: 'Vendor ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'ABC Food Supplies' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Effective from date', example: '2026-01-01T00:00:00.000Z' })
  effective_from_date?: string;

  @ApiPropertyOptional({ description: 'Effective to date', example: '2026-03-31T23:59:59.000Z' })
  effective_to_date?: string;

  @ApiPropertyOptional({ description: 'Currency ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Price list description', example: 'Quarterly price list for dry goods' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Prices valid for minimum order of 10,000 THB' })
  note?: string;
}

export class ConfigPriceListUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Price list name', example: 'Q1 2026 Food Supplies - Updated' })
  name?: string;

  @ApiPropertyOptional({ description: 'Price list status', example: 'approved', enum: ['draft', 'sent', 'received', 'approved', 'rejected', 'expired'] })
  status?: string;

  @ApiPropertyOptional({ description: 'Effective from date', example: '2026-01-01T00:00:00.000Z' })
  effective_from_date?: string;

  @ApiPropertyOptional({ description: 'Effective to date', example: '2026-03-31T23:59:59.000Z' })
  effective_to_date?: string;

  @ApiPropertyOptional({ description: 'Price list description', example: 'Updated quarterly price list' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Updated pricing terms' })
  note?: string;
}
