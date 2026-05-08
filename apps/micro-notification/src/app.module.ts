import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SentryModule } from '@sentry/nestjs/setup';
import { NotificationModule } from './notification/notification.module';
import { AppConfigModule } from './app-config/app-config.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    NotificationModule,
    AppConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
