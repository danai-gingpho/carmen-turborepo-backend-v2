import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';
import { TenantModule } from '@/tenant/tenant.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KEYCLOAK_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.KEYCLOAK_API_SERVICE_HOST,
          port: Number(envConfig.KEYCLOAK_API_SERVICE_PORT),
        },
      },
    ]),
    JwtModule.register({
      secret: envConfig.SUPABASE_JWT_SECRET,
    }),
    TenantModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
