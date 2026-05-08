import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VendorBusinessTypeService } from './vendor-business-type.service';
import {
  BaseHttpController,
} from '@/common';

@Controller('api/vendor-business-type')
@ApiTags('Config: Vendors')
export class VendorBusinessTypeController extends BaseHttpController {
  constructor(private readonly _vendorBusinessTypeService: VendorBusinessTypeService) {
    super();
  }
}
