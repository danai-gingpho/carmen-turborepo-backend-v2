import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsUUID, IsOptional } from 'class-validator';

export class AssignPermissionsToRoleDto {
  @ApiProperty({
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  role_id: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permission_ids: string[];
}

export class RemovePermissionsFromRoleDto {
  @ApiProperty({
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  role_id: string;

  @ApiProperty({
    description: 'Array of permission IDs to remove from the role',
    example: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permission_ids: string[];
}

export class AssignPermissionToRoleDto {
  @ApiProperty({
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  role_id: string;

  @ApiProperty({
    description: 'Permission ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsUUID()
  permission_id: string;
}

export class RemovePermissionFromRoleDto {
  @ApiProperty({
    description: 'Role ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsUUID()
  role_id: string;

  @ApiProperty({
    description: 'Permission ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsString()
  @IsUUID()
  permission_id: string;
}
