import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger: BackendLogger = new BackendLogger(JwtStrategy.name);

  constructor(
    private readonly _configService: ConfigService,
    private readonly _authService: AuthService,
    private readonly _jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: _configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Validate the decoded JWT payload and extract user identity
   * ตรวจสอบ payload ของ JWT ที่ถอดรหัสแล้วและดึงข้อมูลตัวตนผู้ใช้
   * @param payload - Decoded JWT payload containing user claims / payload ของ JWT ที่ถอดรหัสแล้วซึ่งมีข้อมูลผู้ใช้
   * @returns User object with user_id and email / อ็อบเจกต์ผู้ใช้ที่มีรหัสผู้ใช้และอีเมล
   */
  async validate(payload: Record<string, unknown>) {
    this.logger.debug(
      {
        function: 'validate',
        payload,
      },
      'validate',
    );

    return {
      user_id: payload.id,
      email: payload.email,
    };
  }
}
