import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaxProfileRequestDto {
  @ApiProperty({ description: 'Tax profile name', example: 'VAT 7%' })
  name: string;

  @ApiProperty({ description: 'Tax rate percentage', example: 7 })
  tax_rate: number;

  @ApiPropertyOptional({ description: 'Description of the tax profile', example: 'Standard VAT rate for Thailand' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the tax profile is active', example: true, default: true })
  is_active?: boolean;
}

export class UpdateTaxProfileRequestDto {
  @ApiPropertyOptional({ description: 'Tax profile name', example: 'VAT 10%' })
  name?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 10 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Description of the tax profile', example: 'Updated VAT rate' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the tax profile is active', example: true })
  is_active?: boolean;
}
