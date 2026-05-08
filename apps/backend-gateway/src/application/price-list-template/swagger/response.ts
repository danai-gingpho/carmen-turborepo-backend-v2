import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CurrencyEmbeddedDto {
  @ApiProperty({ description: 'Currency ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  id: string;

  @ApiProperty({ description: 'Currency code', example: 'THB' })
  code: string;
}

export class DefaultOrderUnitDto {
  @ApiPropertyOptional({ description: 'Unit ID', example: 'd4e5f6a7-b8c9-0123-def0-1234567890ab' })
  unit_id?: string;

  @ApiPropertyOptional({ description: 'Unit name', example: 'Bottle' })
  unit_name?: string;
}

export class PriceListTemplateProductDto {
  @ApiProperty({ description: 'Template product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Product ID', example: 'c3d4e5f6-a7b8-9012-cdef-123456789012' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Olive Oil 1L' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Code', example: 'PRD-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Default order unit', type: DefaultOrderUnitDto })
  default_order?: DefaultOrderUnitDto;

  @ApiPropertyOptional({ description: 'Minimum order quantity config', example: {} })
  moq?: unknown;
}

export class PriceListTemplateResponseDto {
  @ApiProperty({ description: 'Template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Template name', example: 'Monthly Food Supply Template' })
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Template for monthly food supply price collection' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Note', example: 'Use for all food vendors' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Status', example: 'active', enum: ['draft', 'active', 'inactive'] })
  status?: string;

  @ApiPropertyOptional({ description: 'Validity period in days', example: 30 })
  validity_period?: number | null;

  @ApiPropertyOptional({ description: 'Instructions for vendors', example: 'Please provide unit prices excluding VAT' })
  vendor_instructions?: string | null;

  @ApiPropertyOptional({ description: 'Currency information', type: CurrencyEmbeddedDto })
  currency?: CurrencyEmbeddedDto;

  @ApiPropertyOptional({ description: 'Template products', type: [PriceListTemplateProductDto] })
  products?: PriceListTemplateProductDto[];

  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-01T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T08:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class PriceListTemplateDetailResponseDto extends PriceListTemplateResponseDto {}

export class PriceListTemplateMutationResponseDto {
  @ApiProperty({ description: 'Template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class PriceListTemplateListResponseDto {
  @ApiProperty({ description: 'List of price list template records', type: [PriceListTemplateResponseDto] })
  data: PriceListTemplateResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class PriceListTemplateStatusResponseDto {
  @ApiProperty({ description: 'Template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'New status', example: 'active' })
  status: string;
}
