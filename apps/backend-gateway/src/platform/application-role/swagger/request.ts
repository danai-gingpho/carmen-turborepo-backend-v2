import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationRoleRequestDto {
  @ApiProperty({ description: 'Application role name', example: 'Admin' })
  name: string;

  @ApiPropertyOptional({ description: 'Application role description', example: 'Administrator role with full access' })
  description?: string;

  @ApiPropertyOptional({ description: 'Application role code', example: 'ADMIN' })
  code?: string;

  @ApiPropertyOptional({ description: 'Is role active', example: true })
  is_active?: boolean;
}

export class UpdateApplicationRoleRequestDto {
  @ApiPropertyOptional({ description: 'Application role name', example: 'Admin' })
  name?: string;

  @ApiPropertyOptional({ description: 'Application role description', example: 'Administrator role with full access' })
  description?: string;

  @ApiPropertyOptional({ description: 'Application role code', example: 'ADMIN' })
  code?: string;

  @ApiPropertyOptional({ description: 'Is role active', example: true })
  is_active?: boolean;
}
