import { Module } from '@nestjs/common';
import { RunningCodeService } from './running-code.service';
import { RunningCodeController } from './running-code.controller';
import { TenantModule } from '@/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [RunningCodeController],
  providers: [RunningCodeService],
  exports: [RunningCodeService],
})
export class RunningCodeModule {}
