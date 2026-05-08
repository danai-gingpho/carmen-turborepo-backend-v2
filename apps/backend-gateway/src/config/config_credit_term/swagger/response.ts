import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreditTermResponseDto {
  @ApiProperty({ description: 'Credit term ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

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

export class CreditTermListResponseDto {
  @ApiProperty({ description: 'List of Credit Term records', type: [CreditTermResponseDto] })
  data: CreditTermResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class CreditTermMutationResponseDto {
  @ApiProperty({ description: 'Credit Term ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
