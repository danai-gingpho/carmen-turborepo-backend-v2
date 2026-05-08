export class ForgotPasswordDto {
  email: string;
}

export class ResetPasswordWithTokenDto {
  token: string;
  new_password: string;
}
