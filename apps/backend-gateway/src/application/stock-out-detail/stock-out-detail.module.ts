import { Module } from '@nestjs/common';
import { StockOutDetailService } from './stock-out-detail.service';
import { StockOutDetailController } from './stock-out-detail.controller';
import { envConfig } from 'src/libs/config.env';
import { Transport } from '@nestjs/microservices';
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.INVENTORY_SERVICE_HOST,
          port: Number(envConfig.INVENTORY_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [StockOutDetailController],
  providers: [StockOutDetailService],
})
export class StockOutDetailModule {}
