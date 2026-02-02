import { Module } from '@nestjs/common';
import { PurchaseRequestTemplateService } from './purchase-request-template.service';
import { CommonModule } from '@/common/common.module';
import { PurchaseRequestTemplateLogic } from './purchase-request-template.logic';
import { TenantService } from '@/tenant/tenant.service';
import { PrismaClient_TENANT } from '@repo/prisma-shared-schema-tenant';
import { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { PurchaseRequestTemplateController } from './purchase-request-template.controller';

@Module({
  imports: [CommonModule],
  controllers: [PurchaseRequestTemplateController],
  providers: [
    PurchaseRequestTemplateService,
    PurchaseRequestTemplateLogic,
    TenantService,
    {
      provide: 'PRISMA_TENANT',
      useValue: PrismaClient_TENANT,
    },
    {
      provide: 'PRISMA_SYSTEM',
      useValue: PrismaClient_SYSTEM,
    },
  ],
})
export class PurchaseRequestTemplateModule {}
