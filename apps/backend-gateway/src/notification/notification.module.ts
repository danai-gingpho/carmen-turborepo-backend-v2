import { Module } from '@nestjs/common';
import { NotificationNativeGateway } from './notification-native.gateway';
import { NotificationController } from './notification.controller';

@Module({
  controllers: [NotificationController],
  providers: [NotificationNativeGateway],
  exports: [NotificationNativeGateway],
})
export class NotificationModule {}
