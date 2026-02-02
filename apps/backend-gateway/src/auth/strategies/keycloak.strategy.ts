import { HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { firstValueFrom } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { KeycloakUserInfo, ValidatedUser } from '../interfaces/auth.interface';
import { MicroserviceResponse } from '@/common';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  private readonly logger: BackendLogger = new BackendLogger(KeycloakStrategy.name);

  constructor(
    @Inject('KEYCLOAK_SERVICE') private readonly keycloakService: ClientProxy,
  ) {
    super();
  }

  async validate(token: string): Promise<ValidatedUser> {
    try {
      const userInfo = await this.getUserInfo(token);

      if (!userInfo || !userInfo.sub) {
        this.logger.warn('User info is empty or missing sub field');
        throw new UnauthorizedException('Invalid user information');
      }

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

  private async getUserInfo(token: string): Promise<KeycloakUserInfo> {
    try {
      const response: MicroserviceResponse<KeycloakUserInfo> = await firstValueFrom(
        this.keycloakService.send(
          { cmd: 'keycloak.auth.getUserInfo', service: 'keycloak' },
          { accessToken: token },
        ),
      );

      if (response.response.status !== HttpStatus.OK) {
        this.logger.error(`Failed to fetch user info: ${response.response.message}`);
        throw new UnauthorizedException('Failed to fetch user info');
      }

      this.logger.debug({ userInfo: response.data }, 'Fetched user info from Keycloak via TCP');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch user info from Keycloak', error);
      throw new UnauthorizedException('Failed to fetch user info');
    }
  }
}
