import { Module } from '@nestjs/common';
import { Config_RecipeEquipmentService } from './config_recipe-equipment.service';
import { Config_RecipeEquipmentController } from './config_recipe-equipment.controller';
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
  controllers: [Config_RecipeEquipmentController],
  providers: [Config_RecipeEquipmentService],
})
export class Config_RecipeEquipmentModule {}
