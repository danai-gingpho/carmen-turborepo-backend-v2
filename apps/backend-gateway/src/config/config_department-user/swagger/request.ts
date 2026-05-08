import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DepartmentUserCreateRequest {
  @ApiProperty({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  department_id: string;

  @ApiProperty({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id: string;

  @ApiPropertyOptional({ description: 'Whether the assignment is active', example: true })
  is_active?: boolean;
}

export class DepartmentUserUpdateRequest {
  @ApiPropertyOptional({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  department_id?: string;

  @ApiPropertyOptional({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id?: string;

  @ApiPropertyOptional({ description: 'Whether the assignment is active', example: true })
  is_active?: boolean;
}
