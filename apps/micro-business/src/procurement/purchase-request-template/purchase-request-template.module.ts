import { Module } from '@nestjs/common';
import { PurchaseRequestTemplateService } from './purchase-request-template.service';
import { CommonModule } from '@/common/common.module';
import { PurchaseRequestTemplateLogic } from './purchase-request-template.logic';
import { TenantModule } from '@/tenant/tenant.module';
import { PurchaseRequestTemplateController } from './purchase-request-template.controller';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [PurchaseRequestTemplateController],
  providers: [PurchaseRequestTemplateService, PurchaseRequestTemplateLogic],
})
export class PurchaseRequestTemplateModule {}
