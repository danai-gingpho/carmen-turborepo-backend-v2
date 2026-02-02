import { Module } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'LOG_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.LOG_SERVICE_HOST,
          port: Number(envConfig.LOG_SERVICE_PORT),
        },
      },
    ]),
  ],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
})
export class ActivityLogModule {}
