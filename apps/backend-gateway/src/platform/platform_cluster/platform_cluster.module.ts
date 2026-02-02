import { Module } from '@nestjs/common';
import { Platform_ClusterService } from './platform_cluster.service';
import { Platform_ClusterController } from './platform_cluster.controller';
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
  controllers: [Platform_ClusterController],
  providers: [Platform_ClusterService],
})
export class Platform_ClusterModule {}
