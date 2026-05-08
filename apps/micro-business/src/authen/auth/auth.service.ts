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
import { PrismaClient_TENANT, Prisma } from '@repo/prisma-shared-schema-tenant';
import { TenantService } from '@/tenant/tenant.service';
import { addHours } from 'date-fns';
import { ChangePasswordDto } from './dto/changepassword';
import { LoginRateLimitService } from './login-rate-limit.service';

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
    private readonly loginRateLimit: LoginRateLimitService,
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
          meta_data: (metadata || {}) as Prisma.InputJsonValue,
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
    } catch (error: unknown) {
      // Don't fail the auth operation if logging fails
      this.logger.error(`Failed to log ${action} activity: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        file: AuthService.name,
        function: 'logAuthActivity',
        userId,
      });
    }
  }

  /**
   * Authenticate user via Keycloak and generate JWT tokens
   * ยืนยันตัวตนผู้ใช้ผ่าน Keycloak และสร้าง JWT token
   * @param loginDto - Login credentials / ข้อมูลการเข้าสู่ระบบ
   * @param version - API version / เวอร์ชัน API
   * @returns Authentication tokens and user info / โทเค็นยืนยันตัวตนและข้อมูลผู้ใช้
   */
  async login(loginDto: LoginDto, version: string, ip: string): Promise<any> {
    this.logger.debug(
      { function: 'login', loginDto: loginDto, version: version, ip },
      AuthService.name,
    );

    try {
      // Resolve login identifier: support both email and username
      const loginIdentifier = (loginDto.email || loginDto.username || '').toLowerCase();

      // Block early if this (email + IP) is currently locked out
      const lockState = this.loginRateLimit.checkLock(loginIdentifier, ip);
      if (lockState.locked) {
        this.logger.warn(
          {
            file: AuthService.name,
            function: this.login.name,
            loginIdentifier,
            ip,
            retryAfterSeconds: lockState.retryAfterSeconds,
          },
          'Login blocked: rate limit active',
        );
        return {
          response: {
            status: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many failed login attempts. Try again in ${lockState.retryAfterSeconds}s.`,
            retry_after: lockState.retryAfterSeconds,
          },
        };
      }

      // Call Keycloak via TCP service
      const response = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.auth.login', service: 'keycloak' },
          { email: loginIdentifier, password: loginDto.password },
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
        const failure = this.loginRateLimit.recordFailure(loginIdentifier, ip);
        if (failure.triggeredLock) {
          return {
            response: {
              status: HttpStatus.TOO_MANY_REQUESTS,
              message: `Too many failed login attempts. Try again in ${failure.retryAfterSeconds}s.`,
              retry_after: failure.retryAfterSeconds,
            },
          };
        }
        return {
          response: {
            status: HttpStatus.UNAUTHORIZED,
            message: response.response?.message || 'Authentication failed',
          },
        };
      }

      const user = await this.prismaSystem.tb_user.findFirst({
        where: {
          OR: [
            { email: loginIdentifier },
            { username: loginIdentifier },
          ],
        },
        select: { id: true, email: true, platform_role: true },
      });

      if (!user) {
        this.logger.error('User not found', {
          file: AuthService.name,
          function: this.login.name,
          loginDto: loginDto,
          version: version,
        });
        const failure = this.loginRateLimit.recordFailure(loginIdentifier, ip);
        if (failure.triggeredLock) {
          return {
            response: {
              status: HttpStatus.TOO_MANY_REQUESTS,
              message: `Too many failed login attempts. Try again in ${failure.retryAfterSeconds}s.`,
              retry_after: failure.retryAfterSeconds,
            },
          };
        }
        return {
          response: {
            status: HttpStatus.UNAUTHORIZED,
            message: 'User not found',
          },
        };
      }

      // Successful authentication — clear any stale failure counter
      this.loginRateLimit.recordSuccess(loginIdentifier, ip);

      // Log successful login activity
      try {
        if (user?.id) {
          await this.logAuthActivity('login', user.id, user.email, {
            login_time: new Date().toISOString(),
          });
        }
      } catch (logError) {
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
          platform_role: user?.platform_role,
        },
        response: { status: HttpStatus.OK, message: 'Login successful' },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: this.login.name,
        loginDto: loginDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Log out user and invalidate tokens via Keycloak
   * ออกจากระบบและยกเลิกโทเค็นผ่าน Keycloak
   * @param logoutDto - Logout data including refresh token / ข้อมูลการออกจากระบบรวมถึง refresh token
   * @param version - API version / เวอร์ชัน API
   * @returns Logout result / ผลลัพธ์การออกจากระบบ
   */
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
      // Call Keycloak via TCP service using refresh token (OIDC logout)
      const response = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.auth.logout', service: 'keycloak' },
          { refresh_token: logoutDto.refresh_token },
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during logout';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: this.logout.name,
        logoutDto: logoutDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Invite a new user to the system via email
   * เชิญผู้ใช้ใหม่เข้าสู่ระบบผ่านอีเมล
   * @param inviteUserDto - Invitation details / ข้อมูลการเชิญผู้ใช้
   * @param user_id - Inviting user ID / ID ผู้ใช้ที่เชิญ
   * @param version - API version / เวอร์ชัน API
   * @returns Invitation result / ผลลัพธ์การเชิญผู้ใช้
   */
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

  /**
   * Register a new user account in Keycloak and the system database
   * ลงทะเบียนบัญชีผู้ใช้ใหม่ใน Keycloak และฐานข้อมูลระบบ
   * @param registerDto - Registration data / ข้อมูลการลงทะเบียน
   * @param version - API version / เวอร์ชัน API
   * @returns Registration result / ผลลัพธ์การลงทะเบียน
   */
  async register(registerDto: IRegister, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'register',
        registerDto: registerDto,
        version: version,
      },
      AuthService.name,
    );

    const normalizedUsername = registerDto.username.toLowerCase();
    const normalizedEmail = registerDto.email.toLowerCase();

    const findUsername = await this.prismaSystem.tb_user.findFirst({
      where: { username: normalizedUsername },
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
      where: { email: normalizedEmail },
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
        username: normalizedUsername,
        email: normalizedEmail,
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
          { email: normalizedEmail },
        ),
      );

      if (
        getUserResponse.response?.status !== HttpStatus.OK ||
        !getUserResponse.data
      ) {
        this.logger.error('Failed to find newly created user in Keycloak', {
          file: AuthService.name,
          function: 'register',
          email: normalizedEmail,
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
            username: normalizedUsername,
            email: normalizedEmail,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: 'register failed',
        registerDto: registerDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Confirm user registration and activate the account
   * ยืนยันการลงทะเบียนและเปิดใช้งานบัญชีผู้ใช้
   * @param registerConfirmDto - Registration confirmation data / ข้อมูลยืนยันการลงทะเบียน
   * @param version - API version / เวอร์ชัน API
   * @returns Confirmation result / ผลลัพธ์การยืนยัน
   */
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

    const normalizedUsername = registerConfirmDto.username.toLowerCase();
    const normalizedEmail = registerConfirmDto.email.toLowerCase();

    const findUsername = await this.prismaSystem.tb_user.findFirst({
      where: { username: normalizedUsername },
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
      where: { email: normalizedEmail },
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
        username: normalizedUsername,
        email: normalizedEmail,
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
          { email: normalizedEmail },
        ),
      );

      if (
        getUserResponse.response?.status !== HttpStatus.OK ||
        !getUserResponse.data
      ) {
        this.logger.error('Failed to find newly created user in Keycloak', {
          file: AuthService.name,
          function: 'registerConfirm',
          email: normalizedEmail,
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
            username: normalizedUsername,
            email: normalizedEmail,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration confirmation';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: 'registerConfirm failed',
        registerConfirmDto: registerConfirmDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Refresh authentication tokens using a refresh token
   * รีเฟรชโทเค็นยืนยันตัวตนโดยใช้ refresh token
   * @param refreshTokenDto - Refresh token data / ข้อมูล refresh token
   * @param version - API version / เวอร์ชัน API
   * @returns New authentication tokens / โทเค็นยืนยันตัวตนใหม่
   */
  async refreshToken(refreshTokenDto: Record<string, unknown>, version: string): Promise<any> {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during token refresh';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: this.refreshToken.name,
        refreshTokenDto: refreshTokenDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Validate a JWT token and return decoded user information
   * ตรวจสอบ JWT token และส่งคืนข้อมูลผู้ใช้ที่ถอดรหัสแล้ว
   * @param validateTokenDto - Token string to validate / สตริงโทเค็นที่ต้องตรวจสอบ
   * @param version - API version / เวอร์ชัน API
   * @returns Decoded token payload / ข้อมูลโทเค็นที่ถอดรหัสแล้ว
   */
  async validateToken(validateTokenDto: string, version: string): Promise<any> {
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
    } catch (error: unknown) {
      return {
        response: { status: HttpStatus.UNAUTHORIZED, message: error instanceof Error ? error.message : 'Token validation failed' },
      };
    }
  }

  /**
   * Initiate forgot password flow and send reset email
   * เริ่มขั้นตอนลืมรหัสผ่านและส่งอีเมลรีเซ็ต
   * @param forgotPasswordDto - Forgot password request data / ข้อมูลคำขอลืมรหัสผ่าน
   * @param version - API version / เวอร์ชัน API
   * @returns Forgot password result / ผลลัพธ์การขอลืมรหัสผ่าน
   */
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during forgot password';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: this.forgotPassword.name,
        forgotPasswordDto: forgotPasswordDto,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during password reset';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: this.resetPassword.name,
        email: email,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
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
      let payload: Record<string, unknown>;
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during password reset';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: 'resetPasswordWithToken',
        token: resetPasswordWithTokenDto.token,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Change user password via Keycloak
   * เปลี่ยนรหัสผ่านผู้ใช้ผ่าน Keycloak
   * @param changePasswordDto - Password change data / ข้อมูลการเปลี่ยนรหัสผ่าน
   * @param version - API version / เวอร์ชัน API
   * @returns Password change result / ผลลัพธ์การเปลี่ยนรหัสผ่าน
   */
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
      // Change password via Keycloak Account API (validates current password)
      const changeResponse = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.auth.changePassword', service: 'keycloak' },
          {
            accessToken: changePasswordDto.accessToken,
            currentPassword: changePasswordDto.current_password,
            newPassword: changePasswordDto.new_password,
            user_id: changePasswordDto.user_id,
          },
        ),
      );

      this.logger.log({
        file: AuthService.name,
        function: this.changePassword.name,
        version: version,
        keycloakResponse: changeResponse,
      });

      if (changeResponse.response?.status !== HttpStatus.OK) {
        return {
          response: {
            status: changeResponse.response?.status || HttpStatus.BAD_REQUEST,
            message: changeResponse.response?.message || 'Failed to change password',
          },
        };
      }

      return {
        response: {
          status: HttpStatus.OK,
          message: 'Password changed successfully',
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during password change';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: this.changePassword.name,
        version: version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Change user email address
   * เปลี่ยนที่อยู่อีเมลผู้ใช้
   * @param changeEmailDto - Email change data / ข้อมูลการเปลี่ยนอีเมล
   * @param version - API version / เวอร์ชัน API
   * @returns Email change result / ผลลัพธ์การเปลี่ยนอีเมล
   */
  async changeEmail(changeEmailDto: Record<string, unknown>, version: string): Promise<any> {
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

  /**
   * Get user display name by user ID
   * ดึงชื่อที่แสดงของผู้ใช้ตาม ID
   * @param id - User ID / ID ผู้ใช้
   * @returns User name / ชื่อผู้ใช้
   */
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

  /**
   * Get multiple user profiles by their IDs
   * ดึงโปรไฟล์ผู้ใช้หลายคนตาม ID
   * @param user_ids - Array of user IDs / อาร์เรย์ของ ID ผู้ใช้
   * @param department - Optional department filter / ตัวกรองแผนก (ถ้ามี)
   * @returns List of user profiles / รายการโปรไฟล์ผู้ใช้
   */
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
        alias_name: true,
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
        alias_name: user.alias_name,
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

  /**
   * Get all users belonging to a specific tenant
   * ดึงผู้ใช้ทั้งหมดที่อยู่ในผู้เช่าที่ระบุ
   * @param tenant_id - Tenant ID / ID ผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns List of users in the tenant / รายการผู้ใช้ในผู้เช่า
   */
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

  /**
   * Get detailed user profile including business units and roles
   * ดึงโปรไฟล์ผู้ใช้โดยละเอียดรวมถึงหน่วยธุรกิจและบทบาท
   * @param id - User ID / ID ผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns User profile details / รายละเอียดโปรไฟล์ผู้ใช้
   */
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
        alias_name: true,
        platform_role: true,
      },
    });

    if (!user) {
      return {
        data: null,
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        },
      };
    }

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
          is_active: true,
          role: true,
          tb_business_unit: true,
        },
      })
      .then(async (res) => {
        const data = [];

        for (const item of res) {
          const user_department = await this.tenantService.getUserDepartment(
            id,
            item.tb_business_unit.id,
          );

          const hod_department = await this.tenantService.getUserHodDepartment(
            id,
            item.tb_business_unit.id,
          );

          let default_currency = undefined;
          let current_period = undefined;

          const tenant = await this.tenantService.getdb_connection(
            id,
            item.tb_business_unit.id,
          );

          if (tenant) {
            const prismaTenant = await this.prismaTenant(
              tenant.tenant_id,
              tenant.db_connection,
            );

            if (item.tb_business_unit.default_currency_id) {
              const currency = await prismaTenant.tb_currency.findFirst({
                where: {
                  id: item.tb_business_unit.default_currency_id,
                },
                select: {
                  code: true,
                  name: true,
                  symbol: true,
                  description: true,
                  decimal_places: true,
                },
              });

              default_currency = currency;
            }

            // Fetch current period (open or locked)
            try {
              const period = await prismaTenant.tb_period.findFirst({
                where: {
                  status: { in: ['open', 'locked'] },
                  deleted_at: null,
                },
                orderBy: [{ fiscal_year: 'asc' }, { fiscal_month: 'asc' }],
                select: {
                  id: true,
                  period: true,
                  fiscal_year: true,
                  fiscal_month: true,
                  start_at: true,
                  end_at: true,
                  status: true,
                },
              });
              current_period = period || undefined;
            } catch {
              // Period query failed — skip silently
            }
          }

          data.push({
            id: item.tb_business_unit.id,
            name: item.tb_business_unit.name,
            code: item.tb_business_unit.code,
            alias_name: item.tb_business_unit.alias_name,
            is_default: item.is_default,
            system_level: item.role,
            is_active: item.is_active,
            department: user_department,
            hod_department: hod_department,
            current_period: current_period,
            config: {
              calculation_method: item.tb_business_unit.calculation_method,
              default_currency_id: item.tb_business_unit.default_currency_id,
              default_currency: default_currency,
              hotel: {
                name: item.tb_business_unit.hotel_name,
                tel: item.tb_business_unit.hotel_tel,
                email: item.tb_business_unit.hotel_email,
                address: item.tb_business_unit.hotel_address,
                zip_code: item.tb_business_unit.hotel_zip_code,
              },
              company: {
                name: item.tb_business_unit.company_name,
                tel: item.tb_business_unit.company_tel,
                email: item.tb_business_unit.company_email,
                address: item.tb_business_unit.company_address,
                zip_code: item.tb_business_unit.company_zip_code,
              },
              tax_no: item.tb_business_unit.tax_no,
              branch_no: item.tb_business_unit.branch_no,
              date_format: item.tb_business_unit.date_format,
              time_format: item.tb_business_unit.time_format,
              date_time_format: item.tb_business_unit.date_time_format,
              long_time_format: item.tb_business_unit.long_time_format,
              short_time_format: item.tb_business_unit.short_time_format,
              timezone: item.tb_business_unit.timezone,
              perpage_format: item.tb_business_unit.perpage_format,
              amount_format: item.tb_business_unit.amount_format,
              quantity_format: item.tb_business_unit.quantity_format,
              recipe_format: item.tb_business_unit.recipe_format,
              description: item.tb_business_unit.description,
              info: item.tb_business_unit.info,
              is_hq: item.tb_business_unit.is_hq,
              is_active: item.tb_business_unit.is_active,
            },
          });
        }

        return data;
      });

    return {
      data: {
        id: user.id,
        email: user.email,
        alias_name: user.alias_name,
        platform_role: user.platform_role,
        user_info: userInfo,
        business_unit: userBusinessUnit,
      },
      response: {
        status: HttpStatus.OK,
        message: 'Get user profile successful',
      },
    };
  }

  /**
   * Get all users in a tenant's business unit with pagination
   * ดึงผู้ใช้ทั้งหมดในหน่วยธุรกิจของผู้เช่าพร้อมการแบ่งหน้า
   * @param user_id - Current user ID / ID ผู้ใช้ปัจจุบัน
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of users / รายการผู้ใช้แบบแบ่งหน้า
   */
  async getAllUserInTenant(
    user_id: string,
    bu_code: string,
    paginate?: { page?: number; perpage?: number; search?: string; searchfields?: string[]; filter?: Record<string, string>; sort?: string[] },
    version?: string,
  ): Promise<any> {
    const page = paginate?.page || 1;
    const perpage = paginate?.perpage || 10;
    const search = paginate?.search || '';

    this.logger.debug(
      {
        function: 'getAllUserInTenant',
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
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
              alias_name: true,
            },
          },
        },
      })
      .then(async (res) => {
        const user_current = res.map((item) => {
          return {
            user_id: item.user_id,
            email: item.tb_user_tb_user_tb_business_unit_user_idTotb_user.email,
            alias_name:
              item.tb_user_tb_user_tb_business_unit_user_idTotb_user.alias_name,
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
                code: true,
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
                  code: true,
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
                department_code: item.tb_department.code,
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
              code: dept.department_code,
              name: dept.department_name,
            };
          });

          return {
            user_id: user_current.find((user) => user.user_id === item.user_id)
              ?.user_id,
            email: user_current.find((user) => user.user_id === item.user_id)
              ?.email,
            alias_name: user_current.find(
              (user) => user.user_id === item.user_id,
            )?.alias_name,
            department: {
              id: d?.department_id,
              code: d?.tb_department?.code,
              name: d?.tb_department?.name,
            },
            hod_department: dh,
            firstname: item.firstname,
            middlename: item.middlename,
            lastname: item.lastname,
          };
        });
      });

    // Apply search filter
    let filtered = user;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = user.filter((item: any) =>
        item.email?.toLowerCase().includes(searchLower) ||
        item.firstname?.toLowerCase().includes(searchLower) ||
        item.lastname?.toLowerCase().includes(searchLower) ||
        item.alias_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply filter parameters (e.g. department_id|string:uuid, supports multiple values comma-separated)
    if (paginate?.filter && typeof paginate.filter === 'object') {
      for (const [rawKey, rawValue] of Object.entries(paginate.filter)) {
        if (!rawValue) continue;
        const fieldName = rawKey.includes('|') ? rawKey.split('|')[0] : rawKey;
        const values = String(rawValue).split(',').map((v) => v.trim());

        filtered = filtered.filter((item: any) => {
          if (fieldName === 'department_id') {
            return values.includes(item.department?.id);
          }
          return values.includes(item[fieldName]);
        });
      }
    }

    // Apply pagination
    const total = filtered.length;
    const skip = (page - 1) * perpage;
    const paginatedData = perpage === -1 ? filtered : filtered.slice(skip, skip + perpage);

    return {
      data: paginatedData,
      paginate: {
        total,
        page,
        perpage,
        pages: total === 0 ? 1 : Math.ceil(total / (perpage === -1 ? total : perpage)),
      },
      response: {
        status: HttpStatus.OK,
        message: 'Get all user in tenant successful',
      },
    };
  }

  /**
   * Get all users in the system (platform-level)
   * ดึงผู้ใช้ทั้งหมดในระบบ (ระดับแพลตฟอร์ม)
   * @param version - API version / เวอร์ชัน API
   * @returns List of all users / รายการผู้ใช้ทั้งหมด
   */
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

  /**
   * Send push notification to user (placeholder)
   * ส่งการแจ้งเตือนแบบพุชไปยังผู้ใช้ (ตัวแทน)
   * @param token - Notification token / โทเค็นการแจ้งเตือน
   * @param url - Notification URL / URL การแจ้งเตือน
   */
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
    } catch (error: unknown) {
      this.logger.error(
        `Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          file: AuthService.name,
          function: 'sendPasswordResetEmail',
          email,
        },
      );
      // Don't throw - we don't want to fail the forgot password flow if email fails
    }
  }

  /**
   * Update user profile information
   * อัปเดตข้อมูลโปรไฟล์ผู้ใช้
   * @param userId - User ID / ID ผู้ใช้
   * @param updateData - Profile fields to update / ฟิลด์โปรไฟล์ที่ต้องการอัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated user profile / โปรไฟล์ผู้ใช้ที่อัปเดตแล้ว
   */
  async updateUserProfile(
    userId: string,
    updateData: {
      alias_name?: string;
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
      // Keycloak rejects names with special characters (person-name-invalid-character policy).
      // Strip unsupported chars before sending to Keycloak; the full value is stored in the DB.
      const sanitizeForKeycloak = (name: string): string =>
        name.replace(/[^a-zA-Z\u0E00-\u0E7F\s'-]/g, '').trim();

      const keycloakUpdateData: {
        firstName?: string;
        lastName?: string;
        attributes?: Record<string, string[]>;
      } = {};

      if (updateData.firstname) {
        keycloakUpdateData.firstName = sanitizeForKeycloak(updateData.firstname);
      }
      if (updateData.lastname) {
        keycloakUpdateData.lastName = sanitizeForKeycloak(updateData.lastname);
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

      // Separate alias_name (belongs to tb_user) from profile fields
      const { alias_name, ...profileData } = updateData;

      // Update alias_name on tb_user if provided
      if (alias_name !== undefined) {
        await this.prismaSystem.tb_user.update({
          where: { id: userId },
          data: { alias_name },
        });
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
        data: profileData,
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
          alias_name: alias_name ?? existingUser.alias_name,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating user profile';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: 'updateUserProfile',
        userId,
        version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Get business units associated with a user
   * ดึงหน่วยธุรกิจที่เชื่อมโยงกับผู้ใช้
   * @param userId - User ID / ID ผู้ใช้
   * @param is_active - Filter by active status / กรองตามสถานะใช้งาน
   * @param version - API version / เวอร์ชัน API
   * @returns List of business units / รายการหน่วยธุรกิจ
   */
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while retrieving business unit';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: 'getBus',
        userId,
        version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Get roles assigned to a user within a business unit
   * ดึงบทบาทที่กำหนดให้ผู้ใช้ภายในหน่วยธุรกิจ
   * @param userId - User ID / ID ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of user roles / รายการบทบาทผู้ใช้
   */
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while retrieving roles';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: 'getRoles',
        userId,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }

  /**
   * Get all permissions for a user
   * ดึงสิทธิ์ทั้งหมดของผู้ใช้
   * @param userId - User ID / ID ผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns List of user permissions / รายการสิทธิ์ผู้ใช้
   */
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
      const permissionsAllBu = [];

      for (const bu_code of bu_codes) {
        const permissionsBu = {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while retrieving permissions';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: 'getPermissions',
        userId,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
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
        } catch (userError: unknown) {
          const userErrorMessage = userError instanceof Error ? userError.message : 'Unknown error';
          errors.push({
            userId: keycloakUser.id,
            email: keycloakUser.email,
            error: userErrorMessage,
          });
          this.logger.error(`Failed to sync user: ${keycloakUser.email}`, {
            file: AuthService.name,
            function: 'syncRealmUsers',
            userId: keycloakUser.id,
            error: userErrorMessage,
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during user sync';
      this.logger.error(errorMessage, {
        file: AuthService.name,
        function: 'syncRealmUsers',
        version,
      });
      return {
        response: {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: errorMessage,
        },
      };
    }
  }
}
