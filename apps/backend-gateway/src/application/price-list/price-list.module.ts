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
        name: 'MASTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.MASTER_SERVICE_HOST,
          port: Number(envConfig.MASTER_SERVICE_PORT),
        },
      },
    ]),
    JwtModule.register({
      secret: envConfig.SUPABASE_JWT_SECRET,
    }),
  ],
  controllers: [PriceListController, CheckPriceListController],
  providers: [PriceListService, CheckPriceListService],
})
export class PriceListModule {}
