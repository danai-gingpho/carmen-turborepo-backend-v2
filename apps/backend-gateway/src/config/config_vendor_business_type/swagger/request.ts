import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VendorBusinessTypeCreateRequest {
  @ApiProperty({ description: 'Business type name', example: 'Food Supplier' })
  name: string;

  @ApiPropertyOptional({ description: 'Description of the business type', example: 'Vendors that supply food products' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the business type is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Includes fresh and frozen food suppliers' })
  note?: string;
}

export class VendorBusinessTypeUpdateRequest {
  @ApiPropertyOptional({ description: 'Business type name', example: 'Food Supplier' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the business type', example: 'Vendors that supply food products' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the business type is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Includes fresh and frozen food suppliers' })
  note?: string;
}
