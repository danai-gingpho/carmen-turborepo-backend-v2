import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserApplicationRoleResponseDto {
  @ApiProperty({ description: 'User application role ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id?: string;

  @ApiPropertyOptional({ description: 'Application role ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  application_role_id?: string;

  @ApiPropertyOptional({ description: 'Application role name', example: 'Inventory Manager' })
  application_role_name?: string;

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

export class UserApplicationRoleListResponseDto {
  @ApiProperty({ description: 'List of UserApplicationRole records', type: [UserApplicationRoleResponseDto] })
  data: UserApplicationRoleResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class UserApplicationRoleMutationResponseDto {
  @ApiProperty({ description: 'UserApplicationRole ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
