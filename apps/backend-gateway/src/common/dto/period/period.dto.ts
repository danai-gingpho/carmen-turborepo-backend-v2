import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { enum_period_status } from '@repo/prisma-shared-schema-tenant';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const PeriodCreate = z.object({
  // period: z.string(), // YYMM
  fiscal_year: z.number().int(),
  fiscal_month: z.number().int().min(1).max(12),
  start_at: z.coerce.date(),
  end_at: z.coerce.date().optional(),
  status: z
    .enum(Object.values(enum_period_status) as [string, ...string[]])
    .optional()
    .default('open'),
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(),
  dimension: z.any().optional().nullable(),
});

export type IPeriodCreate = z.infer<typeof PeriodCreate>;

export class PeriodCreateDto extends createZodDto(PeriodCreate) {
  // @ApiProperty({ description: 'Period code in YYMM format', example: '2603' })
  // period: string;

  @ApiProperty({ description: 'Fiscal year', example: 2026 })
  fiscal_year: number;

  @ApiProperty({
    description: 'Fiscal month (1-12)',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  fiscal_month: number;

  @ApiProperty({
    description: 'Period start date (ISO 8601)',
    example: '2026-03-01T00:00:00.000Z',
  })
  start_at: Date;

  @ApiPropertyOptional({
    description: 'Period end date (ISO 8601) — auto-calculated as last day of fiscal_month if omitted',
    example: '2026-03-31T23:59:59.000Z',
  })
  end_at?: Date;

  @ApiPropertyOptional({
    description: 'Period status',
    enum: Object.values(enum_period_status),
    default: 'open',
    example: 'open',
  })
  status?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'March 2026 period' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({
    description: 'Dimension data (JSON array)',
    example: [],
  })
  dimension?: unknown;
}

// ==================== Period Update ====================

export const PeriodUpdate = z.object({
  // period: z.string().optional(),
  fiscal_year: z.number().int().optional(),
  fiscal_month: z.number().int().min(1).max(12).optional(),
  start_at: z.coerce.date().optional(),
  end_at: z.coerce.date().optional(),
  status: z
    .enum(Object.values(enum_period_status) as [string, ...string[]])
    .optional(),
  note: z.string().optional().nullable(),
  info: z.any().optional().nullable(),
  dimension: z.any().optional().nullable(),
});

export type IPeriodUpdate = z.infer<typeof PeriodUpdate>;

export class PeriodUpdateDto extends createZodDto(PeriodUpdate) {
  // @ApiPropertyOptional({
  //   description: 'Period code in YYMM format',
  //   example: '2603',
  // })
  // period?: string;

  @ApiPropertyOptional({ description: 'Fiscal year', example: 2026 })
  fiscal_year?: number;

  @ApiPropertyOptional({
    description: 'Fiscal month (1-12)',
    example: 3,
    minimum: 1,
    maximum: 12,
  })
  fiscal_month?: number;

  @ApiPropertyOptional({
    description: 'Period start date (ISO 8601)',
    example: '2026-03-01T00:00:00.000Z',
  })
  start_at?: Date;

  @ApiPropertyOptional({
    description: 'Period end date (ISO 8601)',
    example: '2026-03-31T23:59:59.000Z',
  })
  end_at?: Date;

  @ApiPropertyOptional({
    description: 'Period status',
    enum: Object.values(enum_period_status),
    example: 'open',
  })
  status?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'March 2026 period' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({
    description: 'Dimension data (JSON array)',
    example: [],
  })
  dimension?: unknown;
}
