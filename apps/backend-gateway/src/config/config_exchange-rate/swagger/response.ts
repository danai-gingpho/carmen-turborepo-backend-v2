import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExchangeRateResponseDto {
  @ApiProperty({ description: 'Exchange rate ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Effective date of the exchange rate', example: '2026-03-10T00:00:00.000Z' })
  at_date?: string;

  @ApiPropertyOptional({ description: 'Currency ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code (ISO 4217)', example: 'USD' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Currency name', example: 'US Dollar' })
  currency_name?: string;

  @ApiPropertyOptional({ description: 'Exchange rate value', example: 34.50 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Note', example: 'Daily rate from BOT' })
  note?: string;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'ID of the user who created the record', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'ID of the user who last updated the record', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class ExchangeRateByDateResponseDto {
  @ApiProperty({ description: 'Effective date of the exchange rate', example: '2026-03-10T00:00:00.000Z' })
  at_date: string;

  @ApiProperty({ description: 'Currency ID (UUID)', example: 'ef1953fb-d4c9-4c7d-80c0-74d06997b6f2' })
  currency_id: string;

  @ApiPropertyOptional({ description: 'Currency code (ISO 4217)', example: 'USD' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Currency name', example: 'US Dollar' })
  currency_name?: string;

  @ApiProperty({ description: 'Exchange rate value (1 if default currency)', example: 0.03178 })
  exchange_rate: number;
}

export class ExchangeRateListResponseDto {
  @ApiProperty({ description: 'List of Exchange Rate records', type: [ExchangeRateResponseDto] })
  data: ExchangeRateResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class ExchangeRateMutationResponseDto {
  @ApiProperty({ description: 'Exchange Rate ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
