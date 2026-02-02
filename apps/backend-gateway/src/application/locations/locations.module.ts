import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
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
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
