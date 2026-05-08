import { Module } from '@nestjs/common';
import { RecipeCategoryService } from './recipe-category.service';
import { RecipeCategoryController } from './recipe-category.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [RecipeCategoryController],
  providers: [RecipeCategoryService],
  exports: [RecipeCategoryService],
})
export class RecipeCategoryModule {}
