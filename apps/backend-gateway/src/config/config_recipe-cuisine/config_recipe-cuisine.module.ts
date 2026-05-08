import { Module } from '@nestjs/common';
import { Config_RecipeCuisineService } from './config_recipe-cuisine.service';
import { Config_RecipeCuisineController } from './config_recipe-cuisine.controller';
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
  controllers: [Config_RecipeCuisineController],
  providers: [Config_RecipeCuisineService],
})
export class Config_RecipeCuisineModule {}
