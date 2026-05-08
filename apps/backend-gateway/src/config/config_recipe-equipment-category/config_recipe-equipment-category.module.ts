import { Module } from '@nestjs/common';
import { Config_RecipeEquipmentCategoryService } from './config_recipe-equipment-category.service';
import { Config_RecipeEquipmentCategoryController } from './config_recipe-equipment-category.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'BUSINESS_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.BUSINESS_SERVICE_HOST,
          port: Number(envConfig.BUSINESS_SERVICE_TCP_PORT),
        },
      },
    ]),
  ],
  controllers: [Config_RecipeEquipmentCategoryController],
  providers: [Config_RecipeEquipmentCategoryService],
})
export class Config_RecipeEquipmentCategoryModule {}
