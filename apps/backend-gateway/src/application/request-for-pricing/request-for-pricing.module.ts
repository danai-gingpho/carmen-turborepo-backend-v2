import { Module } from '@nestjs/common';
import { RequestForPricingService } from './request-for-pricing.service';
import { RequestForPricingController } from './request-for-pricing.controller';
import { ClientsModule } from '@nestjs/microservices';
import { Transport } from '@nestjs/microservices';
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
  controllers: [RequestForPricingController],
  providers: [RequestForPricingService],
  exports: [RequestForPricingService],
})
export class RequestForPricingModule {}
