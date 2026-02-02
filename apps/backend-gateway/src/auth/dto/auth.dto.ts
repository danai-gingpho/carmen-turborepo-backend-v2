import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const InviteUserSchema = z.object({
  email: z
    .string({ required_error: 'Email field is required' })
    .email({ message: 'Invalid email address' }),
});

export type IInviteUser = z.infer<typeof InviteUserSchema>;
export class InviteUserDto extends createZodDto(InviteUserSchema) { }

export const RegisterConfirmSchema = z.object({
  // username: z.string({ required_error: 'Username field is required' }),
  // email: z
  //   .string({ required_error: 'Email field is required' })
  //   .email({ message: 'Invalid email address' }),
  email_token: z.string({ required_error: 'Email token field is required' }),
  reference_code: z.string({ required_error: 'Reference code field is required' }),
  password: z
    .string({ required_error: 'Password field is required' })
    .min(6, { message: 'Password must be at least 6 characters long' }),
  user_info: z.object({
    first_name: z.string({ required_error: 'First name field is required' }),
    middle_name: z.string().optional(),
    last_name: z.string({ required_error: 'Last name field is required' }),
  }),
});
export type IRegisterConfirm = z.infer<typeof RegisterConfirmSchema>;
export class RegisterConfirmDto extends createZodDto(RegisterConfirmSchema) { }

export const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email field is required' })
    .email({ message: 'Invalid email address' }),
  password: z
    .string({ required_error: 'Password field is required' })
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

export type ILogin = z.infer<typeof LoginSchema>;
export class LoginDto extends createZodDto(LoginSchema) { }

export const ResetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email field is required' })
    .email({ message: 'Invalid email address' }),
  new_password: z
    .string({ required_error: 'New password field is required' })
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

export type IResetPassword = z.infer<typeof ResetPasswordSchema>;
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) { }

export const RegisterSchema = z.object({
  username: z.string({ required_error: 'Username field is required' }),
  email: z
    .string({ required_error: 'Email field is required' })
    .email({ message: 'Invalid email address' }),
  password: z
    .string({ required_error: 'Password field is required' })
    .min(6, { message: 'Password must be at least 6 characters long' }),
  user_info: z.object({
    first_name: z.string({ required_error: 'First name field is required' }),
    middle_name: z.string().optional(),
    last_name: z.string({ required_error: 'Last name field is required' }),
    telephone: z.string().optional(),
  }),
});

export type IRegister = z.infer<typeof RegisterSchema>;
export class RegisterDto extends createZodDto(RegisterSchema) { }

export const UpdateUserProfileSchema = z.object({
  firstname: z.string().optional(),
  middlename: z.string().optional().nullable(),
  lastname: z.string().optional(),
  telephone: z.string().optional().nullable(),
});

export type IUpdateUserProfile = z.infer<typeof UpdateUserProfileSchema>;
export class UpdateUserProfileDto extends createZodDto(UpdateUserProfileSchema) { }

export const ForgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email field is required' })
    .email({ message: 'Invalid email address' }),
});

export type IForgotPassword = z.infer<typeof ForgotPasswordSchema>;
export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) { }

export const ResetPasswordWithTokenSchema = z.object({
  token: z.string({ required_error: 'Token field is required' }),
  new_password: z
    .string({ required_error: 'New password field is required' })
    .min(6, { message: 'Password must be at least 6 characters long' }),
});

export type IResetPasswordWithToken = z.infer<typeof ResetPasswordWithTokenSchema>;
export class ResetPasswordWithTokenDto extends createZodDto(ResetPasswordWithTokenSchema) { }
