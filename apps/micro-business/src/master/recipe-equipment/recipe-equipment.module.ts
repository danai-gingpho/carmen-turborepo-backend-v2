import { Module } from '@nestjs/common';
import { RecipeEquipmentService } from './recipe-equipment.service';
import { RecipeEquipmentController } from './recipe-equipment.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [RecipeEquipmentController],
  providers: [RecipeEquipmentService],
  exports: [RecipeEquipmentService],
})
export class RecipeEquipmentModule {}
