import { Module } from '@nestjs/common';
import { ProductSubCategoryService } from './product-sub-category.service';
import { ProductSubCategoryController } from './product-sub-category.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [ProductSubCategoryController],
  providers: [ProductSubCategoryService],
  exports: [ProductSubCategoryService],
})
export class ProductSubCategoryModule {}
