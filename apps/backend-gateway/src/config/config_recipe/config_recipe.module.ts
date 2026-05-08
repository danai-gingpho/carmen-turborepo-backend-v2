import { Module } from '@nestjs/common';
import { Config_RecipeService } from './config_recipe.service';
import { Config_RecipeController } from './config_recipe.controller';
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
  controllers: [Config_RecipeController],
  providers: [Config_RecipeService],
})
export class Config_RecipeModule {}
