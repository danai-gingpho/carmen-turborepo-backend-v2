import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ApplicationRoleIdAddDto {
  @ApiPropertyOptional({ description: 'Application role IDs to add', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  add?: string[];
}

class ApplicationRoleIdUpdateDto {
  @ApiPropertyOptional({ description: 'Application role IDs to add', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  add?: string[];

  @ApiPropertyOptional({ description: 'Application role IDs to remove', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  remove?: string[];
}

class ApplicationRoleIdRemoveDto {
  @ApiProperty({ description: 'Application role IDs to remove', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  remove: string[];
}

export class AssignUserApplicationRoleRequest {
  @ApiProperty({ description: 'User ID to assign roles to', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id: string;

  @ApiProperty({ description: 'Application role IDs to assign', type: ApplicationRoleIdAddDto })
  application_role_id: ApplicationRoleIdAddDto;
}

export class UpdateUserApplicationRoleRequest {
  @ApiProperty({ description: 'User ID to update roles for', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id: string;

  @ApiProperty({ description: 'Application role IDs to add/remove', type: ApplicationRoleIdUpdateDto })
  application_role_id: ApplicationRoleIdUpdateDto;
}

export class RemoveUserApplicationRoleRequest {
  @ApiProperty({ description: 'User ID to remove roles from', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id: string;

  @ApiProperty({ description: 'Application role IDs to remove', type: ApplicationRoleIdRemoveDto })
  application_role_id: ApplicationRoleIdRemoveDto;
}
