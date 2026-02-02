import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { LoginDto } from './dto/login.dto';
import {
  IInviteUser,
  IRegister,
  IRegisterConfirm,
  RegisterDto,
} from './dto/register.dto';
import { LogoutDto } from './dto/logout.dto';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import {
  ForgotPasswordDto,
  ResetPasswordWithTokenDto,
} from './dto/forgotpassword.dto';
import { JwtService } from '@nestjs/jwt';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant/dist';
import { TenantService } from '@/tenant/tenant.service';
import { addHours } from 'date-fns';
import { ChangePasswordDto } from './dto/changepassword';

@Injectable()
export class AuthService {
  private readonly logger: BackendLogger = new BackendLogger(AuthService.name);

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly jwtService: JwtService,
    @Inject('PRISMA_TENANT')
    private readonly prismaTenant: typeof PrismaClient_TENANT,
    private readonly tenantService: TenantService,
    @Inject('KEYCLOAK_SERVICE')
    private readonly keycloakService: ClientProxy,
  ) {}

  /**
   * Log authentication activity to the user's default tenant database
   */
  private async logAuthActivity(
    action: 'login' | 'logout',
    userId: string,
    email: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      // Find user's default business unit
      const userBusinessUnit =
        await this.prismaSystem.tb_user_tb_business_unit.findFirst({
          where: {
            user_id: userId,
            is_default: true,
            is_active: true,
          },
          include: {
            tb_business_unit: true,
          },
        });

      if (!userBusinessUnit?.tb_business_unit) {
        this.logger.debug(
          {
            function: 'logAuthActivity',
            message:
              'No default business unit found for user, skipping activity log',
            userId,
          },
          AuthService.name,
        );
        return;
      }

      const businessUnit = userBusinessUnit.tb_business_unit;

      // Convert db_connection JSON to connection string
      const dbConfig = businessUnit.db_connection as {
        provider: 'postgresql' | 'mysql' | 'mssql' | 'sqlite';
        username: string;
        password: string;
        host: string;
        port: number;
        database: string;
        schema: string;
      };
      const connectionString = `postgres://${dbConfig.username}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}?schema=${dbConfig.schema}`;

      // Get tenant database connection
      const prismaTenant = await this.prismaTenant(
        businessUnit.id,
        connectionString,
      );

      // Log the activity
      await prismaTenant.tb_activity.create({
        data: {
          action: action,
          entity_type: 'auth',
          entity_id: userId,
          actor_id: userId,
          description: `User ${email} ${action === 'login' ? 'logged in' : 'logged out'}`,
          meta_data: metadata || {},
          created_by_id: userId,
        },
      });

      this.logger.debug(
        {
          function: 'logAuthActivity',
          message: `${action} activity logged successfully`,
          userId,
          businessUnitId: businessUnit.id,
        },
        AuthService.name,
      );
    } catch (error: any) {
      // Don't fail the auth operation if logging fails
      this.logger.error(`Failed to log ${action} activity: ${error.message}`, {
        file: AuthService.name,
        function: 'logAuthActivity',
        userId,
      });
    }
  }

  async login(loginDto: LoginDto, version: string): Promise<any> {
    this.logger.debug(
      { function: 'login', loginDto: loginDto, version: version },
      AuthService.name,
    );

    try {
      // Call Keycloak via TCP service
      const response = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.auth.login', service: 'keycloak' },
          { email: loginDto.email, password: loginDto.password },
        ),
      );

      this.logger.log({
        file: AuthService.name,
        function: this.login.name,
        loginDto: loginDto,
        version: version,
        keycloakResponse: response.response?.status,
      });

      if (response.response?.status !== HttpStatus.OK) {
        this.logger.error(
          response.response?.message || 'Authentication failed',
          {
            file: AuthService.name,
            function: this.login.name,
            loginDto: loginDto,
            version: version,
          },
        );
        return {
          response: {
            status: HttpStatus.UNAUTHORIZED,
            message: response.response?.message || 'Authentication failed',
          },
        };
      }

      // Log successful login activity
      try {
        // Look up user by email to get user_id
        const user = await this.prismaSystem.tb_user.findFirst({
          where: { email: loginDto.email },
          select: { id: true },
        });
        if (user?.id) {
          await this.logAuthActivity('login', user.id, loginDto.email, {
            login_time: new Date().toISOString(),
          });
        }
      } catch (logError) {
        // Don't fail login if activity logging fails
        this.logger.error(`Failed to log login activity: ${logError}`, {
          file: AuthService.name,
          function: this.login.name,
        });
      }

      return {
        data: {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_in: response.data.expires_in,
          token_type: response.data.token_type,
        },
        response: { status: HttpStatus.OK, message: 'Login successful' },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: this.login.name,
        loginDto: loginDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during login',
        },
      };
    }
  }

  async logout(logoutDto: LogoutDto, version: string): Promise<any> {
    this.logger.debug(
      { function: 'logout', logoutDto: logoutDto, version: version },
      AuthService.name,
    );

    // Get user info for activity logging
    const userId: string | null = logoutDto.user_id || null;
    let userEmail: string | null = null;

    // Look up user email if we have userId
    if (userId) {
      try {
        const user = await this.prismaSystem.tb_user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        userEmail = user?.email || null;
      } catch (lookupError) {
        this.logger.debug(
          {
            function: 'logout',
            message: 'Failed to lookup user for activity logging',
          },
          AuthService.name,
        );
      }
    }

    this.logger.debug(
      {
        function: 'logout',
        logoutDto: logoutDto,
        version: version,
        userId: userId,
        userEmail: userEmail,
      },
      AuthService.name,
    );

    try {
      // Call Keycloak via TCP service
      const response = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.auth.logoutById', service: 'keycloak' },
          { user_id: logoutDto.user_id },
        ),
      );

      this.logger.log({
        file: AuthService.name,
        function: this.logout.name,
        logoutDto: logoutDto,
        version: version,
        keycloakResponse: response.response?.status,
      });

      if (response.response?.status !== HttpStatus.OK) {
        this.logger.error(response.response?.message || 'Logout failed', {
          file: AuthService.name,
          function: this.logout.name,
          logoutDto: logoutDto,
          version: version,
        });
        return {
          response: {
            status: HttpStatus.UNAUTHORIZED,
            message: response.response?.message || 'Logout failed',
          },
        };
      }

      // Log successful logout activity
      if (userId && userEmail) {
        try {
          await this.logAuthActivity('logout', userId, userEmail, {
            logout_time: new Date().toISOString(),
          });
        } catch (logError) {
          // Don't fail logout if activity logging fails
          this.logger.error(`Failed to log logout activity: ${logError}`, {
            file: AuthService.name,
            function: this.logout.name,
          });
        }
      }

      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Logout successful',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: this.logout.name,
        logoutDto: logoutDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during logout',
        },
      };
    }
  }

  async inviteUser(
    inviteUserDto: IInviteUser,
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'inviteUser',
        inviteUserDto: inviteUserDto,
        version: version,
      },
      AuthService.name,
    );

    const findUser = await this.prismaSystem.tb_user.findFirst({
      where: { email: inviteUserDto.email },
    });

    if (findUser) {
      return {
        response: {
          status: HttpStatus.CONFLICT,
          message: 'User already exists',
        },
      };
    }

    const INVITATION_LIMIT_HOURS =
      Number(process.env.INVITATION_LIMIT_HOURS) || 1;
    const expired_at = addHours(new Date(), INVITATION_LIMIT_HOURS);
    const { ...payload }: object = {
      type: 'invite',
      username: inviteUserDto.email,
      email: inviteUserDto.email,
      exp: Math.floor(expired_at.getTime() / 1000),
    };

    const token = this.jwtService.sign(payload);

    let duplicateCheck = true;
    let invitationCode: string;
    while (duplicateCheck) {
      invitationCode = Math.random().toString(36).substring(2, 8);
      const existingInvitation = await this.prismaSystem.tb_shot_url.findFirst({
        where: { url_token: invitationCode },
      });

      if (!existingInvitation) {
        duplicateCheck = false;
      }
    }

    const res = await this.prismaSystem.tb_shot_url.create({
      data: {
        app_method: 'create_user_invitation',
        receiver_email: inviteUserDto.email,
        url_token: invitationCode,
        token: token,
        expired_at,
      },
    });

    // TODO call to 3rd party to send invitation like via email, line
    this.onPushNotification(
      res.token,
      `${process.env.REGISTER_BASE_URL}?invitation_code=${res.url_token}`,
    );

    return {
      data: { token: token },
      response: { status: HttpStatus.OK, message: 'Invite user successful' },
    };
  }

  async register(registerDto: IRegister, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'register',
        registerDto: registerDto,
        version: version,
      },
      AuthService.name,
    );

    const findUsername = await this.prismaSystem.tb_user.findFirst({
      where: { username: registerDto.username },
    });

    if (findUsername) {
      return {
        response: {
          status: HttpStatus.CONFLICT,
          message: 'Username already exists',
        },
      };
    }

    const findEmail = await this.prismaSystem.tb_user.findFirst({
      where: { email: registerDto.email },
    });

    if (findEmail) {
      return {
        response: {
          status: HttpStatus.CONFLICT,
          message: 'Email already exists',
        },
      };
    }

    try {
      // Create user in Keycloak via TCP service
      const keycloakUserPayload = {
        username: registerDto.username,
        email: registerDto.email,
        firstName: registerDto.user_info.first_name,
        lastName: registerDto.user_info.last_name,
        enabled: true,
        emailVerified: false,
        credentials: [
          {
            type: 'password',
            value: registerDto.password,
            temporary: false,
          },
        ],
      };

      this.logger.log({
        file: AuthService.name,
        function: 'register',
        message: 'Creating user in Keycloak',
        body: keycloakUserPayload,
      });

      const createUserResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.create', service: 'keycloak' },
          { data: keycloakUserPayload },
        ),
      );

      this.logger.log({
        file: AuthService.name,
        function: 'register',
        registerDto: registerDto,
        version: version,
        body: keycloakUserPayload,
        keycloakResponse: createUserResponse.response?.status,
      });

      if (
        createUserResponse.response?.status !== HttpStatus.CREATED &&
        createUserResponse.response?.status !== HttpStatus.OK
      ) {
        this.logger.error(
          createUserResponse.response?.message || 'register failed',
          {
            file: AuthService.name,
            function: 'keycloakCreateUserFail',
            registerDto: registerDto,
            version: version,
          },
        );
        return {
          response: {
            status: HttpStatus.BAD_REQUEST,
            message: createUserResponse.response?.message || 'register failed',
          },
        };
      }

      // Get the newly created user by email to get their Keycloak ID
      const getUserResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.getByEmail', service: 'keycloak' },
          { email: registerDto.email },
        ),
      );

      if (
        getUserResponse.response?.status !== HttpStatus.OK ||
        !getUserResponse.data
      ) {
        this.logger.error('Failed to find newly created user in Keycloak', {
          file: AuthService.name,
          function: 'register',
          email: registerDto.email,
        });
        return {
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed to verify user creation in identity provider',
          },
        };
      }

      const keycloakUserId = getUserResponse.data.id;

      const tx = await this.prismaSystem.$transaction(async (prisma) => {
        const createUser = await prisma.tb_user.create({
          data: {
            id: keycloakUserId,
            username: registerDto.username,
            email: registerDto.email,
            platform_role: 'user',
            is_active: true,
          },
        });

        await prisma.tb_user_profile.create({
          data: {
            user_id: createUser.id,
            firstname: registerDto.user_info.first_name,
            middlename: registerDto.user_info.middle_name ?? null,
            lastname: registerDto.user_info.last_name,
            telephone: registerDto.user_info.telephone ?? null,
            bio: {},
          },
        });

        return {
          data: { id: createUser.id },
          response: {
            status: HttpStatus.CREATED,
            message: 'Register successful',
          },
        };
      });

      return {
        data: tx.data,
        response: tx.response,
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: 'register failed',
        registerDto: registerDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during registration',
        },
      };
    }
  }

  async registerConfirm(
    registerConfirmDto: IRegisterConfirm,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'registerConfirm',
        registerConfirmDto: registerConfirmDto,
        version: version,
      },
      AuthService.name,
    );

    const inviteData = await this.prismaSystem.tb_shot_url.findFirst({
      where: {
        url_token: registerConfirmDto.reference_code,
        app_method: 'create_user_invitation',
        receiver_email: registerConfirmDto.email,
        expired_at: { gt: new Date() },
      },
    });
    if (!inviteData) {
      throw new BadRequestException('Invalid or expired invitation code');
    }

    const payload = await this.jwtService.verify(
      registerConfirmDto.email_token,
    );

    if (payload.type !== 'invite') {
      return {
        response: { status: HttpStatus.UNAUTHORIZED, message: 'Invalid token' },
      };
    }

    registerConfirmDto.email = payload.email;
    registerConfirmDto.username = payload.username;

    if (
      payload.email !== registerConfirmDto.email ||
      payload.username !== registerConfirmDto.username
    ) {
      return {
        response: { status: HttpStatus.UNAUTHORIZED, message: 'Invalid token' },
      };
    }

    const findUsername = await this.prismaSystem.tb_user.findFirst({
      where: { username: registerConfirmDto.username },
    });

    if (findUsername) {
      return {
        response: {
          status: HttpStatus.CONFLICT,
          message: 'Username already exists',
        },
      };
    }

    const findEmail = await this.prismaSystem.tb_user.findFirst({
      where: { email: registerConfirmDto.email },
    });

    if (findEmail) {
      return {
        response: {
          status: HttpStatus.CONFLICT,
          message: 'Email already exists',
        },
      };
    }

    try {
      // Create user in Keycloak via TCP service
      const keycloakUserPayload = {
        username: registerConfirmDto.username,
        email: registerConfirmDto.email,
        firstName: registerConfirmDto.user_info.first_name,
        lastName: registerConfirmDto.user_info.last_name,
        enabled: true,
        emailVerified: false,
        credentials: [
          {
            type: 'password',
            value: registerConfirmDto.password,
            temporary: false,
          },
        ],
      };

      console.log('before create keycloak user');

      const createUserResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.create', service: 'keycloak' },
          { data: keycloakUserPayload },
        ),
      );

      this.logger.log({
        file: AuthService.name,
        function: 'createUserInKeycloak',
        registerConfirmDto: registerConfirmDto,
        version: version,
        body: keycloakUserPayload,
        keycloakResponse: createUserResponse.response?.status,
      });

      if (
        createUserResponse.response?.status !== HttpStatus.CREATED &&
        createUserResponse.response?.status !== HttpStatus.OK
      ) {
        this.logger.error(
          createUserResponse.response?.message || 'register failed',
          {
            file: AuthService.name,
            function: 'keycloakCreateUserFail',
            registerConfirmDto: registerConfirmDto,
            version: version,
          },
        );
        return {
          response: {
            status: HttpStatus.BAD_REQUEST,
            message: createUserResponse.response?.message || 'register failed',
          },
        };
      }

      // Get the newly created user by email to get their Keycloak ID
      const getUserResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.getByEmail', service: 'keycloak' },
          { email: registerConfirmDto.email },
        ),
      );

      if (
        getUserResponse.response?.status !== HttpStatus.OK ||
        !getUserResponse.data
      ) {
        this.logger.error('Failed to find newly created user in Keycloak', {
          file: AuthService.name,
          function: 'registerConfirm',
          email: registerConfirmDto.email,
        });
        return {
          response: {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Failed to verify user creation in identity provider',
          },
        };
      }

      const keycloakUserId = getUserResponse.data.id;

      const tx = await this.prismaSystem.$transaction(async (prisma) => {
        const createUser = await prisma.tb_user.create({
          data: {
            id: keycloakUserId,
            username: registerConfirmDto.username,
            email: registerConfirmDto.email,
            platform_role: 'user',
            is_active: true,
          },
        });

        await prisma.tb_user_profile.create({
          data: {
            user_id: createUser.id,
            firstname: registerConfirmDto.user_info.first_name,
            middlename: registerConfirmDto.user_info.middle_name ?? null,
            lastname: registerConfirmDto.user_info.last_name,
            telephone: registerConfirmDto.user_info.telephone ?? null,
            bio: {},
          },
        });

        await prisma.tb_shot_url.update({
          where: { id: inviteData.id },
          data: {
            deleted_at: new Date(),
          },
        });

        return {
          data: { id: createUser.id },
          response: {
            status: HttpStatus.CREATED,
            message: 'Register successful',
          },
        };
      });

      return {
        data: tx.data,
        response: tx.response,
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: 'registerConfirm failed',
        registerConfirmDto: registerConfirmDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during logout',
        },
      };
    }
  }

  async refreshToken(refreshTokenDto: any, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'refreshToken',
        refreshTokenDto: refreshTokenDto,
        version: version,
      },
      AuthService.name,
    );
    try {
      // Call Keycloak via TCP service
      const response = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.auth.refresh', service: 'keycloak' },
          { refresh_token: refreshTokenDto.refresh_token },
        ),
      );

      this.logger.log({
        file: AuthService.name,
        function: this.refreshToken.name,
        refreshTokenDto: refreshTokenDto,
        version: version,
        keycloakResponse: response.response?.status,
      });

      if (response.response?.status !== HttpStatus.OK) {
        this.logger.error(
          response.response?.message || 'Token refresh failed',
          {
            file: AuthService.name,
            function: this.refreshToken.name,
            refreshTokenDto: refreshTokenDto,
            version: version,
          },
        );
        return {
          response: {
            status: HttpStatus.UNAUTHORIZED,
            message: response.response?.message || 'Token refresh failed',
          },
        };
      }

      return {
        data: {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token,
          expires_in: response.data.expires_in,
          token_type: response.data.token_type,
        },
        response: {
          status: HttpStatus.OK,
          message: 'Token refresh successful',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: this.refreshToken.name,
        refreshTokenDto: refreshTokenDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during token refresh',
        },
      };
    }
  }

  async validateToken(validateTokenDto: any, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'validateToken',
        validateTokenDto: validateTokenDto,
        version: version,
      },
      AuthService.name,
    );

    try {
      const payload = await this.jwtService.verify(validateTokenDto);
      return {
        data: payload,
        response: { status: HttpStatus.OK, message: 'Verify token successful' },
      };
    } catch (error: any) {
      return {
        response: { status: HttpStatus.UNAUTHORIZED, message: error.message },
      };
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'forgotPassword',
        forgotPasswordDto: forgotPasswordDto,
        version: version,
      },
      AuthService.name,
    );

    try {
      // Find user by email
      const user = await this.prismaSystem.tb_user.findFirst({
        where: { email: forgotPasswordDto.email },
      });

      if (!user) {
        return {
          response: {
            status: HttpStatus.NOT_FOUND,
            message: 'User not found',
          },
        };
      }

      // Generate reset token with expiration
      const RESET_PASSWORD_LIMIT_HOURS =
        Number(process.env.RESET_PASSWORD_LIMIT_HOURS) || 1;
      const expired_at = addHours(new Date(), RESET_PASSWORD_LIMIT_HOURS);

      const payload = {
        type: 'reset_password',
        user_id: user.id,
        email: forgotPasswordDto.email,
        exp: Math.floor(expired_at.getTime() / 1000),
      };

      const jwtToken = this.jwtService.sign(payload);

      // Generate unique short URL token
      let duplicateCheck = true;
      let resetCode: string;
      while (duplicateCheck) {
        resetCode = Math.random().toString(36).substring(2, 8);
        const existingToken = await this.prismaSystem.tb_shot_url.findFirst({
          where: { url_token: resetCode },
        });

        if (!existingToken) {
          duplicateCheck = false;
        }
      }

      // Store reset token in database
      const resetRecord = await this.prismaSystem.tb_shot_url.create({
        data: {
          app_method: 'forgot_password',
          receiver_email: forgotPasswordDto.email,
          url_token: resetCode,
          token: jwtToken,
          expired_at,
        },
      });

      // Send reset password email
      const resetUrl = `${process.env.RESET_PASSWORD_BASE_URL}?token=${resetRecord.url_token}`;
      this.sendPasswordResetEmail(
        forgotPasswordDto.email,
        resetUrl,
        resetRecord.url_token,
      );

      this.logger.log({
        file: AuthService.name,
        function: this.forgotPassword.name,
        message: 'Password reset email sent',
        email: forgotPasswordDto.email,
        version: version,
      });

      return {
        response: {
          status: HttpStatus.OK,
          message: 'Password reset email sent successfully',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: this.forgotPassword.name,
        forgotPasswordDto: forgotPasswordDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during forgot password',
        },
      };
    }
  }

  /**
   * Reset user password using Keycloak via TCP service
   * This hides Keycloak from the end user - the system resets the password on their behalf
   */
  async resetPassword(
    email: string,
    newPassword: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'resetPassword',
        email: email,
        version: version,
      },
      AuthService.name,
    );

    try {
      // Find user by email in Keycloak via TCP service
      const getUserResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.getByEmail', service: 'keycloak' },
          { email },
        ),
      );

      if (
        getUserResponse.response?.status !== HttpStatus.OK ||
        !getUserResponse.data
      ) {
        return {
          response: {
            status: HttpStatus.NOT_FOUND,
            message: 'User not found',
          },
        };
      }

      const keycloakUserId = getUserResponse.data.id;

      // Reset user password via TCP service
      const resetResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.resetPassword', service: 'keycloak' },
          { userId: keycloakUserId, password: newPassword, temporary: false },
        ),
      );

      this.logger.log({
        file: AuthService.name,
        function: this.resetPassword.name,
        email: email,
        version: version,
        keycloakResponse: resetResponse.response?.status,
      });

      if (resetResponse.response?.status !== HttpStatus.OK) {
        this.logger.error(
          resetResponse.response?.message || 'Failed to reset password',
          {
            file: AuthService.name,
            function: this.resetPassword.name,
            email: email,
            version: version,
          },
        );
        return {
          response: {
            status: HttpStatus.BAD_REQUEST,
            message:
              resetResponse.response?.message || 'Failed to reset password',
          },
        };
      }

      return {
        response: {
          status: HttpStatus.OK,
          message: 'Password reset successful',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: this.resetPassword.name,
        email: email,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during password reset',
        },
      };
    }
  }

  /**
   * Reset password using token from forgot password email
   */
  async resetPasswordWithToken(
    resetPasswordWithTokenDto: ResetPasswordWithTokenDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'resetPasswordWithToken',
        token: resetPasswordWithTokenDto.token,
        version: version,
      },
      AuthService.name,
    );

    try {
      // Find the reset token record
      const resetRecord = await this.prismaSystem.tb_shot_url.findFirst({
        where: {
          url_token: resetPasswordWithTokenDto.token,
          app_method: 'forgot_password',
          deleted_at: null,
          expired_at: { gt: new Date() },
        },
      });

      if (!resetRecord) {
        return {
          response: {
            status: HttpStatus.BAD_REQUEST,
            message: 'Invalid or expired reset token',
          },
        };
      }

      // Verify JWT token
      let payload: any;
      try {
        payload = this.jwtService.verify(resetRecord.token);
      } catch (jwtError) {
        return {
          response: {
            status: HttpStatus.BAD_REQUEST,
            message: 'Invalid or expired reset token',
          },
        };
      }

      if (payload.type !== 'reset_password') {
        return {
          response: {
            status: HttpStatus.BAD_REQUEST,
            message: 'Invalid token type',
          },
        };
      }

      // Find user by email from the token
      const email = resetRecord.receiver_email;

      // Reset password in Keycloak
      const getUserResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.getByEmail', service: 'keycloak' },
          { email },
        ),
      );

      if (!getUserResponse.success || !getUserResponse.data) {
        return {
          response: {
            status: HttpStatus.NOT_FOUND,
            message: 'User not found',
          },
        };
      }

      const keycloakUserId = getUserResponse.data.id;

      // Reset user password via TCP service
      const resetResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.resetPassword', service: 'keycloak' },
          {
            userId: keycloakUserId,
            password: resetPasswordWithTokenDto.new_password,
            temporary: false,
          },
        ),
      );

      if (!resetResponse.success) {
        this.logger.error(resetResponse.error || 'Failed to reset password', {
          file: AuthService.name,
          function: 'resetPasswordWithToken',
          email: email,
          version: version,
        });
        return {
          response: {
            status: HttpStatus.BAD_REQUEST,
            message: resetResponse.error || 'Failed to reset password',
          },
        };
      }

      // Mark the reset token as used (soft delete)
      await this.prismaSystem.tb_shot_url.update({
        where: { id: resetRecord.id },
        data: { deleted_at: new Date() },
      });

      this.logger.log({
        file: AuthService.name,
        function: 'resetPasswordWithToken',
        message: 'Password reset successful',
        email: email,
        version: version,
      });

      return {
        response: {
          status: HttpStatus.OK,
          message: 'Password reset successful',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: 'resetPasswordWithToken',
        token: resetPasswordWithTokenDto.token,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during password reset',
        },
      };
    }
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'changePassword',
        changePasswordDto: changePasswordDto,
        version: version,
      },
      AuthService.name,
    );

    try {
      // Reset user password via TCP service
      const resetResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.resetPassword', service: 'keycloak' },
          {
            userId: changePasswordDto.user_id,
            password: changePasswordDto.new_password,
            temporary: false,
          },
        ),
      );

      this.logger.log({
        file: AuthService.name,
        function: this.resetPassword.name,
        version: version,
        keycloakResponse: resetResponse.success,
      });

      if (!resetResponse.success) {
        this.logger.error(resetResponse.error || 'Failed to reset password', {
          file: AuthService.name,
          function: this.resetPassword.name,
          version: version,
        });
        return {
          response: {
            status: HttpStatus.BAD_REQUEST,
            message: resetResponse.error || 'Failed to reset password',
          },
        };
      }

      return {
        response: {
          status: HttpStatus.OK,
          message: 'Password reset successful',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: this.resetPassword.name,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during password reset',
        },
      };
    }
  }

  async changeEmail(changeEmailDto: any, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'changeEmail',
        changeEmailDto: changeEmailDto,
        version: version,
      },
      AuthService.name,
    );

    // todo: implement change email with keycloak

    const { data, error } = {
      data: null,
      error: { message: 'Not implemented' },
    };

    // const { data, error } = await this.supabase.auth.updateUser({
    //   email: changeEmailDto.email,
    // });

    this.logger.log({
      file: AuthService.name,
      function: this.changeEmail.name,
      changeEmailDto: changeEmailDto,
      version: version,
    });

    if (error) {
      return {
        response: { status: HttpStatus.BAD_REQUEST, message: error.message },
      };
    }

    return {
      data: data,
      response: { status: HttpStatus.OK, message: 'Change email successful' },
    };
  }

  async getNameById(id: string): Promise<any> {
    const user = await this.prismaSystem.tb_user.findFirst({
      where: {
        id: id,
      },
      select: {
        username: true,
        id: true,
      },
    });

    const userProfile = await this.prismaSystem.tb_user_profile.findFirst({
      where: {
        user_id: user.id,
      },
      select: {
        firstname: true,
        middlename: true,
        lastname: true,
        telephone: true,
      },
    });

    return {
      data: {
        id: user.id,
        username: user.username,
        name: `${userProfile.firstname} ${userProfile.middlename} ${userProfile.lastname}`,
      },
      response: {
        status: HttpStatus.OK,
        message: 'Get user profile successful',
      },
    };
  }

  async getUserProfilesByIds(
    user_ids: string[],
    department?: { id: string; name: string },
  ): Promise<any> {
    this.logger.debug(
      { function: 'getUserProfilesByIds', user_ids },
      AuthService.name,
    );

    if (!user_ids || user_ids.length === 0) {
      return {
        data: [],
        response: {
          status: HttpStatus.OK,
          message: 'No user IDs provided',
        },
      };
    }

    const users = await this.prismaSystem.tb_user.findMany({
      where: {
        id: { in: user_ids },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const userProfiles = await this.prismaSystem.tb_user_profile.findMany({
      where: {
        user_id: { in: user_ids },
      },
      select: {
        user_id: true,
        firstname: true,
        middlename: true,
        lastname: true,
      },
    });

    const profileMap = new Map(userProfiles.map((p) => [p.user_id, p]));

    const result = users.map((user) => {
      const profile = profileMap.get(user.id);
      const firstname = profile?.firstname || '';
      const lastname = profile?.lastname || '';
      const initials =
        `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();

      return {
        user_id: user.id,
        email: user.email,
        firstname: profile?.firstname || '',
        middlename: profile?.middlename || '',
        lastname: profile?.lastname || '',
        initials,
        department: department || null,
      };
    });

    return {
      data: result,
      response: {
        status: HttpStatus.OK,
        message: 'Get user profiles successful',
      },
    };
  }

  async getByTenant(tenant_id: string, version: string): Promise<any> {
    this.logger.debug(
      { function: 'getByTenant', tenant_id: tenant_id, version: version },
      AuthService.name,
    );

    const tenant = await this.prismaSystem.tb_user_tb_business_unit
      .findMany({
        where: {
          business_unit_id: tenant_id,
        },
        select: {
          user_id: true,
        },
      })
      .then(async (res) => {
        const userInfo = await this.prismaSystem.tb_user_profile.findMany({
          where: {
            user_id: {
              in: res.map((item) => item.user_id),
            },
          },
          select: {
            user_id: true,
            firstname: true,
            middlename: true,
            lastname: true,
            telephone: true,
          },
        });

        return userInfo.map((item) => {
          return {
            id: item.user_id,
            name: `${item.firstname} ${item.middlename} ${item.lastname}`,
          };
        });
      });

    return {
      data: tenant,
      response: {
        status: HttpStatus.OK,
        message: 'Get tenant successful',
      },
    };
  }

  async getUserProfile(id: string, version: string): Promise<any> {
    this.logger.debug(
      { function: 'getUserProfile', id: id, version: version },
      AuthService.name,
    );

    const user = await this.prismaSystem.tb_user.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        email: true,
      },
    });

    const userInfo = await this.prismaSystem.tb_user_profile.findFirst({
      where: {
        user_id: id,
      },
      select: {
        firstname: true,
        middlename: true,
        lastname: true,
        telephone: true,
      },
    });

    const userBusinessUnit = await this.prismaSystem.tb_user_tb_business_unit
      .findMany({
        where: {
          user_id: id,
          is_active: true,
        },
        select: {
          is_default: true,
          tb_business_unit: {
            select: {
              id: true,
              name: true,
              code: true,
              alias_name: true,
            },
          },
        },
      })
      .then(async (res) => {
        const data = [];

        for (const item of res) {
          const user_department = await this.tenantService.getUserDepartment(
            id,
            item.tb_business_unit.id,
          );

          const businessUnitConfig =
            await this.tenantService.getSystemBusinessUnitConfig(
              id,
              item.tb_business_unit.id,
            );

          data.push({
            id: item.tb_business_unit.id,
            name: item.tb_business_unit.name,
            code: item.tb_business_unit.code,
            alias_name: item.tb_business_unit.alias_name,
            is_default: item.is_default,
            department: user_department,
            config: businessUnitConfig.data,
          });
        }

        return data;
      });

    return {
      data: {
        id: user.id,
        email: user.email,
        user_info: userInfo,
        business_unit: userBusinessUnit,
      },
      response: {
        status: HttpStatus.OK,
        message: 'Get user profile successful',
      },
    };
  }

  async getAllUserInTenant(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getAllUserInTenant',
        user_id: user_id,
        bu_code: bu_code,
        version: version,
      },
      AuthService.name,
    );

    const tenant = await this.tenantService.getdbConnectionByCode(
      user_id,
      bu_code,
    );

    if (!tenant) {
      return {
        response: {
          status: HttpStatus.NO_CONTENT,
          message: 'Tenant not found',
        },
      };
    }

    const prismaTenant = await this.prismaTenant(
      tenant.tenant_id,
      tenant.db_connection,
    );

    const user = await this.prismaSystem.tb_user_tb_business_unit
      .findMany({
        where: {
          tb_business_unit: {
            code: bu_code,
          },
        },
        select: {
          user_id: true,
          tb_user_tb_user_tb_business_unit_user_idTotb_user: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      })
      .then(async (res) => {
        const user_current = res.map((item) => {
          return {
            user_id: item.user_id,
            email: item.tb_user_tb_user_tb_business_unit_user_idTotb_user.email,
          };
        });

        const userInfo = await this.prismaSystem.tb_user_profile.findMany({
          where: {
            user_id: {
              in: user_current.map((item) => item.user_id),
            },
          },
          select: {
            user_id: true,
            firstname: true,
            middlename: true,
            lastname: true,
            telephone: true,
          },
        });

        const departmentUsers = await prismaTenant.tb_department_user.findMany({
          where: {
            user_id: {
              in: user_current.map((item) => item.user_id),
            },
            is_hod: false,
          },
          select: {
            user_id: true,
            department_id: true,
            tb_department: {
              select: {
                name: true,
              },
            },
            is_hod: true,
          },
        });

        const departmentHODUsers = await prismaTenant.tb_department_user
          .findMany({
            where: {
              user_id: {
                in: user_current.map((item) => item.user_id),
              },
              is_hod: true,
            },
            select: {
              user_id: true,
              department_id: true,
              tb_department: {
                select: {
                  name: true,
                },
              },
              is_hod: true,
            },
          })
          .then((res) => {
            return res.map((item) => {
              return {
                user_id: item.user_id,
                department_id: item.department_id,
                department_name: item.tb_department.name,
                is_hod: item.is_hod,
              };
            });
          });

        // this.logger.debug(
        //   {
        //     function: 'getAllUserInTenant - departmentHODUsers',
        //     departmentHODUsers: departmentHODUsers,
        //   },
        //   AuthService.name,
        // );

        return userInfo.map((item) => {
          const d = departmentUsers.find(
            (user) => user.user_id === item.user_id,
          );

          const dh = departmentHODUsers.filter(
            (user) => user.user_id === item.user_id,
          ).map((dept) => {
            return {
              id: dept.department_id,
              name: dept.department_name,
            };
          });

          return {
            user_id: user_current.find((user) => user.user_id === item.user_id)
              ?.user_id,
            email: user_current.find((user) => user.user_id === item.user_id)
              ?.email,
            department: {
              id: d?.department_id,
              name: d?.tb_department?.name,
            },
            hod_department: dh,
            firstname: item.firstname,
            middlename: item.middlename,
            lastname: item.lastname,
          };
        });
      });

    return {
      data: user,
      paginate: {
        total: user.length,
        page: 1,
        limit: user.length,
      },
      response: {
        status: HttpStatus.OK,
        message: 'Get all user in tenant successful',
      },
    };
  }

  async getAllUsers(version: string): Promise<any> {
    this.logger.debug(
      { function: 'getAllUsers', version: version },
      AuthService.name,
    );

    const users = await this.prismaSystem.tb_user.findMany({
      select: {
        id: true,
        email: true,
        platform_role: true,
        is_active: true,
      },
    });

    const data = users.map((item) => {
      return {
        id: item.id,
        email: item.email,
        platform_role: item.platform_role,
        is_active: item.is_active,
      };
    });

    return {
      data: data,
      paginate: {
        total: data.length,
        page: 1,
        limit: data.length,
      },
      response: {
        status: HttpStatus.OK,
        message: 'Get all users successful',
      },
    };
  }

  onPushNotification(token: string, url: string): void {
    // TODO: implement push notification to user via email or other methods
  }

  /**
   * Send password reset email to user
   */
  private async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
    resetCode: string,
  ): Promise<void> {
    try {
      // Check if email service is configured
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || 'noreply@carmen.com';

      if (!smtpHost || !smtpUser || !smtpPass) {
        this.logger.warn('SMTP configuration not found. Email not sent.', {
          file: AuthService.name,
          function: 'sendPasswordResetEmail',
          email,
        });
        return;
      }

      // Dynamic import of nodemailer to avoid issues if not installed
      const nodemailer = await import('nodemailer');

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const mailOptions = {
        from: smtpFrom,
        to: email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password. Click the button below to proceed:</p>
            <p style="margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #4CAF50; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p>Or use this code: <strong>${resetCode}</strong></p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <p>This link will expire in ${process.env.RESET_PASSWORD_LIMIT_HOURS || 1} hour(s).</p>
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
        text: `
          Password Reset Request

          You have requested to reset your password.

          Click the following link to reset your password: ${resetUrl}

          Or use this code: ${resetCode}

          If you did not request this password reset, please ignore this email.

          This link will expire in ${process.env.RESET_PASSWORD_LIMIT_HOURS || 1} hour(s).
        `,
      };

      await transporter.sendMail(mailOptions);

      this.logger.log({
        file: AuthService.name,
        function: 'sendPasswordResetEmail',
        message: 'Password reset email sent successfully',
        email,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to send password reset email: ${error.message}`,
        {
          file: AuthService.name,
          function: 'sendPasswordResetEmail',
          email,
        },
      );
      // Don't throw - we don't want to fail the forgot password flow if email fails
    }
  }

  async updateUserProfile(
    userId: string,
    updateData: {
      firstname?: string;
      middlename?: string;
      lastname?: string;
      telephone?: string;
    },
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'updateUserProfile',
        userId,
        updateData,
        version,
      },
      AuthService.name,
    );

    try {
      // Check if user exists
      const existingUser = await this.prismaSystem.tb_user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        return {
          response: {
            status: HttpStatus.NOT_FOUND,
            message: 'User not found',
          },
        };
      }

      // Update Keycloak user (firstName, lastName, and custom attributes)
      const keycloakUpdateData: {
        firstName?: string;
        lastName?: string;
        attributes?: Record<string, string[]>;
      } = {};

      if (updateData.firstname) {
        keycloakUpdateData.firstName = updateData.firstname;
      }
      if (updateData.lastname) {
        keycloakUpdateData.lastName = updateData.lastname;
      }

      // Add middleName and telephone as custom attributes
      if (updateData.middlename || updateData.telephone) {
        keycloakUpdateData.attributes = {};
        if (updateData.middlename) {
          keycloakUpdateData.attributes.middleName = [updateData.middlename];
        }
        if (updateData.telephone) {
          keycloakUpdateData.attributes.telephone = [updateData.telephone];
        }
      }

      if (Object.keys(keycloakUpdateData).length > 0) {
        const keycloakResponse = await firstValueFrom(
          this.keycloakService.send(
            { cmd: 'keycloak.users.update', service: 'keycloak' },
            { userId, data: keycloakUpdateData },
          ),
        );

        if (keycloakResponse.response?.status !== HttpStatus.OK) {
          this.logger.error(
            keycloakResponse.response?.message ||
              'Failed to update Keycloak user',
            {
              file: AuthService.name,
              function: 'updateUserProfile',
              userId,
            },
          );
          return {
            response: {
              status: HttpStatus.BAD_REQUEST,
              message:
                keycloakResponse.response?.message ||
                'Failed to update user in identity provider',
            },
          };
        }
      }

      // Update database user profile
      const existingProfile = await this.prismaSystem.tb_user_profile.findFirst(
        {
          where: { user_id: userId },
        },
      );

      if (!existingProfile) {
        return {
          response: {
            status: HttpStatus.NOT_FOUND,
            message: 'User profile not found',
          },
        };
      }

      const updatedProfile = await this.prismaSystem.tb_user_profile.update({
        where: { id: existingProfile.id },
        data: updateData,
      });

      this.logger.log({
        file: AuthService.name,
        function: 'updateUserProfile',
        userId,
        message: 'User profile updated successfully',
      });

      return {
        data: {
          user_id: userId,
          firstname: updatedProfile.firstname,
          middlename: updatedProfile.middlename,
          lastname: updatedProfile.lastname,
          telephone: updatedProfile.telephone,
        },
        response: {
          status: HttpStatus.OK,
          message: 'User profile updated successfully',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: 'updateUserProfile',
        userId,
        version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.message || 'An error occurred while updating user profile',
        },
      };
    }
  }

  async getBus(
    userId: string,
    is_active: boolean = true,
    version: string,
  ): Promise<any> {
    this.logger.debug({
      function: 'getBus',
      userId,
      version,
    });

    try {
      const bus = await this.prismaSystem.tb_user_tb_business_unit.findMany({
        where: { user_id: userId, is_active: is_active },
        select: {
          user_id: true,
          business_unit_id: true,
          is_active: true,
          is_default: true,
          role: true,
          tb_business_unit: {
            select: {
              code: true,
              name: true,
              alias_name: true,
            },
          },
        },
        distinct: ['business_unit_id'],
      });

      this.logger.debug({
        function: 'getBus',
        userId,
        version,
        bus,
      });

      if (bus.length === 0) {
        return {
          data: [],
          response: {
            status: HttpStatus.NOT_FOUND,
            message: 'Business unit not found',
          },
        };
      }

      return {
        data: bus,
        response: {
          status: HttpStatus.OK,
          message: 'Business unit retrieved successfully',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: 'getBus',
        userId,
        version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.message || 'An error occurred while retrieving business unit',
        },
      };
    }
  }

  async getRoles(
    userId: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'getRoles',
        userId,
        bu_code,
        version,
      },
      AuthService.name,
    );
    try {
      const roles =
        await this.prismaSystem.tb_user_tb_application_role.findMany({
          where: { user_id: userId },
        });
      return {
        data: roles,
        response: {
          status: HttpStatus.OK,
          message: 'Roles retrieved successfully',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: 'getRoles',
        userId,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred while retrieving roles',
        },
      };
    }
  }

  async getPermissions(userId: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'getPermissions',
        userId,
        version,
      },
      AuthService.name,
    );
    try {
      // get bus from users
      const bus = await this.getBus(userId, true, version);
      const bu_codes = bus.data.map((bus) => bus.tb_business_unit);

      this.logger.debug(
        {
          function: 'getPermissions',
          userId,
          version,
          bu_codes,
        },
        AuthService.name,
      );

      // loop each bu_codes
      let permissionsAllBu = [];

      for (const bu_code of bu_codes) {
        let permissionsBu = {
          code: bu_code.code,
          name: bu_code.name,
          alias_name: bu_code.alias_name,
          permissions: [],
        };

        // get all roles of user
        const roles = await this.getRoles(userId, bu_code, version);
        this.logger.debug(
          {
            function: 'getPermissions',
            userId,
            version,
            bu_code,
            roles,
          },
          AuthService.name,
        );

        // get all permissions of user
        const permissions =
          await this.prismaSystem.tb_application_role_tb_permission.findMany({
            where: {
              application_role_id: {
                in: roles.data.map((role) => role.application_role_id),
              },
            },
          });

        this.logger.debug(
          {
            function: 'getPermissions',
            userId,
            version,
            bu_code,
            permissions,
          },
          AuthService.name,
        );

        const permissionIds = permissions.map(
          (permission) => permission.permission_id,
        );
        const permissionItems = await this.prismaSystem.tb_permission.findMany({
          where: {
            id: {
              in: permissionIds,
            },
          },
        });

        const permissionItemsOfBU = permissionItems.map(
          (permission) => permission.resource + '.' + permission.action,
        );

        permissionsBu.permissions = permissionItemsOfBU;

        permissionsAllBu.push(permissionsBu);
      }

      return {
        data: permissionsAllBu,
        response: {
          status: HttpStatus.OK,
          message: 'Permissions retrieved successfully',
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: 'getPermissions',
        userId,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.message || 'An error occurred while retrieving permissions',
        },
      };
    }
  }

  /**
   * Sync users from Keycloak realm to tb_user and tb_user_profile
   * Fetches all users from Keycloak and creates/updates records in the database
   */
  async syncRealmUsers(version: string): Promise<any> {
    this.logger.debug(
      { function: 'syncRealmUsers', version },
      AuthService.name,
    );

    try {
      // Fetch all users from Keycloak realm
      const keycloakResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.users.getAll', service: 'keycloak' },
          {},
        ),
      );

      if (keycloakResponse.response?.status !== HttpStatus.OK) {
        this.logger.error('Failed to fetch users from Keycloak', {
          file: AuthService.name,
          function: 'syncRealmUsers',
          keycloakResponse,
        });
        return {
          response: {
            status: HttpStatus.BAD_REQUEST,
            message:
              keycloakResponse.response?.message ||
              'Failed to fetch users from Keycloak',
          },
        };
      }

      const keycloakUsers = keycloakResponse.data || [];

      this.logger.log({
        file: AuthService.name,
        function: 'syncRealmUsers',
        message: `Found ${keycloakUsers.length} users in Keycloak realm`,
      });

      let created = 0;
      let updated = 0;
      let skipped = 0;
      const errors: Array<{ userId: string; email: string; error: string }> =
        [];

      for (const keycloakUser of keycloakUsers) {
        try {
          // Skip users without email (service accounts, etc.)
          if (!keycloakUser.email) {
            skipped++;
            continue;
          }

          // Check if user already exists in tb_user by Keycloak ID
          const existingUserById = await this.prismaSystem.tb_user.findUnique({
            where: { id: keycloakUser.id },
          });

          // Check if email exists with a different ID
          const existingUserByEmail = await this.prismaSystem.tb_user.findFirst(
            {
              where: { email: keycloakUser.email },
            },
          );

          // If email exists but with different ID, skip this record to avoid conflicts
          if (
            existingUserByEmail &&
            existingUserByEmail.id !== keycloakUser.id
          ) {
            this.logger.warn(
              `Skipping user: email ${keycloakUser.email} already exists with different ID`,
              {
                file: AuthService.name,
                function: 'syncRealmUsers',
                keycloakUserId: keycloakUser.id,
                existingUserId: existingUserByEmail.id,
              },
            );
            skipped++;
            continue;
          }

          if (existingUserById) {
            // Update existing user
            await this.prismaSystem.tb_user.update({
              where: { id: keycloakUser.id },
              data: {
                username: keycloakUser.username,
                email: keycloakUser.email,
                is_active: keycloakUser.enabled ?? true,
              },
            });

            // Update user profile if exists
            const existingProfile =
              await this.prismaSystem.tb_user_profile.findFirst({
                where: { user_id: keycloakUser.id },
              });

            if (existingProfile) {
              await this.prismaSystem.tb_user_profile.update({
                where: { id: existingProfile.id },
                data: {
                  firstname:
                    keycloakUser.firstName ?? existingProfile.firstname,
                  lastname: keycloakUser.lastName ?? existingProfile.lastname,
                },
              });
            } else {
              // Create profile if it doesn't exist
              await this.prismaSystem.tb_user_profile.create({
                data: {
                  user_id: keycloakUser.id,
                  firstname: keycloakUser.firstName ?? '',
                  lastname: keycloakUser.lastName ?? '',
                  bio: {},
                },
              });
            }

            updated++;
          } else {
            // Create new user and profile
            await this.prismaSystem.$transaction(async (prisma) => {
              await prisma.tb_user.create({
                data: {
                  id: keycloakUser.id,
                  username: keycloakUser.username,
                  email: keycloakUser.email,
                  platform_role: 'user',
                  is_active: keycloakUser.enabled ?? true,
                },
              });

              await prisma.tb_user_profile.create({
                data: {
                  user_id: keycloakUser.id,
                  firstname: keycloakUser.firstName ?? '',
                  lastname: keycloakUser.lastName ?? '',
                  bio: {},
                },
              });
            });

            created++;
          }
        } catch (userError: any) {
          errors.push({
            userId: keycloakUser.id,
            email: keycloakUser.email,
            error: userError.message,
          });
          this.logger.error(`Failed to sync user: ${keycloakUser.email}`, {
            file: AuthService.name,
            function: 'syncRealmUsers',
            userId: keycloakUser.id,
            error: userError.message,
          });
        }
      }

      this.logger.log({
        file: AuthService.name,
        function: 'syncRealmUsers',
        message: 'Sync completed',
        created,
        updated,
        skipped,
        errors: errors.length,
      });

      return {
        data: {
          total: keycloakUsers.length,
          created,
          updated,
          skipped,
          errors: errors.length > 0 ? errors : undefined,
        },
        response: {
          status: HttpStatus.OK,
          message: `Sync completed: ${created} created, ${updated} updated, ${skipped} skipped${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
        },
      };
    } catch (error: any) {
      this.logger.error(error.message, {
        file: AuthService.name,
        function: 'syncRealmUsers',
        version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred during user sync',
        },
      };
    }
  }
}
