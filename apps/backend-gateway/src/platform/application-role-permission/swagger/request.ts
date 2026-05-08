import { ApiProperty } from '@nestjs/swagger';

export class AssignPermissionsToRoleRequestDto {
  @ApiProperty({ description: 'Role ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  role_id: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
  })
  permission_ids: string[];
}

export class AssignPermissionToRoleRequestDto {
  @ApiProperty({ description: 'Role ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  role_id: string;

  @ApiProperty({ description: 'Permission ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  permission_id: string;
}

export class RemovePermissionsFromRoleRequestDto {
  @ApiProperty({ description: 'Role ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  role_id: string;

  @ApiProperty({
    description: 'Array of permission IDs to remove from the role',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
  })
  permission_ids: string[];
}

export class RemovePermissionFromRoleRequestDto {
  @ApiProperty({ description: 'Role ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  role_id: string;

  @ApiProperty({ description: 'Permission ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  permission_id: string;
}
