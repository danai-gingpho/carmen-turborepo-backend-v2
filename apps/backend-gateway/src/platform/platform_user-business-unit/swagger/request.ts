import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserBusinessUnitCreateRequestDto {
  @ApiProperty({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id: string;

  @ApiProperty({ description: 'Business unit ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  business_unit_id: string;

  @ApiProperty({ description: 'User role in business unit', example: 'user', enum: ['admin', 'user'] })
  role: string;

  @ApiPropertyOptional({ description: 'Is default business unit for the user', example: false })
  is_default?: boolean;

  @ApiPropertyOptional({ description: 'Is mapping active', example: true })
  is_active?: boolean;
}

export class UserBusinessUnitUpdateRequestDto {
  @ApiPropertyOptional({ description: 'User ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  user_id?: string;

  @ApiPropertyOptional({ description: 'Business unit ID', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  business_unit_id?: string;

  @ApiPropertyOptional({ description: 'User role in business unit', example: 'user', enum: ['admin', 'user'] })
  role?: string;

  @ApiPropertyOptional({ description: 'Is default business unit for the user', example: false })
  is_default?: boolean;

  @ApiPropertyOptional({ description: 'Is mapping active', example: true })
  is_active?: boolean;
}
