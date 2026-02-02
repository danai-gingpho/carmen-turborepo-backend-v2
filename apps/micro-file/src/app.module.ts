import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BackendLogger } from '@/common/helpers/backend.logger';
import { FilesModule } from './files/files.module';

@Module({
  imports: [FilesModule],
  controllers: [AppController],
  providers: [AppService, BackendLogger],
})
export class AppModule {}
