import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class PermissionsAddDto {
  @ApiProperty({ description: 'Permission IDs to add', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  add: string[];
}

class PermissionsUpdateDto {
  @ApiPropertyOptional({ description: 'Permission IDs to add', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  add?: string[];

  @ApiPropertyOptional({ description: 'Permission IDs to remove', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  remove?: string[];
}

export class CreateApplicationRoleRequest {
  @ApiProperty({ description: 'Application role name', example: 'Inventory Manager' })
  application_role_name: string;

  @ApiPropertyOptional({ description: 'Description of the role', example: 'Manages inventory operations' })
  description?: string;

  @ApiPropertyOptional({ description: 'Whether the role is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Permissions to assign', type: PermissionsAddDto })
  permissions?: PermissionsAddDto;
}

export class UpdateApplicationRoleRequest {
  @ApiPropertyOptional({ description: 'Application role name', example: 'Inventory Manager' })
  application_role_name?: string;

  @ApiPropertyOptional({ description: 'Whether the role is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Permissions to add/remove', type: PermissionsUpdateDto })
  permissions?: PermissionsUpdateDto;
}
