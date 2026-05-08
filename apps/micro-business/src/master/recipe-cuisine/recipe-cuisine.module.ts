import { Module } from '@nestjs/common';
import { RecipeCuisineService } from './recipe-cuisine.service';
import { RecipeCuisineController } from './recipe-cuisine.controller';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [RecipeCuisineController],
  providers: [RecipeCuisineService],
  exports: [RecipeCuisineService],
})
export class RecipeCuisineModule {}
