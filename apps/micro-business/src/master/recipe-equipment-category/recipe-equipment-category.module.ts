import { Module } from '@nestjs/common';
import { RecipeEquipmentCategoryService } from './recipe-equipment-category.service';
import { RecipeEquipmentCategoryController } from './recipe-equipment-category.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [RecipeEquipmentCategoryController],
  providers: [RecipeEquipmentCategoryService],
  exports: [RecipeEquipmentCategoryService],
})
export class RecipeEquipmentCategoryModule {}
