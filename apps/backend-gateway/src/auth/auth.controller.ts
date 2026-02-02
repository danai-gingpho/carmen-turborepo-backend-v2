import {
  Controller,
  ConsoleLogger,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Get,
  Req,
  UseGuards,
  UseFilters,
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
} from './dto/auth.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHideProperty,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiTags } from '@nestjs/swagger';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { KeycloakGuard } from './guards/keycloak.guard';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { Glob } from 'bun';
import { ExceptionFilter } from 'src/exception/exception.fillter';
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

  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @UseGuards(new AppIdGuard('auth.login'))
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: LoginDto,
    description: 'Login',
    examples: {
      Login: {
        value: {
          email: 'test@test.com',
          password: '12345678',
        },
      },
      'Login with wrong email': {
        value: {
          email: 'test@test.com',
          password: 'password',
        },
      },
    },
  })
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Login',
    description: 'Login to the application',
    operationId: 'login',
    tags: ['Authentication'],
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
  })
  async login(
    @Body() loginDto: LoginDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'login',
        loginDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.login(loginDto, version);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @UseGuards(KeycloakGuard, TenantHeaderGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout',
    description: 'Logout from the application',
    operationId: 'logout',
    tags: ['Authentication'],
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
  })
  async logout(
    @Query('version') version: string = 'latest',
    @Body() body: any,
    @Req() req: Request,
  ): Promise<any> {
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

  @Post('register')
  // @UseGuards(KeycloakGuard, TenantHeaderGuard)
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
    description: 'Register a new user (requires authentication)',
    operationId: 'register',
    tags: ['Register'],
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
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'register',
        registerDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.register(registerDto, version);
  }

  @Post('invite-user')
  @UseGuards(KeycloakGuard, TenantHeaderGuard)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Invite User',
    description: 'Invite a new user',
    operationId: 'inviteUser',
    tags: ['Register'],
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
  })
  async inviteUser(
    @Body() inviteUserDto: InviteUserDto,
    @Query('version') version: string = 'latest',
    @Req() req: Request,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'inviteUser',
        inviteUserDto,
        version,
      },
      AuthController.name,
    );

    const { user_id } = ExtractRequestHeader(req);

    return this.authService.inviteUser(inviteUserDto, user_id, version);
  }

  @Post('register-confirm')
  @IgnoreGuards(KeycloakGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Register Confirm',
    description: 'Confirm a new user',
    operationId: 'registerConfirm',
    tags: ['Register'],
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
  })
  async registerConfirm(
    @Body() registerConfirmDto: RegisterConfirmDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'registerConfirm',
        registerConfirmDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.registerConfirm(registerConfirmDto, version);
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

  @Post('refresh-token')
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Refresh Token',
    description: 'Refresh a token',
    operationId: 'refreshToken',
    tags: ['Authentication'],
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
  })
  async refreshToken(
    @Body() refreshTokenDto: any,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
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
    description: 'Request password reset. Sends an email with reset link to the user.',
    operationId: 'forgotPassword',
    tags: ['Authentication'],
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
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'forgotPassword',
        forgotPasswordDto,
        version,
      },
      AuthController.name,
    );

    return this.authService.forgotPassword(forgotPasswordDto, version);
  }

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
    description: 'Reset password using the token received via email',
    operationId: 'resetPasswordWithToken',
    tags: ['Authentication'],
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
  })
  async resetPasswordWithToken(
    @Body() resetPasswordWithTokenDto: ResetPasswordWithTokenDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'resetPasswordWithToken',
        token: resetPasswordWithTokenDto.token,
        version,
      },
      AuthController.name,
    );

    return this.authService.resetPasswordWithToken(resetPasswordWithTokenDto, version);
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

  @Post('reset-password')
  @UseGuards(KeycloakGuard, TenantHeaderGuard)
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
    description: 'Reset user password using admin privileges',
    operationId: 'resetPassword',
    tags: ['Authentication'],
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
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Query('version') version: string = 'latest',
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'resetPassword',
        email: resetPasswordDto.email,
        version,
      },
      AuthController.name,
    );

    return this.authService.resetPassword(resetPasswordDto, version);
  }

  @Post('change-password')
  @UseGuards(KeycloakGuard, TenantHeaderGuard)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Change Password',
    examples: {
      'Change Password': {
        value: {
          email: 'user@example.com',
          new_password: 'newPassword123',
        },
      },
    },
  })
  @ApiOperation({
    summary: 'Change Password',
    description: 'Change user password',
    operationId: 'changePassword',
    tags: ['Authentication'],
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
        description: 'Password changed successfully',
      },
      400: {
        description: 'Bad request',
      },
      404: {
        description: 'User not found',
      },
    },
  })
  async changePassword(
    @Body() changePasswordDto: any,
    @Req() req: any,
    @Query('version') version: string,
  ) {
    this.logger.log({
      file: AuthController.name,
      function: this.changePassword.name,
      changePasswordDto: changePasswordDto,
      version: version,
    });

    const { user_id } = ExtractRequestHeader(req);

    const dto = { ...changePasswordDto, user_id: user_id }

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

  @Get('test-notification')
  @ApiVersionMinRequest()
  async getAllUsers(@Query('version') version: string = 'latest') {
    // get all user in tb_user
    return this.authService.getAllUsers(version);
  }
}
