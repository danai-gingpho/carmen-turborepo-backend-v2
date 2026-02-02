import { Module } from '@nestjs/common';
import { VendorProductService } from './vendor-product.service';
import { VendorProductController } from './vendor-product.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PROCUREMENT_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.PROCUREMENT_SERVICE_HOST,
          port: Number(envConfig.PROCUREMENT_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [VendorProductController],
  providers: [VendorProductService],
})
export class VendorProductModule {}
