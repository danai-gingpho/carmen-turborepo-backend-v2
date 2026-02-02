import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
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
