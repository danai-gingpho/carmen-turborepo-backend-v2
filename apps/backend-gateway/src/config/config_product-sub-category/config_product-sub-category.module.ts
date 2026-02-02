import { Module } from '@nestjs/common';
import { Config_ProductSubCategoryService } from './config_product-sub-category.service';
import { Config_ProductSubCategoryController } from './config_product-sub-category.controller';
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
  controllers: [Config_ProductSubCategoryController],
  providers: [Config_ProductSubCategoryService],
})
export class Config_ProductSubCategoryModule {}
