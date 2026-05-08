import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationNativeGateway } from './notification-native.gateway';
import { NotificationController } from './notification.controller';
import { InternalNotificationController } from './internal-notification.controller';
import { envConfig } from 'src/libs/config.env';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.TCP,
        options: {
          host: envConfig.NOTIFICATION_SERVICE_HOST,
          port: Number(envConfig.NOTIFICATION_SERVICE_TCP_PORT),
        },
      },
    ]),
  ],
  controllers: [NotificationController, InternalNotificationController],
  providers: [NotificationNativeGateway],
  exports: [NotificationNativeGateway],
})
export class NotificationModule {}
