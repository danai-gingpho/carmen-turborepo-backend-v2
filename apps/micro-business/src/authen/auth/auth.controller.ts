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
import { MicroservicePayload, MicroserviceResponse } from '@/common';

@Controller()
export class AuthController {
  private readonly logger: BackendLogger = new BackendLogger(
    AuthController.name,
  );
  constructor(private readonly authService: AuthService) {}

  /**
   * Create audit context from payload
   * สร้างบริบทการตรวจสอบจาก payload
   * @param payload - Microservice payload / ข้อมูล payload จากไมโครเซอร์วิส
   * @returns Audit context object / ออบเจกต์บริบทการตรวจสอบ
   */
  private createAuditContext(payload: MicroservicePayload): AuditContext {
    return {
      tenant_id: payload.tenant_id || payload.bu_code,
      user_id: payload.user_id,
      request_id: payload.request_id,
      ip_address: payload.ip_address,
      user_agent: payload.user_agent,
    };
  }

  /**
   * Authenticate user and return access token
   * ยืนยันตัวตนผู้ใช้และส่งคืน access token
   * @param payload - Contains login credentials / ประกอบด้วยข้อมูลเข้าสู่ระบบ
   * @returns Authentication tokens / โทเค็นการยืนยันตัวตน
   */
  @MessagePattern({ cmd: 'login', service: 'auth' })
  async login(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'login', payload: payload }, AuthController.name);

    const version: string = payload.version ?? 'latest';
    const loginDto: LoginDto = payload.data;
    const ip: string = payload.ip_address ?? 'unknown';

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.login(loginDto, version, ip));
  }

  /**
   * Log out user and invalidate session
   * ออกจากระบบและยกเลิกเซสชัน
   * @param payload - Contains logout data / ประกอบด้วยข้อมูลออกจากระบบ
   * @returns Logout result / ผลลัพธ์การออกจากระบบ
   */
  @MessagePattern({ cmd: 'logout', service: 'auth' })
  async logout(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'logout', payload: payload }, AuthController.name);

    const version: string = payload.version ?? 'latest';
    const logoutDto: LogoutDto = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.logout(logoutDto, version));
  }

  /**
   * Register a new user account
   * ลงทะเบียนบัญชีผู้ใช้ใหม่
   * @param payload - Contains registration data / ประกอบด้วยข้อมูลการลงทะเบียน
   * @returns Registration result / ผลลัพธ์การลงทะเบียน
   */
  @MessagePattern({ cmd: 'register', service: 'auth' })
  async register(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug({ function: 'register', payload: payload }, AuthController.name);

    const version: string = payload.version ?? 'latest';
    const registerDto: IRegister = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.register(registerDto, version));
  }

  /**
   * Invite a new user to the system
   * เชิญผู้ใช้ใหม่เข้าสู่ระบบ
   * @param payload - Contains invite user data, user_id / ประกอบด้วยข้อมูลการเชิญผู้ใช้, user_id
   * @returns Invitation result / ผลลัพธ์การเชิญ
   */
  @MessagePattern({ cmd: 'invite-user', service: 'auth' })
  async inviteUser(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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

  /**
   * Confirm user registration
   * ยืนยันการลงทะเบียนผู้ใช้
   * @param payload - Contains registration confirmation data / ประกอบด้วยข้อมูลยืนยันการลงทะเบียน
   * @returns Confirmation result / ผลลัพธ์การยืนยัน
   */
  @MessagePattern({ cmd: 'register-confirm', service: 'auth' })
  async registerConfirm(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'registerConfirm', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const registerConfirmDto: IRegisterConfirm = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.registerConfirm(registerConfirmDto, version));
  }

  /**
   * Refresh authentication token
   * รีเฟรชโทเค็นการยืนยันตัวตน
   * @param payload - Contains refresh token data / ประกอบด้วยข้อมูลรีเฟรชโทเค็น
   * @returns New authentication tokens / โทเค็นการยืนยันตัวตนใหม่
   */
  @MessagePattern({ cmd: 'refresh-token', service: 'auth' })
  async refreshToken(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'refreshToken', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const refreshTokenDto: Record<string, unknown> = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.refreshToken(refreshTokenDto, version));
  }

  // @MessagePattern({ cmd: 'verify-token', service: 'auth' })
  // verifyToken(@Payload() payload: MicroservicePayload) {
  //   const version: string = payload.version ?? 1;
  //   const verifyTokenDto: any = payload.data;
  //   return this.authService.verifyToken(verifyTokenDto, version);
  // }

  /**
   * Request password reset email
   * ขอส่งอีเมลรีเซ็ตรหัสผ่าน
   * @param payload - Contains forgot password data / ประกอบด้วยข้อมูลลืมรหัสผ่าน
   * @returns Password reset request result / ผลลัพธ์การขอรีเซ็ตรหัสผ่าน
   */
  @MessagePattern({ cmd: 'forgot-password', service: 'auth' })
  async forgotPassword(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'forgotPassword', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const forgotPasswordDto: ForgotPasswordDto = payload.data;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.forgotPassword(forgotPasswordDto, version));
  }

  /**
   * Reset password using a token
   * รีเซ็ตรหัสผ่านโดยใช้โทเค็น
   * @param payload - Contains reset password token and new password / ประกอบด้วยโทเค็นรีเซ็ตรหัสผ่านและรหัสผ่านใหม่
   * @returns Password reset result / ผลลัพธ์การรีเซ็ตรหัสผ่าน
   */
  @MessagePattern({ cmd: 'reset-password-with-token', service: 'auth' })
  resetPasswordWithToken(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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

  /**
   * Get user profile by ID
   * ดึงข้อมูลโปรไฟล์ผู้ใช้ตาม ID
   * @param payload - Contains user id / ประกอบด้วย ID ผู้ใช้
   * @returns User profile data / ข้อมูลโปรไฟล์ผู้ใช้
   */
  @MessagePattern({ cmd: 'get-user-profile', service: 'auth' })
  async getUserProfile(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getUserProfile', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const id = payload.id;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getUserProfile(id, version));
  }

  /**
   * Get all users in a tenant/business unit
   * ดึงรายชื่อผู้ใช้ทั้งหมดในผู้เช่า/หน่วยธุรกิจ
   * @param payload - Contains user_id, bu_code, paginate / ประกอบด้วย user_id, bu_code, paginate
   * @returns Paginated list of users / รายการผู้ใช้แบบแบ่งหน้า
   */
  @MessagePattern({ cmd: 'get-all-user-in-tenant', service: 'auth' })
  async getAllUserInTenant(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getAllUserInTenant', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const user_id = payload.user_id;
    const bu_code = payload.bu_code;
    const paginate = payload.paginate;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getAllUserInTenant(user_id, bu_code, paginate, version));
  }

  /**
   * Get user name by ID
   * ดึงชื่อผู้ใช้ตาม ID
   * @param payload - Contains user id / ประกอบด้วย ID ผู้ใช้
   * @returns User name data / ข้อมูลชื่อผู้ใช้
   */
  @MessagePattern({ cmd: 'get-user-by-id', service: 'auth' })
  async getUserById(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getUserById', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const id = payload.id;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getNameById(id));
  }

  /**
   * Get user profiles by multiple IDs
   * ดึงข้อมูลโปรไฟล์ผู้ใช้หลายรายตาม ID
   * @param payload - Contains user_ids array, department / ประกอบด้วยอาร์เรย์ user_ids, department
   * @returns List of user profiles / รายการโปรไฟล์ผู้ใช้
   */
  @MessagePattern({ cmd: 'get-user-profiles-by-ids', service: 'auth' })
  async getUserProfilesByIds(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getUserProfilesByIds', payload: payload },
      AuthController.name,
    );

    const user_ids: string[] = payload.user_ids || [];
    const department = payload.department;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getUserProfilesByIds(user_ids, department));
  }

  /**
   * Get users by tenant ID
   * ดึงรายชื่อผู้ใช้ตาม ID ผู้เช่า
   * @param payload - Contains tenant_id / ประกอบด้วย tenant_id
   * @returns List of users in tenant / รายการผู้ใช้ในผู้เช่า
   */
  @MessagePattern({ cmd: 'get-by-tenant', service: 'auth' })
  async getByTenant(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getByTenant', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const tenant_id = payload.tenant_id;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getByTenant(tenant_id, version));
  }

  /**
   * Get all users in the system
   * ดึงรายชื่อผู้ใช้ทั้งหมดในระบบ
   * @param payload - Contains version / ประกอบด้วย version
   * @returns List of all users / รายการผู้ใช้ทั้งหมด
   */
  @MessagePattern({ cmd: 'get-all-users', service: 'auth' })
  async getAllUsers(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getAllUsers', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getAllUsers(version));
  }

  /**
   * Reset user password by admin
   * รีเซ็ตรหัสผ่านผู้ใช้โดยผู้ดูแลระบบ
   * @param payload - Contains email and new_password / ประกอบด้วย email และ new_password
   * @returns Password reset result / ผลลัพธ์การรีเซ็ตรหัสผ่าน
   */
  @MessagePattern({ cmd: 'reset-password', service: 'auth' })
  async resetPassword(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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

  /**
   * Change user password
   * เปลี่ยนรหัสผ่านผู้ใช้
   * @param payload - Contains change password data / ประกอบด้วยข้อมูลเปลี่ยนรหัสผ่าน
   * @returns Password change result / ผลลัพธ์การเปลี่ยนรหัสผ่าน
   */
  @MessagePattern({ cmd: 'change-password', service: 'auth' })
  changePassword(@Payload() payload: MicroservicePayload) {
    const version: string = payload.version ?? '1';
    const changePasswordDto: ChangePasswordDto = payload.data;
    return this.authService.changePassword(changePasswordDto, version);
  }

  // @MessagePattern({ cmd: 'change-email', service: 'auth' })
  // changeEmail(@Payload() payload: MicroservicePayload) {
  //   const version: string = payload.version ?? 1;
  //   const changeEmailDto: ChangeEmailDto = payload.data;
  //   return this.authService.changeEmail(changeEmailDto, version);
  // }

  /**
   * Update user profile information
   * แก้ไขข้อมูลโปรไฟล์ผู้ใช้
   * @param payload - Contains user_id and update data / ประกอบด้วย user_id และข้อมูลที่จะแก้ไข
   * @returns Updated user profile / โปรไฟล์ผู้ใช้ที่แก้ไขแล้ว
   */
  @MessagePattern({ cmd: 'update-user-profile', service: 'auth' })
  async updateUserProfile(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
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

  /**
   * Get user permissions
   * ดึงสิทธิ์ของผู้ใช้
   * @param payload - Contains user_id / ประกอบด้วย user_id
   * @returns User permissions / สิทธิ์ของผู้ใช้
   */
  @MessagePattern({ cmd: 'get-permission', service: 'auth' })
  getPermission(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'getPermission', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';
    const user_id: string = payload.user_id;

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.getPermissions(user_id, version));
  }

  /**
   * Synchronize users from Keycloak realm
   * ซิงค์ผู้ใช้จาก Keycloak realm
   * @param payload - Contains version / ประกอบด้วย version
   * @returns Sync result / ผลลัพธ์การซิงค์
   */
  @MessagePattern({ cmd: 'sync-realm-users', service: 'auth' })
  async syncRealmUsers(@Payload() payload: MicroservicePayload): Promise<MicroserviceResponse> {
    this.logger.debug(
      { function: 'syncRealmUsers', payload: payload },
      AuthController.name,
    );

    const version: string = payload.version ?? 'latest';

    const auditContext = this.createAuditContext(payload);
    return runWithAuditContext(auditContext, () => this.authService.syncRealmUsers(version));
  }
}
