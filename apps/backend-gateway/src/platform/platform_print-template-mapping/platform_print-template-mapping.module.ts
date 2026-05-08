import { Module } from '@nestjs/common';
import { Platform_PrintTemplateMappingController } from './platform_print-template-mapping.controller';
import { Platform_PrintTemplateMappingService } from './platform_print-template-mapping.service';

@Module({
  controllers: [Platform_PrintTemplateMappingController],
  providers: [Platform_PrintTemplateMappingService],
})
export class Platform_PrintTemplateMappingModule {}
