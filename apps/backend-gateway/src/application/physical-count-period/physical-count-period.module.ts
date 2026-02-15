import { Module } from '@nestjs/common';
import { PhysicalCountPeriodService } from './physical-count-period.service';
import { PhysicalCountPeriodController } from './physical-count-period.controller';
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
  controllers: [PhysicalCountPeriodController],
  providers: [PhysicalCountPeriodService],
})
export class PhysicalCountPeriodModule {}
