import { Module } from '@nestjs/common';
import { SpotCheckService } from './spot-check.service';
import { SpotCheckController } from './spot-check.controller';
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
  controllers: [SpotCheckController],
  providers: [SpotCheckService],
})
export class SpotCheckModule {}
