import { Module } from '@nestjs/common';
import { Config_RecipeCategoryService } from './config_recipe-category.service';
import { Config_RecipeCategoryController } from './config_recipe-category.controller';
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
  controllers: [Config_RecipeCategoryController],
  providers: [Config_RecipeCategoryService],
})
export class Config_RecipeCategoryModule {}
