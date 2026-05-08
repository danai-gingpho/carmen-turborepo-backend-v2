import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorResponseDto {
  @ApiProperty({ description: 'Vendor ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Vendor code', example: 'VND-001' })
  code: string;

  @ApiProperty({ description: 'Vendor name', example: 'ABC Food Supplies Co., Ltd.' })
  name: string;

  @ApiPropertyOptional({ description: 'Vendor description', example: 'Major food supplier in Bangkok area' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Preferred supplier for seafood' })
  note?: string;

  @ApiPropertyOptional({ description: 'Business types (JSON array)', example: [{ id: '00000000-0000-0000-0000-000000000000', name: 'Food Supplier' }] })
  business_type?: unknown;

  @ApiPropertyOptional({ description: 'Tax profile ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Tax profile name', example: 'VAT 7%' })
  tax_profile_name?: string;

  @ApiPropertyOptional({ description: 'Tax rate', example: 7.0 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Whether the vendor is active', example: true })
  is_active?: boolean;

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

export class VendorListResponseDto {
  @ApiProperty({ description: 'List of Vendor records', type: [VendorResponseDto] })
  data: VendorResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class VendorMutationResponseDto {
  @ApiProperty({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
