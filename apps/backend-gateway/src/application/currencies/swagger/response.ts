import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CurrencyListItemResponseDto {
  @ApiProperty({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'ISO 4217 currency code', example: 'USD' })
  code: string;

  @ApiProperty({ description: 'Currency name', example: 'US Dollar' })
  name: string;

  @ApiPropertyOptional({ description: 'Currency symbol', example: '$' })
  symbol?: string;

  @ApiPropertyOptional({ description: 'Currency description', example: 'United States Dollar' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether this is the default currency', example: false })
  is_default?: boolean;

  @ApiPropertyOptional({ description: 'Whether the currency is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Exchange rate relative to base currency', example: 1.0 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;
}

/**
 * Detail and list schemas are identical for currencies (both use CurrencyResponseSchema).
 */
export class CurrencyDetailResponseDto extends CurrencyListItemResponseDto {
  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class CurrencyListResponseDto {
  @ApiProperty({ description: 'List of Currency records', type: [CurrencyListItemResponseDto] })
  data: CurrencyListItemResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}
