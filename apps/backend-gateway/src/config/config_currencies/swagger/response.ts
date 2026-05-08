import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CurrencyResponseDto {
  @ApiProperty({ description: 'Currency ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

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
  exchange_rate_at?: Date;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Base currency for local transactions' })
  note?: string;

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

export class CurrencyListResponseDto {
  @ApiProperty({ description: 'List of Currency records', type: [CurrencyResponseDto] })
  data: CurrencyResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class CurrencyMutationResponseDto {
  @ApiProperty({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
