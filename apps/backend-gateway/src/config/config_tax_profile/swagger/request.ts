import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaxProfileCreateRequest {
  @ApiProperty({ description: 'Tax profile name', example: 'VAT 7%' })
  name: string;

  @ApiPropertyOptional({ description: 'Tax profile description', example: 'Standard value added tax' })
  description?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 7.0 })
  rate?: number;

  @ApiPropertyOptional({ description: 'Whether the tax profile is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Default tax for domestic purchases' })
  note?: string;
}

export class TaxProfileUpdateRequest {
  @ApiPropertyOptional({ description: 'Tax profile name', example: 'VAT 7%' })
  name?: string;

  @ApiPropertyOptional({ description: 'Tax profile description', example: 'Standard value added tax' })
  description?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 7.0 })
  rate?: number;

  @ApiPropertyOptional({ description: 'Whether the tax profile is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Default tax for domestic purchases' })
  note?: string;
}
