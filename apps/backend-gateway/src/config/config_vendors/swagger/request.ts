import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorCreateRequestDto {
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
}

export class VendorUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Vendor code', example: 'VND-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'ABC Food Supplies Co., Ltd.' })
  name?: string;

  @ApiPropertyOptional({ description: 'Vendor description', example: 'Major food supplier in Bangkok area' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Preferred supplier for seafood' })
  note?: string;

  @ApiPropertyOptional({ description: 'Business types (JSON array)', example: [{ id: '00000000-0000-0000-0000-000000000000', name: 'Food Supplier' }] })
  business_type?: unknown;

  @ApiPropertyOptional({ description: 'Tax profile ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Whether the vendor is active', example: true })
  is_active?: boolean;
}
