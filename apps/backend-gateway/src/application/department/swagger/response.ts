import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentListItemResponseDto {
  @ApiProperty({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Department code', example: 'FNB' })
  code?: string;

  @ApiProperty({ description: 'Department name', example: 'Food & Beverage' })
  name: string;

  @ApiPropertyOptional({ description: 'Department description', example: 'Handles all food and beverage operations' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the department is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;
}

export class DepartmentUserResponseDto {
  @ApiProperty({ description: 'User-department relation ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'John' })
  firstname?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  lastname?: string;

  @ApiPropertyOptional({ description: 'Middle name', example: 'M.' })
  middlename?: string;

  @ApiPropertyOptional({ description: 'Telephone number', example: '+66-2-123-4567' })
  telephone?: string;
}

export class DepartmentDetailResponseDto extends DepartmentListItemResponseDto {
  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Users assigned to this department', type: [DepartmentUserResponseDto] })
  department_users?: DepartmentUserResponseDto[];

  @ApiPropertyOptional({ description: 'Head-of-department users', type: [DepartmentUserResponseDto] })
  hod_users?: DepartmentUserResponseDto[];
}

export class DepartmentListResponseDto {
  @ApiProperty({ description: 'List of Department records', type: [DepartmentListItemResponseDto] })
  data: DepartmentListItemResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}
