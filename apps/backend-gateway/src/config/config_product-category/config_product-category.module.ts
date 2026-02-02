import { Module } from '@nestjs/common';
import { Config_ProductCategoryService } from './config_product-category.service';
import { Config_ProductCategoryController } from './config_product-category.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'MASTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.MASTER_SERVICE_HOST,
          port: Number(envConfig.MASTER_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [Config_ProductCategoryController],
  providers: [Config_ProductCategoryService],
})
export class Config_ProductCategoryModule {}
