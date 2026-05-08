import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserBusinessUnitResponseDto {
  @ApiProperty({ description: 'Business unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Business unit code', example: 'BU-001' })
  code?: string;

  @ApiPropertyOptional({ description: 'Business unit name', example: 'Grand Hotel Bangkok' })
  name?: string;

  @ApiPropertyOptional({ description: 'Whether this is the default tenant', example: true })
  is_default?: boolean;

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

export class UserBusinessUnitListResponseDto {
  @ApiProperty({ description: 'List of user business unit records', type: [UserBusinessUnitResponseDto] })
  data: UserBusinessUnitResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}
