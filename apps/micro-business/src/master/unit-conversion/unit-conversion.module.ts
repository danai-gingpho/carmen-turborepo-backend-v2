import { Module } from '@nestjs/common';
import { UnitConversionController } from './unit-conversion.controller';
import { UnitConversionService } from './unit-conversion.service';
import { TenantModule } from '@/tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [UnitConversionController],
  providers: [UnitConversionService],
})
export class UnitConversionModule {}
