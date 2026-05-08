import { Module } from '@nestjs/common';
import { PriceListService } from './price-list.service';
import { PriceListController } from './price-list.controller';
import { CheckPriceListController } from './check-price-list.controller';
import { CheckPriceListService } from './check-price-list.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
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
    JwtModule.register({
      secret: envConfig.JWT_SECRET,
    }),
  ],
  controllers: [PriceListController, CheckPriceListController],
  providers: [PriceListService, CheckPriceListService],
})
export class PriceListModule {}
