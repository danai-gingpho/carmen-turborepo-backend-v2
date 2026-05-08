import { Module } from '@nestjs/common';
import { ProductItemGroupService } from './product-item-group.service';
import { ProductItemGroupController } from './product-item-group.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [ProductItemGroupController],
  providers: [ProductItemGroupService],
  exports: [ProductItemGroupService],
})
export class ProductItemGroupModule {}
