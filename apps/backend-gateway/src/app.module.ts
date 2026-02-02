import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ZodValidationPipe } from 'nestjs-zod';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE, Reflector } from '@nestjs/core';
import { ZodSerializerInterceptor } from '@/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { Platform_ClusterModule } from './platform/platform_cluster/platform_cluster.module';
import { Platform_BusinessUnitModule } from './platform/platform_business-unit/platform_business-unit.module';
import { Platform_UserClusterModule } from './platform/platform_user-cluster/platform_user-cluster.module';
import { RouteConfigModule } from './config/route-config';
import { UserModule } from './application/user/user.module';
import { envConfig } from 'src/libs/config.env';
import { UserBusinessUnitModule } from './application/user-business-unit/user-business-unit.module';
import { RouteApplicationModule } from './application/route-application';
import { Platform_UserBusinessUnitModule } from './platform/platform_user-business-unit/platform_user-business-unit.module';
import { PlatformUserModule } from './platform/platform-user/platform-user.module';
import { ExceptionFilter } from './exception/exception.fillter';
import { NotificationModule } from './notification/notification.module';
import { DatabaseModule } from './common/database/database.module';
import { PriceListTemplateModule } from './application/price-list-template/price-list-template.module';
import { RequestForPricingModule } from './application/request-for-pricing/request-for-pricing.module';

@Module({
  imports: [
    DatabaseModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.AUTH_SERVICE_HOST,
          port: Number(envConfig.AUTH_SERVICE_PORT),
        },
      },
      {
        name: 'CLUSTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.CLUSTER_SERVICE_HOST,
          port: Number(envConfig.CLUSTER_SERVICE_PORT),
        },
      },
      {
        name: 'MASTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.MASTER_SERVICE_HOST,
          port: Number(envConfig.MASTER_SERVICE_PORT),
        },
      }
    ]),
    ConfigModule.forRoot({
      isGlobal: true, // ทำให้ ConfigModule ใช้ได้ทั่วทั้งแอป
    }),
    AuthModule,
    UserBusinessUnitModule,
    RouteConfigModule,
    // DepartmentUserModule,
    // UnitCommentModule,
    // LocationsUserModule,
    // VendorProductModule,
    // CreditNoteModule,
    // GoodReceivedNoteModule,
    // LocationProductModule,
    // ProductLocationModule,
    // PurchaseOrderModule,
    // PurchaseRequestModule,
    // RunningCodeModule,
    // StoreRequisitionModule,
    // UserBusinessUnitModule,
    // UserLocationModule,
    Platform_ClusterModule,
    Platform_BusinessUnitModule,
    Platform_UserClusterModule,
    Platform_UserBusinessUnitModule,
    PlatformUserModule,
    // UserClusterModule,
    UserModule,
    RouteApplicationModule,
    NotificationModule,
    PriceListTemplateModule,
    RequestForPricingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new ZodSerializerInterceptor(reflector),
      inject: [Reflector],
    },
    // Note: PermissionGuard is NOT registered globally because it needs to run
    // AFTER KeycloakGuard (which sets request.user.permissions).
    // Global guards run before route-level guards, so PermissionGuard must be
    // applied at the route level using @UseGuards(KeycloakGuard, PermissionGuard).
  ],
})
export class AppModule { }
