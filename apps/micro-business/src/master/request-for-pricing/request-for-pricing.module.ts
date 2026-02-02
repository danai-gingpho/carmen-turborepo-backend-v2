import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RequestForPricingService } from './request-for-pricing.service';
import { RequestForPricingController } from './request-for-pricing.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';
import { envConfig } from '@/common/libs/config.env';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';

@Module({
  imports: [
    TenantModule,
    CommonModule,
    JwtModule.register({
      secret: envConfig.SUPABASE_JWT_SECRET,
      signOptions: { expiresIn: parseInt(envConfig.JWT_EXPIRES_IN, 10) },
    }),
  ],
  controllers: [RequestForPricingController],
  providers: [
    RequestForPricingService,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
  exports: [RequestForPricingService],
})
export class RequestForPricingModule {}
