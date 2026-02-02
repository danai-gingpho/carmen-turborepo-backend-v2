import { Module } from '@nestjs/common';
import { UserLocationService } from './user-location.service';
import { UserLocationController } from './user-location.controller';
import { Transport } from '@nestjs/microservices';
import { ClientsModule } from '@nestjs/microservices';
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
  controllers: [UserLocationController],
  providers: [UserLocationService],
})
export class UserLocationModule {}
