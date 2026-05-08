import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import { RecipeLogic } from './recipe.logic';
import { TenantModule } from '@/tenant/tenant.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TenantModule, CommonModule],
  controllers: [RecipeController],
  providers: [
    RecipeService,
    RecipeLogic,
  ],
  exports: [RecipeService],
})
export class RecipeModule {}
