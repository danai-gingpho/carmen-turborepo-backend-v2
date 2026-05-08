import { Module } from '@nestjs/common';
import { StockInDetailService } from './stock-in-detail.service';
import { StockInDetailController } from './stock-in-detail.controller';
import { envConfig } from 'src/libs/config.env';
import { Transport } from '@nestjs/microservices';
import { ClientsModule } from '@nestjs/microservices';

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
  controllers: [StockInDetailController],
  providers: [StockInDetailService],
})
export class StockInDetailModule {}
