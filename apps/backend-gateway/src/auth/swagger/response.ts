import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJSUzI1NiIs...' })
  access_token: string;

  @ApiProperty({ description: 'Refresh token for obtaining new access tokens', example: 'eyJhbGciOiJIUzI1NiIs...' })
  refresh_token: string;

  @ApiPropertyOptional({ description: 'Token expiration time in seconds', example: 300 })
  expires_in?: number;

  @ApiPropertyOptional({ description: 'Refresh token expiration time in seconds', example: 1800 })
  refresh_expires_in?: number;

  @ApiPropertyOptional({ description: 'Token type', example: 'Bearer' })
  token_type?: string;
}

export class RegisterResponseDto {
  @ApiProperty({ description: 'Newly created user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Username', example: 'johndoe' })
  username?: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'john.doe@example.com' })
  email?: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'New JWT access token', example: 'eyJhbGciOiJSUzI1NiIs...' })
  access_token: string;

  @ApiProperty({ description: 'New refresh token', example: 'eyJhbGciOiJIUzI1NiIs...' })
  refresh_token: string;

  @ApiPropertyOptional({ description: 'Token expiration time in seconds', example: 300 })
  expires_in?: number;

  @ApiPropertyOptional({ description: 'Refresh token expiration time in seconds', example: 1800 })
  refresh_expires_in?: number;
}

export class MessageResponseDto {
  @ApiProperty({ description: 'Response message', example: 'Operation successful' })
  message: string;
}
