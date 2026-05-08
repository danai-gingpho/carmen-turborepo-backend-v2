import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { KeycloakStrategy } from './strategies/keycloak.strategy';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from 'src/libs/config.env';
import { PermissionGuard } from './guards/permission.guard';
import { PermissionService } from './services/permission.service';
import { KeycloakGuard } from './guards/keycloak.guard';
import { UrlTokenGuard } from './guards/url-token.guard';

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'BUSINESS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.BUSINESS_SERVICE_HOST,
          port: Number(envConfig.BUSINESS_SERVICE_TCP_PORT),
        },
      },
      {
        name: 'KEYCLOAK_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.KEYCLOAK_API_SERVICE_HOST,
          port: Number(envConfig.KEYCLOAK_API_SERVICE_TCP_PORT),
        },
      },
    ]),
    JwtModule.register({
      secret: envConfig.JWT_SECRET,
    }),
    PassportModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    KeycloakStrategy,
    PermissionService,
    PermissionGuard,
    KeycloakGuard,
    UrlTokenGuard,
  ],
  exports: [
    AuthService,
    PermissionService,
    PermissionGuard,
    KeycloakGuard,
    UrlTokenGuard,
  ],
})
export class AuthModule {}
