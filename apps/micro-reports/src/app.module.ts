import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendLogger } from '@/common/helpers/backend.logger';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, BackendLogger],
})
export class AppModule {}
