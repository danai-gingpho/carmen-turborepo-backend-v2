import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PeriodCreateRequestDto {
  @ApiProperty({ description: 'Fiscal year', example: 2026 })
  fiscal_year: number;

  @ApiProperty({ description: 'Fiscal month (1-12)', example: 3, minimum: 1, maximum: 12 })
  fiscal_month: number;

  @ApiProperty({ description: 'Period start date (ISO 8601)', example: '2026-03-01T00:00:00.000Z' })
  start_at: Date;

  @ApiProperty({ description: 'Period end date (ISO 8601)', example: '2026-03-31T23:59:59.000Z' })
  end_at: Date;

  @ApiPropertyOptional({ description: 'Period status', example: 'open', default: 'open' })
  status?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'March 2026 period' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class PeriodUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Fiscal year', example: 2026 })
  fiscal_year?: number;

  @ApiPropertyOptional({ description: 'Fiscal month (1-12)', example: 3, minimum: 1, maximum: 12 })
  fiscal_month?: number;

  @ApiPropertyOptional({ description: 'Period start date (ISO 8601)', example: '2026-03-01T00:00:00.000Z' })
  start_at?: Date;

  @ApiPropertyOptional({ description: 'Period end date (ISO 8601)', example: '2026-03-31T23:59:59.000Z' })
  end_at?: Date;

  @ApiPropertyOptional({ description: 'Period status', example: 'open', enum: ['open', 'closed'] })
  status?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'March 2026 period' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class PeriodGenerateNextRequestDto {
  @ApiProperty({ description: 'Number of periods to generate', example: 12 })
  count: number;

  @ApiPropertyOptional({ description: 'Start day of each period (1-28), default is 1', example: 1 })
  start_day?: number;
}
