import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class UrlTokenGuard implements CanActivate {
  private readonly logger = new BackendLogger(UrlTokenGuard.name);

  constructor(
    @Inject('PRISMA_SYSTEM')
    private readonly prismaSystem: typeof PrismaClient_SYSTEM,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const urlToken =
      request.query?.url_token ||
      request.params?.url_token ||
      request.body?.url_token;

    if (!urlToken) {
      this.logger.warn('url_token not provided in request');
      throw new UnauthorizedException('url_token is required');
    }

    this.logger.debug({ url_token: urlToken }, 'Validating url_token');

    const shotUrl = await this.prismaSystem.tb_shot_url.findFirst({
      where: {
        url_token: urlToken,
        token: request.token,
      },
    });

    if (!shotUrl) {
      this.logger.warn({ url_token: urlToken }, 'url_token not found');
      throw new UnauthorizedException('Invalid or expired url_token');
    }
    
    const now = new Date();
    if (shotUrl.expired_at < now) {
      this.logger.warn(
        {
          url_token: urlToken,
          expired_at: shotUrl.expired_at,
          now: now,
        },
        'url_token has expired',
      );
      throw new UnauthorizedException('url_token has expired');
    }

    // Decode the JWT token
    let decodedToken: any;
    try {
      decodedToken = this.jwtService.decode(shotUrl.token);
    } catch (error: any) {
      this.logger.error(
        {
          url_token: urlToken,
          error: error?.message || 'Unknown error',
        },
        'Failed to decode token',
      );
      throw new UnauthorizedException('Invalid token');
    }

    request.shotUrl = {
      id: shotUrl.id,
      app_method: shotUrl.app_method,
      url_token: shotUrl.url_token,
      token: shotUrl.token,
      expired_at: shotUrl.expired_at,
      receiver_email: shotUrl.receiver_email,
    };

    request.decodedToken = decodedToken;

    this.logger.debug(
      {
        url_token: urlToken,
        app_method: shotUrl.app_method,
        receiver_email: shotUrl.receiver_email,
        decodedToken,
      },
      'url_token validated successfully',
    );

    return true;
  }
}
