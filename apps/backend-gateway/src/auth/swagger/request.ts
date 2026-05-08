import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({ description: 'User email address', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'User password (min 6 characters)', example: 'password123' })
  password: string;
}

export class RegisterRequestDto {
  @ApiProperty({ description: 'Username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'Password (min 6 characters)', example: 'password123' })
  password: string;

  @ApiProperty({
    description: 'User profile information',
    example: { first_name: 'John', middle_name: '', last_name: 'Doe', telephone: '0812345678' },
  })
  user_info: {
    first_name: string;
    middle_name?: string;
    last_name: string;
    telephone?: string;
  };
}

export class InviteUserRequestDto {
  @ApiProperty({ description: 'Email address of the user to invite', example: 'newuser@example.com' })
  email: string;
}

export class RegisterConfirmRequestDto {
  @ApiProperty({ description: 'Email verification token from the invitation link', example: 'abc123token' })
  email_token: string;

  @ApiProperty({ description: 'Reference code from the invitation', example: 'REF-001' })
  reference_code: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'password123' })
  password: string;

  @ApiProperty({
    description: 'User profile information',
    example: { first_name: 'John', middle_name: '', last_name: 'Doe' },
  })
  user_info: {
    first_name: string;
    middle_name?: string;
    last_name: string;
  };
}

export class RefreshTokenRequestDto {
  @ApiProperty({ description: 'Refresh token from the login response', example: 'eyJhbGciOi...' })
  refresh_token: string;
}

export class ForgotPasswordRequestDto {
  @ApiProperty({ description: 'Registered email address', example: 'john.doe@example.com' })
  email: string;
}

export class ResetPasswordWithTokenRequestDto {
  @ApiProperty({ description: 'Password reset token from the email link', example: 'abc123token' })
  token: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'newPassword123' })
  new_password: string;
}

export class ResetPasswordRequestDto {
  @ApiProperty({ description: 'Email of the user to reset', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'newPassword123' })
  new_password: string;
}

export class ChangePasswordRequestDto {
  @ApiProperty({ description: 'Current password for verification', example: 'currentPassword123' })
  current_password: string;

  @ApiProperty({ description: 'New password (min 6 characters)', example: 'newPassword123' })
  new_password: string;
}

export class LogoutRequestDto {
  @ApiPropertyOptional({ description: 'Refresh token to invalidate', example: 'eyJhbGciOi...' })
  refresh_token?: string;
}
