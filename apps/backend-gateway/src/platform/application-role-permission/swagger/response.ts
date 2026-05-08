import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplicationRolePermissionResponseDto {
  @ApiProperty({ description: 'Role-Permission mapping ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Application role ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  application_role_id: string;

  @ApiProperty({ description: 'Permission ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  permission_id: string;

  @ApiPropertyOptional({ description: 'Is mapping active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Deleted timestamp', example: null })
  deleted_at?: Date;
}

export class ApplicationRolePermissionListResponseDto {
  @ApiProperty({ description: 'List of Application Role Permission records', type: [ApplicationRolePermissionResponseDto] })
  data: ApplicationRolePermissionResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class ApplicationRolePermissionMutationResponseDto {
  @ApiProperty({ description: 'Application Role Permission ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
