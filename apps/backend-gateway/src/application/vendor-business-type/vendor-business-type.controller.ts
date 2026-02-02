import { Controller, UseInterceptors } from '@nestjs/common';
import { VendorBusinessTypeService } from './vendor-business-type.service';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';

@Controller('api/vendor-business-type')
export class VendorBusinessTypeController extends BaseHttpController {
  constructor(private readonly vendorBusinessTypeService: VendorBusinessTypeService) {
    super();
  }
}
