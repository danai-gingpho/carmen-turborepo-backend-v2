import { Module } from '@nestjs/common';
import { CurrenciesService } from './currencies.service';
import { CurrenciesController } from './currencies.controller';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Module({
  controllers: [CurrenciesController],
  providers: [
    CurrenciesService,
    BackendLogger,
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
  ],
  exports: [CurrenciesService],
})
export class CurrenciesModule {}
