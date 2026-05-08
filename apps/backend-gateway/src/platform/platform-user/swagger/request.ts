import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlatformUserRequestDto {
  @ApiProperty({ description: 'Username', example: 'john.doe' })
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiPropertyOptional({ description: 'Alias name', example: 'JD' })
  alias_name?: string;

  @ApiPropertyOptional({
    description: 'Platform role',
    example: 'user',
    enum: ['super_admin', 'platform_admin', 'support_manager', 'support_staff', 'security_officer', 'integration_developer', 'user'],
  })
  platform_role?: string;

  @ApiPropertyOptional({ description: 'Is user active', example: true })
  is_active?: boolean;
}

export class UpdatePlatformUserRequestDto {
  @ApiPropertyOptional({ description: 'Username', example: 'john.doe' })
  username?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john.doe@example.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Alias name', example: 'JD' })
  alias_name?: string;

  @ApiPropertyOptional({
    description: 'Platform role',
    example: 'user',
    enum: ['super_admin', 'platform_admin', 'support_manager', 'support_staff', 'security_officer', 'integration_developer', 'user'],
  })
  platform_role?: string;

  @ApiPropertyOptional({ description: 'Is user active', example: true })
  is_active?: boolean;
}
