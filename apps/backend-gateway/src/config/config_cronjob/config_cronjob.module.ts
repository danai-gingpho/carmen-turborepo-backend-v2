import { Module } from '@nestjs/common';
import { ConfigCronjobService } from './config_cronjob.service';
import { ConfigCronjobController } from './config_cronjob.controller';

@Module({
  controllers: [ConfigCronjobController],
  providers: [ConfigCronjobService],
})
export class ConfigCronjobModule {}
