import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CurrencyCreateRequestDto {
  @ApiProperty({ description: 'Currency code (ISO 4217)', example: 'THB' })
  code: string;

  @ApiProperty({ description: 'Currency name', example: 'Thai Baht' })
  name: string;

  @ApiPropertyOptional({ description: 'Currency symbol', example: '฿' })
  symbol?: string;

  @ApiPropertyOptional({ description: 'Currency description', example: 'Official currency of Thailand' })
  description?: string;

  @ApiPropertyOptional({ description: 'Number of decimal places', example: 2 })
  decimal_places?: number;

  @ApiPropertyOptional({ description: 'Whether the currency is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 35.5 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Exchange rate timestamp', example: '2026-01-15T10:30:00.000Z' })
  exchange_rate_at?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Base currency for local transactions' })
  note?: string;
}

export class CurrencyUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Currency code (ISO 4217)', example: 'THB' })
  code?: string;

  @ApiPropertyOptional({ description: 'Currency name', example: 'Thai Baht' })
  name?: string;

  @ApiPropertyOptional({ description: 'Currency symbol', example: '฿' })
  symbol?: string;

  @ApiPropertyOptional({ description: 'Currency description', example: 'Official currency of Thailand' })
  description?: string;

  @ApiPropertyOptional({ description: 'Number of decimal places', example: 2 })
  decimal_places?: number;

  @ApiPropertyOptional({ description: 'Whether the currency is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 35.5 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Exchange rate timestamp', example: '2026-01-15T10:30:00.000Z' })
  exchange_rate_at?: string;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Base currency for local transactions' })
  note?: string;
}
