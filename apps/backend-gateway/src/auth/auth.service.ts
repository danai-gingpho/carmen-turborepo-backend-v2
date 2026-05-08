import {
  Injectable,
  Inject,
  HttpException,
  HttpStatus,
  NotImplementedException,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { IInviteUser, ILogin, IRegisterConfirm, IResetPassword, IForgotPassword, IResetPasswordWithToken, IChangePassword } from './dto/auth.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';
import { sendToService } from 'src/common/helpers/microservice.helper';
import { MicroserviceResponse } from '@/common';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger: BackendLogger = new BackendLogger(AuthService.name);

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly authService: ClientProxy,
  ) { }

  /**
   * Connect to the business microservice TCP client on module initialization
   * เชื่อมต่อกับไมโครเซอร์วิสธุรกิจผ่าน TCP เมื่อโมดูลเริ่มต้น
   */
  async onModuleInit() {
    const maxRetries = 5;
    const delayMs = 3000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.authService.connect();
        this.logger.log('AUTH_SERVICE TCP client connected');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : error;
        if (attempt < maxRetries) {
          this.logger.warn(`AUTH_SERVICE connection attempt ${attempt}/${maxRetries} failed: ${message}. Retrying in ${delayMs / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          this.logger.error(`AUTH_SERVICE connection failed after ${maxRetries} attempts: ${message}. Will reconnect on first request.`);
        }
      }
    }
  }

  /**
   * Forward login request to the business microservice via TCP
   * ส่งต่อคำขอเข้าสู่ระบบไปยังไมโครเซอร์วิสธุรกิจผ่าน TCP
   * @param loginDto - Login credentials / ข้อมูลการเข้าสู่ระบบ
   * @param version - API version / เวอร์ชัน API
   * @returns JWT tokens wrapped in standard response / โทเค็น JWT ในรูปแบบ response มาตรฐาน
   */
  async login(loginDto: ILogin, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'login',
        loginDto,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'login', service: 'auth' },
      { data: loginDto, version: version },
    );

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Forward logout request to invalidate the user's session
   * ส่งต่อคำขอออกจากระบบเพื่อยกเลิกเซสชันของผู้ใช้
   * @param logoutDto - Logout data including user_id and refresh_token / ข้อมูลออกจากระบบรวมถึงรหัสผู้ใช้และ refresh_token
   * @param version - API version / เวอร์ชัน API
   * @returns Logout confirmation / ผลลัพธ์การออกจากระบบ
   */
  async logout(logoutDto: Record<string, unknown>, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'logout',
        logoutDto,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'logout', service: 'auth' },
      { data: logoutDto, version: version },
    );

    if (response.response.status !== HttpStatus.NO_CONTENT) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Forward registration request to create a new user account
   * ส่งต่อคำขอลงทะเบียนเพื่อสร้างบัญชีผู้ใช้ใหม่
   * @param registerDto - Registration data / ข้อมูลการลงทะเบียน
   * @param version - API version / เวอร์ชัน API
   * @returns Created user data / ข้อมูลผู้ใช้ที่สร้างแล้ว
   */
  async register(registerDto: Record<string, unknown>, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'register',
        registerDto,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'register', service: 'auth' },
      { data: registerDto, version: version },
    );

    if (response.response.status !== HttpStatus.CREATED) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.created(response.data);
  }

  /**
   * Forward invitation request to send a registration link to a new user
   * ส่งต่อคำขอเชิญเพื่อส่งลิงก์ลงทะเบียนให้ผู้ใช้ใหม่
   * @param inviteUserDto - Invitation data (email) / ข้อมูลการเชิญ (อีเมล)
   * @param user_id - ID of the inviting user / รหัสผู้ใช้ที่ทำการเชิญ
   * @param version - API version / เวอร์ชัน API
   * @returns Invitation result / ผลลัพธ์การเชิญ
   */
  async inviteUser(inviteUserDto: IInviteUser, user_id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'inviteUser',
        inviteUserDto,
        user_id,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'invite-user', service: 'auth' },
      { data: inviteUserDto, user_id, version: version },
    );

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Forward registration confirmation to activate an invited user's account
   * ส่งต่อการยืนยันการลงทะเบียนเพื่อเปิดใช้งานบัญชีผู้ใช้ที่ได้รับเชิญ
   * @param registerConfirmDto - Confirmation token and user details / โทเค็นยืนยันและรายละเอียดผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Activated user data / ข้อมูลผู้ใช้ที่เปิดใช้งานแล้ว
   */
  async registerConfirm(
    registerConfirmDto: IRegisterConfirm,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'registerConfirm',
        registerConfirmDto,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'register-confirm', service: 'auth' },
      { data: registerConfirmDto, version: version },
    );

    if (response.response.status !== HttpStatus.CREATED) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.created(response.data);
  }

  /**
   * Forward refresh token request to obtain new JWT tokens
   * ส่งต่อคำขอรีเฟรชโทเค็นเพื่อรับโทเค็น JWT ใหม่
   * @param refreshTokenDto - Object containing the refresh_token / อ็อบเจกต์ที่มี refresh_token
   * @param version - API version / เวอร์ชัน API
   * @returns New access and refresh tokens / โทเค็นการเข้าถึงและรีเฟรชใหม่
   */
  async refreshToken(refreshTokenDto: Record<string, unknown>, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'refreshToken',
        refreshTokenDto,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'refresh-token', service: 'auth' },
      { data: refreshTokenDto, version: version },
    );

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Forward forgot-password request to send a reset email
   * ส่งต่อคำขอลืมรหัสผ่านเพื่อส่งอีเมลรีเซ็ต
   * @param forgotPasswordDto - User email / อีเมลผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Confirmation that reset email was sent / การยืนยันว่าอีเมลรีเซ็ตถูกส่งแล้ว
   */
  async forgotPassword(forgotPasswordDto: IForgotPassword, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'forgotPassword',
        forgotPasswordDto,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'forgot-password', service: 'auth' },
      { data: forgotPasswordDto, version: version },
    );

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Forward token-based password reset request
   * ส่งต่อคำขอรีเซ็ตรหัสผ่านด้วยโทเค็น
   * @param resetPasswordWithTokenDto - Token and new password / โทเค็นและรหัสผ่านใหม่
   * @param version - API version / เวอร์ชัน API
   * @returns Password reset confirmation / การยืนยันการรีเซ็ตรหัสผ่าน
   */
  async resetPasswordWithToken(resetPasswordWithTokenDto: IResetPasswordWithToken, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'resetPasswordWithToken',
        token: resetPasswordWithTokenDto.token,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'reset-password-with-token', service: 'auth' },
      { data: resetPasswordWithTokenDto, version: version },
    );

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Forward admin password reset request (no current password required)
   * ส่งต่อคำขอรีเซ็ตรหัสผ่านโดยผู้ดูแลระบบ (ไม่ต้องใช้รหัสผ่านปัจจุบัน)
   * @param resetPasswordDto - Target user email and new password / อีเมลผู้ใช้เป้าหมายและรหัสผ่านใหม่
   * @param version - API version / เวอร์ชัน API
   * @returns Password reset confirmation / การยืนยันการรีเซ็ตรหัสผ่าน
   */
  async resetPassword(resetPasswordDto: IResetPassword, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'reset-password',
        email: resetPasswordDto.email,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'reset-password', service: 'auth' },
      { data: resetPasswordDto, version: version },
    );

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Forward self-service password change request
   * ส่งต่อคำขอเปลี่ยนรหัสผ่านด้วยตนเอง
   * @param changePasswordDto - Current password, new password, user ID, and access token / รหัสผ่านปัจจุบัน, รหัสผ่านใหม่, รหัสผู้ใช้ และ access token
   * @param version - API version / เวอร์ชัน API
   * @returns Password change confirmation / การยืนยันการเปลี่ยนรหัสผ่าน
   */
  async changePassword(changePasswordDto: IChangePassword & { user_id: string; accessToken: string }, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'changePassword',
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'change-password', service: 'auth' },
      { data: changePasswordDto, version: version },
    );

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Change user email (not yet implemented)
   * เปลี่ยนอีเมลผู้ใช้ (ยังไม่ได้ดำเนินการ)
   * @param changeEmailDto - Email change data / ข้อมูลการเปลี่ยนอีเมล
   * @param version - API version / เวอร์ชัน API
   * @returns Not implemented error / ข้อผิดพลาดยังไม่ได้ดำเนินการ
   */
  async changeEmail(changeEmailDto: Record<string, unknown>, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'changeEmail',
        changeEmailDto,
        version,
      },
      AuthService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  /**
   * Retrieve users by tenant ID
   * ดึงข้อมูลผู้ใช้ตามรหัสผู้เช่า
   * @param tenant_id - Tenant identifier / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Users belonging to the tenant / ผู้ใช้ที่อยู่ในผู้เช่า
   */
  async getByTenant(tenant_id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getByTenant',
        tenant_id,
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'get-by-tenant', service: 'auth' },
      { data: tenant_id, version: version },
    );

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }

  /**
   * Retrieve all platform users (for testing/dev purposes)
   * ดึงข้อมูลผู้ใช้ทั้งหมดในแพลตฟอร์ม (สำหรับทดสอบ/พัฒนา)
   * @param version - API version / เวอร์ชัน API
   * @returns List of all users / รายชื่อผู้ใช้ทั้งหมด
   */
  async getAllUsers(version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getAllUsers',
        version,
      },
      AuthService.name,
    );

    const response = await sendToService<MicroserviceResponse>(
      this.authService,
      { cmd: 'get-all-users', service: 'auth' },
      { data: {}, version: version },
    );

    if (response.response.status !== HttpStatus.OK) {
      throw new HttpException(response.response, response.response.status);
    }

    return ResponseLib.success(response.data);
  }
}
