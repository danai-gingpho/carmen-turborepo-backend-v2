import { HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { firstValueFrom, timeout, catchError, throwError } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { KeycloakUserInfo, ValidatedUser } from '../interfaces/auth.interface';
import { MicroserviceResponse } from '@/common';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  private readonly logger: BackendLogger = new BackendLogger(KeycloakStrategy.name);

  constructor(
    @Inject('KEYCLOAK_SERVICE') private readonly keycloakService: ClientProxy,
    @Inject('BUSINESS_SERVICE') private readonly authService: ClientProxy,
  ) {
    super();
  }

  /**
   * Validate the Keycloak bearer token, fetch user info, and auto-provision if needed
   * ตรวจสอบโทเค็น Bearer ของ Keycloak ดึงข้อมูลผู้ใช้ และสร้างบัญชีอัตโนมัติหากจำเป็น
   * @param token - Bearer access token from the request header / โทเค็น Bearer จาก header ของคำขอ
   * @returns Validated user with ID, name, email, and business units / ผู้ใช้ที่ผ่านการตรวจสอบพร้อมรหัสผู้ใช้, ชื่อ, อีเมล และหน่วยธุรกิจ
   */
  async validate(token: string): Promise<ValidatedUser> {
    try {
      const userInfo = await this.getUserInfo(token);

      if (!userInfo || !userInfo.sub) {
        this.logger.warn('User info is empty or missing sub field');
        throw new UnauthorizedException('Invalid user information');
      }

      await this.ensureUserExists(userInfo);

      return {
        user_id: userInfo.sub,
        name: userInfo.name,
        username: userInfo.preferred_username,
        email: userInfo.email,
        bu: userInfo.bu || [],
      };
    } catch (error) {
      this.logger.error('Keycloak token validation failed', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Auto-provision the user in the Carmen platform if they exist in Keycloak but not locally
   * สร้างบัญชีผู้ใช้ในแพลตฟอร์ม Carmen โดยอัตโนมัติหากมีใน Keycloak แต่ยังไม่มีในระบบ
   * @param userInfo - User information from Keycloak / ข้อมูลผู้ใช้จาก Keycloak
   */
  private async ensureUserExists(userInfo: KeycloakUserInfo): Promise<void> {
    try {
      const response: MicroserviceResponse = await firstValueFrom(
        this.authService.send(
          { cmd: 'user.ensure-exists', service: 'user' },
          {
            data: {
              id: userInfo.sub,
              username: userInfo.preferred_username,
              email: userInfo.email,
              firstname: userInfo.given_name,
              lastname: userInfo.family_name,
            },
          },
        ).pipe(
          timeout(5000),
          catchError((err) => {
            this.logger.warn(
              `Auto-provisioning timeout/error for user ${userInfo.sub}: ${err.message}`,
              KeycloakStrategy.name,
            );
            return throwError(() => err);
          }),
        ),
      );

      if ((response.data as Record<string, unknown>)?.created) {
        this.logger.log(
          `Auto-provisioned new user: ${userInfo.sub} (${userInfo.email})`,
          KeycloakStrategy.name,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to auto-provision user ${userInfo.sub}, proceeding with auth: ${error instanceof Error ? error.message : 'Unknown error'}`,
        KeycloakStrategy.name,
      );
    }
  }

  /**
   * Fetch user information from Keycloak via the keycloak microservice over TCP
   * ดึงข้อมูลผู้ใช้จาก Keycloak ผ่านไมโครเซอร์วิส keycloak ทาง TCP
   * @param token - Keycloak access token / โทเค็นการเข้าถึง Keycloak
   * @returns User info including sub, name, email, and business units / ข้อมูลผู้ใช้รวมถึง sub, ชื่อ, อีเมล และหน่วยธุรกิจ
   */
  private async getUserInfo(token: string): Promise<KeycloakUserInfo> {
    try {
      const response: MicroserviceResponse<KeycloakUserInfo> = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.auth.getUserInfo', service: 'keycloak' },
          { accessToken: token },
        ),
      );

      if (response.response.status !== HttpStatus.OK) {
        const message = response.response.message || 'Failed to fetch user info';
        this.logger.error(`Failed to fetch user info: ${message}`);
        throw new UnauthorizedException(message);
      }

      this.logger.debug({ userInfo: response.data }, 'Fetched user info from Keycloak via TCP');
      return response.data;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Failed to fetch user info from Keycloak', error);
      throw new UnauthorizedException('Failed to fetch user info');
    }
  }
}
