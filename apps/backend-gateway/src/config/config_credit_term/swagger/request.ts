import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditTermCreateRequestDto {
  @ApiProperty({ description: 'Credit term name', example: 'Net 30' })
  name: string;

  @ApiPropertyOptional({ description: 'Credit term value in days', example: 30 })
  value?: number;

  @ApiPropertyOptional({ description: 'Credit term description', example: 'Payment due within 30 days' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Standard credit term for regular suppliers' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the credit term is active', example: true })
  is_active?: boolean;
}

export class CreditTermUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Credit term name', example: 'Net 30' })
  name?: string;

  @ApiPropertyOptional({ description: 'Credit term value in days', example: 30 })
  value?: number;

  @ApiPropertyOptional({ description: 'Credit term description', example: 'Payment due within 30 days' })
  description?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Standard credit term for regular suppliers' })
  note?: string;

  @ApiPropertyOptional({ description: 'Whether the credit term is active', example: true })
  is_active?: boolean;
}
