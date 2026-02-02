import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateApplicationRoleDto {
  @ApiProperty({
    description: 'Application role name',
    example: 'Admin',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Application role description',
    example: 'Administrator role with full access',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Application role code',
    example: 'ADMIN',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Is role active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateApplicationRoleDto {
  @ApiProperty({
    description: 'Application role name',
    example: 'Admin',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Application role description',
    example: 'Administrator role with full access',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Application role code',
    example: 'ADMIN',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Is role active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
