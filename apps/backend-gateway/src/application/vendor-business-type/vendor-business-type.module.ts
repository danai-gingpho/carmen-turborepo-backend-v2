import { Module } from '@nestjs/common';
import { VendorBusinessTypeService } from './vendor-business-type.service';
import { VendorBusinessTypeController } from './vendor-business-type.controller';

@Module({
  controllers: [VendorBusinessTypeController],
  providers: [VendorBusinessTypeService],
})
export class VendorBusinessTypeModule {}
