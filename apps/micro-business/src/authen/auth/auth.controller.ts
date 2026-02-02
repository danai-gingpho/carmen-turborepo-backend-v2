import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { IInviteUser, IRegister, IRegisterConfirm } from './dto/register.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto, ResetPasswordWithTokenDto } from './dto/forgotpassword.dto';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { runWithAuditContext, AuditContext } from '@repo/log-events-library';
import { ChangePasswordDto } from './dto/changepassword';

@Controller()
export class AuthController {
  private readonly logger: BackendLogger = new BackendLogger(
    AuthController.name,
  );
  constructor(private readonly authService: AuthService) {}

  private createAuditContext(payload: any): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  @MessagePattern({ cmd: 'login', service: 'auth' })
  async login(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'login', payload: payload }, AuthController.name);

    const version: string = payload.version ?? 'latest';
    const loginDto: LoginDto = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.login(loginDto, version));
  }

  @MessagePattern({ cmd: 'logout', service: 'auth' })
  async logout(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'logout', payload: payload }, AuthController.name);

    const version: string = payload.version ?? 'latest';
    const logoutDto: LogoutDto = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.logout(logoutDto, version));
  }

  @MessagePattern({ cmd: 'register', service: 'auth' })
  async register(@Payload() payload: any): Promise<any> {
    this.logger.debug({ function: 'register', payload: payload }, AuthController.name);

    const version: string = payload.version ?? 'latest';
    const registerDto: IRegister = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.register(registerDto, version));
  }

  @MessagePattern({ cmd: 'invite-user', service: 'auth' })
  async inviteUser(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'inviteUser', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const inviteUserDto: IInviteUser = payload.data;
    const user_id = payload.user_id;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.inviteUser(inviteUserDto, user_id, version));
  }

  @MessagePattern({ cmd: 'register-confirm', service: 'auth' })
  async registerConfirm(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'registerConfirm', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const registerConfirmDto: IRegisterConfirm = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.registerConfirm(registerConfirmDto, version));
  }

  @MessagePattern({ cmd: 'refresh-token', service: 'auth' })
  async refreshToken(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'refreshToken', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const refreshTokenDto: any = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.refreshToken(refreshTokenDto, version));
  }

  // @MessagePattern({ cmd: 'verify-token', service: 'auth' })
  // verifyToken(@Payload() payload: any) {
  //   const version: string = payload.version ?? 1;
  //   const verifyTokenDto: any = payload.data;
  //   return this.authService.verifyToken(verifyTokenDto, version);
  // }

  @MessagePattern({ cmd: 'forgot-password', service: 'auth' })
  async forgotPassword(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'forgotPassword', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const forgotPasswordDto: ForgotPasswordDto = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.forgotPassword(forgotPasswordDto, version));
  }

  @MessagePattern({ cmd: 'reset-password-with-token', service: 'auth' })
  resetPasswordWithToken(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'resetPasswordWithToken', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const resetPasswordWithTokenDto: ResetPasswordWithTokenDto = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.authService.resetPasswordWithToken(resetPasswordWithTokenDto, version)
    );
  }

  @MessagePattern({ cmd: 'get-user-profile', service: 'auth' })
  async getUserProfile(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getUserProfile', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const id = payload.id;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getUserProfile(id, version));
  }

  @MessagePattern({ cmd: 'get-all-user-in-tenant', service: 'auth' })
  async getAllUserInTenant(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getAllUserInTenant', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getAllUserInTenant(user_id, bu_code, version));
  }

  @MessagePattern({ cmd: 'get-user-by-id', service: 'auth' })
  async getUserById(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getUserById', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const id = payload.id;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getNameById(id));
  }

  @MessagePattern({ cmd: 'get-user-profiles-by-ids', service: 'auth' })
  async getUserProfilesByIds(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getUserProfilesByIds', payload: payload },
      AuthController.name,
    );

    const user_ids: string[] = payload.user_ids || [];
    const department = payload.department;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getUserProfilesByIds(user_ids, department));
  }

  @MessagePattern({ cmd: 'get-by-tenant', service: 'auth' })
  async getByTenant(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getByTenant', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const tenant_id = payload.tenant_id;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getByTenant(tenant_id, version));
  }

  @MessagePattern({ cmd: 'get-all-users', service: 'auth' })
  async getAllUsers(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getAllUsers', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getAllUsers(version));
  }

  @MessagePattern({ cmd: 'reset-password', service: 'auth' })
  async resetPassword(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'resetPassword', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const resetPasswordDto: { email: string; new_password: string } = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () =>
      this.authService.resetPassword(
        resetPasswordDto.email,
        resetPasswordDto.new_password,
        version,
      )
    );
  }

  @MessagePattern({ cmd: 'change-password', service: 'auth' })
  changePassword(@Payload() payload: any) {
    const version: string = payload.version ?? 1;
    const changePasswordDto: ChangePasswordDto = payload.data;
    return this.authService.changePassword(changePasswordDto, version);
  }

  // @MessagePattern({ cmd: 'change-email', service: 'auth' })
  // changeEmail(@Payload() payload: any) {
  //   const version: string = payload.version ?? 1;
  //   const changeEmailDto: ChangeEmailDto = payload.data;
  //   return this.authService.changeEmail(changeEmailDto, version);
  // }

  @MessagePattern({ cmd: 'update-user-profile', service: 'auth' })
  async updateUserProfile(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'updateUserProfile', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const userId: string = payload.user_id;
    const updateData: {
      firstname?: string;
      middlename?: string;
      lastname?: string;
      telephone?: string;
    } = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.updateUserProfile(userId, updateData, version));
  }

  @MessagePattern({ cmd: 'get-permission', service: 'auth' })
  getPermission(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'getPermission', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const user_id: string = payload.user_id;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getPermissions(user_id, version));
  }

  @MessagePattern({ cmd: 'sync-realm-users', service: 'auth' })
  async syncRealmUsers(@Payload() payload: any): Promise<any> {
    this.logger.debug(
      { function: 'syncRealmUsers', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.syncRealmUsers(version));
  }
}
