import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExchangeRateCreateRequest {
  @ApiProperty({ description: 'Currency ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id: string;

  @ApiPropertyOptional({ description: 'Exchange rate value', example: 34.50 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Effective date of the exchange rate', example: '2026-03-10T00:00:00.000Z' })
  at_date?: string;
}

export class ExchangeRateUpdateRequest {
  @ApiPropertyOptional({ description: 'Currency ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Exchange rate value', example: 34.50 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Effective date of the exchange rate', example: '2026-03-10T00:00:00.000Z' })
  at_date?: string;
}
