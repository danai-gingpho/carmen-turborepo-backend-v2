import { Module } from '@nestjs/common';
import { TaxProfileService } from './tax_profile.service';
import { TaxProfileController } from './tax_profile.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [TaxProfileController],
  providers: [TaxProfileService],
  exports: [TaxProfileService],
})
export class TaxProfileModule {}
