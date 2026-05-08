import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaxProfileResponseDto {
  @ApiProperty({ description: 'Tax profile ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Tax profile name', example: 'VAT 7%' })
  name: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 7 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Whether the tax profile is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Description', example: 'Standard VAT rate for Thailand' })
  description?: string;

  @ApiPropertyOptional({ description: 'Notes', example: 'Applied to all domestic purchases' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class TaxProfileListResponseDto {
  @ApiProperty({ description: 'List of Tax Profile records', type: [TaxProfileResponseDto] })
  data: TaxProfileResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class TaxProfileMutationResponseDto {
  @ApiProperty({ description: 'Tax Profile ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
