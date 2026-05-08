import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationPermissionRequestDto {
  @ApiProperty({ description: 'Permission name', example: 'create_user' })
  name: string;

  @ApiPropertyOptional({ description: 'Permission description', example: 'Permission to create new users' })
  description?: string;

  @ApiPropertyOptional({ description: 'Permission code', example: 'user.create' })
  code?: string;

  @ApiPropertyOptional({ description: 'Permission resource', example: 'user' })
  resource?: string;

  @ApiPropertyOptional({ description: 'Permission action', example: 'create' })
  action?: string;

  @ApiPropertyOptional({ description: 'Is permission active', example: true })
  is_active?: boolean;
}

export class UpdateApplicationPermissionRequestDto {
  @ApiPropertyOptional({ description: 'Permission name', example: 'create_user' })
  name?: string;

  @ApiPropertyOptional({ description: 'Permission description', example: 'Permission to create new users' })
  description?: string;

  @ApiPropertyOptional({ description: 'Permission code', example: 'user.create' })
  code?: string;

  @ApiPropertyOptional({ description: 'Permission resource', example: 'user' })
  resource?: string;

  @ApiPropertyOptional({ description: 'Permission action', example: 'create' })
  action?: string;

  @ApiPropertyOptional({ description: 'Is permission active', example: true })
  is_active?: boolean;
}
