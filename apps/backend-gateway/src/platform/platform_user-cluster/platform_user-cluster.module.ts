import { Module } from '@nestjs/common';
import { Platform_UserClusterService } from './platform_user-cluster.service';
import { Platform_UserClusterController } from './platform_user-cluster.controller';
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
  controllers: [Platform_UserClusterController],
  providers: [Platform_UserClusterService],
})
export class Platform_UserClusterModule {}
