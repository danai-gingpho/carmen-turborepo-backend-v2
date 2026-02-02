import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateApplicationPermissionDto {
  @ApiProperty({
    description: 'Permission name',
    example: 'create_user',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Permission description',
    example: 'Permission to create new users',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Permission code',
    example: 'user.create',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Permission resource',
    example: 'user',
    required: false,
  })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiProperty({
    description: 'Permission action',
    example: 'create',
    required: false,
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({
    description: 'Is permission active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateApplicationPermissionDto {
  @ApiProperty({
    description: 'Permission name',
    example: 'create_user',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Permission description',
    example: 'Permission to create new users',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Permission code',
    example: 'user.create',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({
    description: 'Permission resource',
    example: 'user',
    required: false,
  })
  @IsString()
  @IsOptional()
  resource?: string;

  @ApiProperty({
    description: 'Permission action',
    example: 'create',
    required: false,
  })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiProperty({
    description: 'Is permission active',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
