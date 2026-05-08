import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentUserResponseDto {
  @ApiProperty({ description: 'Department user assignment ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  department_id?: string;

  @ApiPropertyOptional({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id?: string;

  @ApiPropertyOptional({ description: 'Whether the assignment is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'ID of the user who created the record', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'ID of the user who last updated the record', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class DepartmentUserListResponseDto {
  @ApiProperty({ description: 'List of Department User records', type: [DepartmentUserResponseDto] })
  data: DepartmentUserResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class DepartmentUserMutationResponseDto {
  @ApiProperty({ description: 'Department User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class DepartmentRefDto {
  @ApiProperty({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Department code', example: 'F&B' })
  code: string;

  @ApiProperty({ description: 'Department name', example: 'Food & Beverage' })
  name: string;
}

export class DepartmentUserByUserResponseDto {
  @ApiProperty({
    description: 'Member department (is_hod=false). Null if user is not a member of any department.',
    type: DepartmentRefDto,
    nullable: true,
  })
  department: DepartmentRefDto | null;

  @ApiProperty({
    description: 'Departments where the user is HOD (is_hod=true). Empty array if user is not HOD anywhere.',
    type: [DepartmentRefDto],
  })
  hod_departments: DepartmentRefDto[];
}
