import {
  Controller,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  InviteUserDto,
  LoginDto,
  RegisterConfirmDto,
  RegisterDto,
  ResetPasswordDto,
  ForgotPasswordDto,
  ResetPasswordWithTokenDto,
  ChangePasswordDto,
} from './dto/auth.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHideProperty,
  ApiOperation,
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { KeycloakGuard } from './guards/keycloak.guard';

import { IgnoreGuards } from './decorators/ignore-guard.decorator';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/auth')
// @UseFilters(ExceptionFilter)
@ApiTags('Authentication')
@ApiHeaderRequiredXAppId()
export class AuthController {
  private readonly logger: BackendLogger = new BackendLogger(
    AuthController.name,
  );

  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticate user with email/username and password via Keycloak
   * ยืนยันตัวตนผู้ใช้ด้วยอีเมล/ชื่อผู้ใช้และรหัสผ่านผ่าน Keycloak
   * @param loginDto - Login credentials (email/username + password) / ข้อมูลการเข้าสู่ระบบ (อีเมล/ชื่อผู้ใช้ + รหัสผ่าน)
   * @param version - API version / เวอร์ชัน API
   * @returns JWT access and refresh tokens / โทเค็น JWT สำหรับการเข้าถึงและรีเฟรช
   */
  @Post('login')
  @UseGuards(new AppIdGuard('auth.login'))
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: LoginDto,
    description: 'Login with email or username',
    examples: {
      'Login with email': {
        value: {
          email: 'test@test.com',
          password: '12345678',
        },
      },
      'Login with username': {
        value: {
          username: 'john.doe',
          password: '12345678',
        },
      },
    },
  })
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticates a user against Keycloak using email or username with password credentials, returning JWT access and refresh tokens for subsequent API requests across all ERP modules.',
    operationId: 'login',
    deprecated: false,
    security: [{}],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Login successful',
      },
      401: {
        description: 'Unauthorized',
      },
    },
    'x-description-th': 'เข้าสู่ระบบ - ยืนยันตัวตนผู้ใช้ด้วยอีเมลหรือชื่อผู้ใช้และรหัสผ่านผ่าน Keycloak เพื่อรับโทเค็น JWT สำหรับเรียก API ทุกโมดูล ERP',
  } as any)
  async login(
    @Body() loginDto: LoginDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'login',
        loginDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.login({ ...loginDto }, version);
  }

  /**
   * Terminate user session by invalidating Keycloak tokens
   * สิ้นสุดเซสชันผู้ใช้โดยการยกเลิกโทเค็น Keycloak
   * @param version - API version / เวอร์ชัน API
   * @param body - Request body containing refresh_token / เนื้อหาคำขอที่มี refresh_token
   * @param req - HTTP request with user context / คำขอ HTTP ที่มีบริบทผู้ใช้
   * @returns Logout confirmation / ผลลัพธ์การออกจากระบบ
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @UseGuards(KeycloakGuard)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refresh_token'],
      properties: {
        refresh_token: { type: 'string', description: 'Refresh token obtained from login response, required to invalidate the session', example: 'eyJhbGciOi...' },
      },
    },
    description: 'Provide the refresh_token to revoke the user session via Keycloak OIDC logout',
    required: true,
  })
  @ApiOperation({
    summary: 'Logout',
    description: 'Terminates the user\'s authenticated session by invalidating their Keycloak tokens, ensuring they can no longer access ERP resources until they log in again.',
    operationId: 'logout',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Logout successful',
      },
      401: {
        description: 'Unauthorized',
      },
    },
    'x-description-th': 'ออกจากระบบ - สิ้นสุดเซสชันผู้ใช้โดยยกเลิกโทเค็น Keycloak เพื่อป้องกันการเข้าถึงทรัพยากร ERP จนกว่าจะเข้าสู่ระบบอีกครั้ง',
  } as any)
  async logout(
    @Query('version') version: string = 'latest',
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ): Promise<unknown> {
    const { user_id } = ExtractRequestHeader(req);

    const logoutDto = { user_id: user_id, ...body };

    this.logger.debug(
      {
        function: 'logout',
        logoutDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.logout(logoutDto, version);
  }

  /**
   * Register a new user account in Keycloak and the Carmen platform
   * สร้างบัญชีผู้ใช้ใหม่ใน Keycloak และแพลตฟอร์ม Carmen
   * @param registerDto - Registration details (username, email, password, user_info) / ข้อมูลการลงทะเบียน (ชื่อผู้ใช้, อีเมล, รหัสผ่าน, ข้อมูลผู้ใช้)
   * @param version - API version / เวอร์ชัน API
   * @returns Created user data / ข้อมูลผู้ใช้ที่สร้างแล้ว
   */
  @Post('register')
  // @UseGuards(KeycloakGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiVersionMinRequest()
  @ApiBody({
    type: RegisterDto,
    description: 'Register a new user',
    examples: {
      Register: {
        value: {
          username: 'johndoe',
          email: 'john.doe@example.com',
          password: 'password123',
          user_info: {
            first_name: 'John',
            middle_name: '',
            last_name: 'Doe',
            telephone: '0812345678',
          },
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Register',
    description: 'Creates a new user account in both Keycloak and the Carmen platform. Used to onboard new hotel staff such as purchasers, department heads, or property managers into the ERP system.',
    operationId: 'register',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      201: {
        description: 'Register successful',
      },
      401: {
        description: 'Unauthorized',
      },
      409: {
        description: 'User already exists',
      },
    },
    'x-description-th': 'ลงทะเบียน - สร้างบัญชีผู้ใช้ใหม่ใน Keycloak และแพลตฟอร์ม Carmen สำหรับเพิ่มพนักงานโรงแรมเข้าสู่ระบบ ERP',
  } as any)
  async register(
    @Body() registerDto: RegisterDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'register',
        registerDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.register({ ...registerDto }, version);
  }

  /**
   * Send an invitation email to a new user to join the platform
   * ส่งอีเมลเชิญผู้ใช้ใหม่เข้าร่วมแพลตฟอร์ม
   * @param inviteUserDto - Invitation details (email) / ข้อมูลการเชิญ (อีเมล)
   * @param version - API version / เวอร์ชัน API
   * @param req - HTTP request with authenticated user context / คำขอ HTTP ที่มีบริบทผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @returns Invitation result / ผลลัพธ์การเชิญ
   */
  @Post('invite-user')
  @UseGuards(KeycloakGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiVersionMinRequest()
  @ApiBody({ type: InviteUserDto, description: 'Email of the user to invite' })
  @ApiOperation({
    summary: 'Invite User',
    description: 'Sends an invitation to a new user to join the Carmen ERP platform. The invited user receives a registration link to complete their account setup and gain access to assigned hotel properties.',
    operationId: 'inviteUser',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Invite user successful',
      },
      401: {
        description: 'Unauthorized',
      },
    },
    'x-description-th': 'เชิญผู้ใช้ - ส่งคำเชิญไปยังผู้ใช้ใหม่เพื่อเข้าร่วมแพลตฟอร์ม Carmen ERP โดยผู้ใช้จะได้รับลิงก์ลงทะเบียนทางอีเมล',
  } as any)
  async inviteUser(
    @Body() inviteUserDto: InviteUserDto,
    @Query('version') version: string = 'latest',
    @Req() req: Request,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'inviteUser',
        inviteUserDto,
        version,
      },
      AuthController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    return this.authService.inviteUser({ ...inviteUserDto }, user_id, version);
  }

  /**
   * Complete registration for an invited user by verifying the invitation token
   * ดำเนินการลงทะเบียนให้เสร็จสมบูรณ์สำหรับผู้ใช้ที่ได้รับเชิญโดยตรวจสอบโทเค็นการเชิญ
   * @param registerConfirmDto - Confirmation details (token, user info) / ข้อมูลยืนยัน (โทเค็น, ข้อมูลผู้ใช้)
   * @param version - API version / เวอร์ชัน API
   * @returns Activated user data / ข้อมูลผู้ใช้ที่เปิดใช้งานแล้ว
   */
  @Post('register-confirm')
  @IgnoreGuards(KeycloakGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiBody({ type: RegisterConfirmDto, description: 'Registration confirmation with token and user info' })
  @ApiOperation({
    summary: 'Register Confirm',
    description: 'Completes the registration process for an invited user by verifying their invitation token and activating their account in the Carmen ERP platform.',
    operationId: 'registerConfirm',
    deprecated: false,
    security: [{}],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Register confirm successful',
      },
      401: {
        description: 'Unauthorized',
      },
    },
    'x-description-th': 'ยืนยันการลงทะเบียน - ดำเนินการลงทะเบียนให้เสร็จสมบูรณ์สำหรับผู้ใช้ที่ได้รับเชิญ โดยตรวจสอบโทเค็นการเชิญและเปิดใช้งานบัญชี',
  } as any)
  async registerConfirm(
    @Body() registerConfirmDto: RegisterConfirmDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'registerConfirm',
        registerConfirmDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.registerConfirm({ ...registerConfirmDto }, version);
  }

  // @Post('verify-token')
  // async verifyToken(
  //   @Body() verifyTokenDto: any,
  //   @Query('version') version: string,
  // ) {
  //   this.logger.log({
  //     file: AuthController.name,
  //     function: this.verifyToken.name,
  //     verifyTokenDto: verifyTokenDto,
  //     version: version,
  //   });
  //   return this.authService.verifyToken(verifyTokenDto, version);
  // }

  /**
   * Exchange a refresh token for a new access token
   * แลกเปลี่ยน refresh token เพื่อรับ access token ใหม่
   * @param refreshTokenDto - Object containing the refresh_token / อ็อบเจกต์ที่มี refresh_token
   * @param version - API version / เวอร์ชัน API
   * @returns New access and refresh tokens / โทเค็นการเข้าถึงและรีเฟรชใหม่
   */
  @Post('refresh-token')
  @ApiVersionMinRequest()
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refresh_token'],
      properties: {
        refresh_token: { type: 'string', description: 'Refresh token from login response', example: 'eyJhbGciOi...' },
      },
    },
    description: 'Refresh token request body',
  })
  @ApiOperation({
    summary: 'Refresh Token',
    description: 'Exchanges an expired or expiring access token for a new one using the refresh token, maintaining the user\'s authenticated session without requiring them to log in again.',
    operationId: 'refreshToken',
    deprecated: false,
    security: [{}],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Refresh token successful',
      },
      401: {
        description: 'Unauthorized',
      },
    },
    'x-description-th': 'รีเฟรชโทเค็น - แลกเปลี่ยน refresh token เพื่อรับ access token ใหม่ โดยไม่ต้องเข้าสู่ระบบอีกครั้ง',
  } as any)
  async refreshToken(
    @Body() refreshTokenDto: Record<string, unknown>,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'refreshToken',
        refreshTokenDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.refreshToken(refreshTokenDto, version);
  }

  /**
   * Initiate password recovery by sending a reset email with a secure token
   * เริ่มกระบวนการกู้คืนรหัสผ่านโดยส่งอีเมลรีเซ็ตพร้อมโทเค็นที่ปลอดภัย
   * @param forgotPasswordDto - User email address / อีเมลของผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Confirmation that the reset email was sent / การยืนยันว่าอีเมลรีเซ็ตถูกส่งแล้ว
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'Forgot Password - Send reset email',
    examples: {
      'Forgot Password': {
        value: {
          email: 'user@example.com',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Forgot Password',
    description:
      'Initiates the password recovery flow for a user who has forgotten their credentials. Sends a password reset email with a secure token link to the registered email address.',
    operationId: 'forgotPassword',
    deprecated: false,
    security: [{}],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Password reset email sent successfully',
      },
      404: {
        description: 'User not found',
      },
    },
    'x-description-th': 'ลืมรหัสผ่าน - เริ่มกระบวนการกู้คืนรหัสผ่านโดยส่งอีเมลรีเซ็ตพร้อมโทเค็นที่ปลอดภัยไปยังอีเมลที่ลงทะเบียนไว้',
  } as any)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'forgotPassword',
        forgotPasswordDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.forgotPassword({ ...forgotPasswordDto }, version);
  }

  /**
   * Reset password using a single-use token received via email
   * รีเซ็ตรหัสผ่านโดยใช้โทเค็นแบบใช้ครั้งเดียวที่ได้รับทางอีเมล
   * @param resetPasswordWithTokenDto - Token and new password / โทเค็นและรหัสผ่านใหม่
   * @param version - API version / เวอร์ชัน API
   * @returns Password reset confirmation / การยืนยันการรีเซ็ตรหัสผ่าน
   */
  @Post('reset-password-with-token')
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBody({
    type: ResetPasswordWithTokenDto,
    description: 'Reset password using token from email',
    examples: {
      'Reset Password': {
        value: {
          token: 'abc123',
          new_password: 'newPassword123',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Reset Password with Token',
    description: 'Completes the password recovery process by setting a new password using the secure token received via the forgot-password email. The token is single-use and time-limited for security.',
    operationId: 'resetPasswordWithToken',
    deprecated: false,
    security: [{}],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Password reset successful',
      },
      400: {
        description: 'Invalid or expired token',
      },
      404: {
        description: 'Token not found',
      },
    },
    'x-description-th': 'รีเซ็ตรหัสผ่านด้วยโทเค็น - ตั้งรหัสผ่านใหม่โดยใช้โทเค็นแบบใช้ครั้งเดียวที่ได้รับทางอีเมล โทเค็นมีกำหนดเวลาใช้งาน',
  } as any)
  async resetPasswordWithToken(
    @Body() resetPasswordWithTokenDto: ResetPasswordWithTokenDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'resetPasswordWithToken',
        token: resetPasswordWithTokenDto.token,
        version,
      },
      AuthController.name,
    );

    return this.authService.resetPasswordWithToken(
      { ...resetPasswordWithTokenDto },
      version,
    );
  }

  // @Get('mobile')
  // @ApiBearerAuth()
  // @ApiVersionMinRequest()
  // async mobile(@Req() req: any, @Query('version') version: string = 'latest') {
  //   const { authorization } = req.headers as any;
  //   const [, accessToken] = authorization.split(' ');
  //   const appId = req.headers['x-app-id'];
  //   return this.authService.permission_mobile(accessToken, appId, version);
  // }

  // @Get('web')
  // @ApiBearerAuth()
  // @ApiVersionMinRequest()
  // async web(@Req() req: any, @Query('version') version: string = 'latest') {
  //   const { authorization } = req.headers as any;
  //   const [, accessToken] = authorization.split(' ');
  //   return this.authService.permission_web(accessToken, version);
  // }

  /**
   * Admin-only: forcibly reset another user's password
   * สำหรับผู้ดูแลระบบ: รีเซ็ตรหัสผ่านของผู้ใช้รายอื่นโดยไม่ต้องใช้รหัสผ่านปัจจุบัน
   * @param resetPasswordDto - Target user email and new password / อีเมลผู้ใช้เป้าหมายและรหัสผ่านใหม่
   * @param version - API version / เวอร์ชัน API
   * @returns Password reset confirmation / การยืนยันการรีเซ็ตรหัสผ่าน
   */
  @Post('reset-password')
  @UseGuards(KeycloakGuard)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiHideProperty()
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Reset Password',
    examples: {
      'Reset Password': {
        value: {
          email: 'user@example.com',
          new_password: 'newPassword123',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Reset Password',
    description: 'Allows a platform administrator to forcibly reset another user\'s password without requiring the user\'s current password. Used for support scenarios when hotel staff are locked out of their accounts.',
    operationId: 'resetPassword',
    deprecated: false,
    security: [{}],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Password reset successful',
      },
      400: {
        description: 'Bad request',
      },
      404: {
        description: 'User not found',
      },
    },
    'x-description-th': 'รีเซ็ตรหัสผ่าน - ผู้ดูแลระบบสามารถรีเซ็ตรหัสผ่านของผู้ใช้รายอื่นโดยไม่ต้องใช้รหัสผ่านปัจจุบัน สำหรับกรณีที่พนักงานโรงแรมถูกล็อกบัญชี',
  } as any)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Query('version') version: string = 'latest',
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'resetPassword',
        email: resetPasswordDto.email,
        version,
      },
      AuthController.name,
    );

    return this.authService.resetPassword({ ...resetPasswordDto }, version);
  }

  /**
   * Change the authenticated user's own password
   * เปลี่ยนรหัสผ่านของผู้ใช้ที่เข้าสู่ระบบอยู่
   * @param changePasswordDto - Current and new password / รหัสผ่านปัจจุบันและรหัสผ่านใหม่
   * @param req - HTTP request with user context / คำขอ HTTP ที่มีบริบทผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Password change confirmation / การยืนยันการเปลี่ยนรหัสผ่าน
   */
  @Post('change-password')
  @UseGuards(KeycloakGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiVersionMinRequest()
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Change Password',
    examples: {
      'Change Password': {
        value: {
          current_password: 'currentPassword123',
          new_password: 'newPassword123',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Change Password',
    description:
      'Allows an authenticated user to change their own password by providing their current password for verification. This is the standard self-service password update flow for ERP users.',
    operationId: 'changePassword',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Password changed successfully',
      },
      400: {
        description: 'Bad request or incorrect current password',
      },
      401: {
        description: 'Unauthorized',
      },
    },
    'x-description-th': 'เปลี่ยนรหัสผ่าน - ผู้ใช้ที่เข้าสู่ระบบสามารถเปลี่ยนรหัสผ่านของตนเองโดยระบุรหัสผ่านปัจจุบันเพื่อยืนยัน',
  } as any)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request,
    @Query('version') version: string = 'latest',
  ) {
    this.logger.debug(
      {
        function: 'changePassword',
        version,
      },
      AuthController.name,
    );

    const { user_id, accessToken } = ExtractRequestHeader(req);

    const dto = {
      ...changePasswordDto,
      user_id,
      accessToken,
    };

    return this.authService.changePassword(dto, version);
  }

  // @Post('change-email')
  // async changeEmail(
  //   @Body() changeEmailDto: any,
  //   @Query('version') version: string,
  // ) {
  //   this.logger.log({
  //     file: AuthController.name,
  //     function: this.changeEmail.name,
  //     changeEmailDto: changeEmailDto,
  //     version: version,
  //   });
  //   return this.authService.changeEmail(changeEmailDto, version);
  // }

  /**
   * Retrieve all platform users for notification testing (dev/test only)
   * ดึงข้อมูลผู้ใช้ทั้งหมดในแพลตฟอร์มสำหรับทดสอบการแจ้งเตือน (สำหรับพัฒนา/ทดสอบเท่านั้น)
   * @param version - API version / เวอร์ชัน API
   * @returns List of all users / รายชื่อผู้ใช้ทั้งหมด
   */
  @Get('test-notification')
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all users (test)',
    description: 'Retrieves all platform users for notification testing purposes. This is a development/test endpoint.',
    operationId: 'getAllUsersTest',
    deprecated: true,
    responses: {
      200: {
        description: 'Users retrieved successfully',
      },
    },
    'x-description-th': 'ดึงข้อมูลผู้ใช้ทั้งหมด (ทดสอบ) - ดึงรายชื่อผู้ใช้ทั้งหมดในแพลตฟอร์มสำหรับทดสอบการแจ้งเตือน endpoint นี้สำหรับพัฒนา/ทดสอบเท่านั้น',
  } as any)
  async getAllUsers(@Query('version') version: string = 'latest') {
    // get all user in tb_user
    return this.authService.getAllUsers(version);
  }
}
