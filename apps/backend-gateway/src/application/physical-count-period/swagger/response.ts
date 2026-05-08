import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PeriodInfoDto {
  @ApiProperty({ description: 'Period ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Period code (YYMM)', example: '2603' })
  period: string;

  @ApiProperty({ description: 'Period start date', example: '2026-03-01T00:00:00.000Z' })
  start_at: Date;

  @ApiProperty({ description: 'Period end date', example: '2026-03-31T23:59:59.000Z' })
  end_at: Date;
}

export class PhysicalCountPeriodResponseDto {
  @ApiProperty({ description: 'Physical count period ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Period ID (FK to tb_period)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  period_id: string;

  @ApiPropertyOptional({ description: 'Period details', type: PeriodInfoDto })
  tb_period?: PeriodInfoDto;

  @ApiProperty({ description: 'Status', example: 'draft' })
  status: string;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-01T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T08:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class PhysicalCountPeriodListResponseDto {
  @ApiProperty({ description: 'List of Physical Count Period records', type: [PhysicalCountPeriodResponseDto] })
  data: PhysicalCountPeriodResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class PhysicalCountPeriodMutationResponseDto {
  @ApiProperty({ description: 'Physical Count Period ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Status', example: 'draft' })
  status?: string;
}
