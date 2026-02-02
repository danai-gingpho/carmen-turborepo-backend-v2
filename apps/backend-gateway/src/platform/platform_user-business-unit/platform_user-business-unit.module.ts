import { Module } from '@nestjs/common';
import { Platform_UserBusinessUnitService } from './platform_user-business-unit.service';
import { Platform_UserBusinessUnitController } from './platform_user-business-unit.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'CLUSTER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.CLUSTER_SERVICE_HOST,
          port: Number(envConfig.CLUSTER_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [Platform_UserBusinessUnitController],
  providers: [Platform_UserBusinessUnitService],
})
export class Platform_UserBusinessUnitModule {}
