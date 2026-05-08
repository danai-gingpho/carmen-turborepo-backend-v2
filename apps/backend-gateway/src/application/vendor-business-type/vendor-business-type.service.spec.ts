import { Test, TestingModule } from '@nestjs/testing';
import { VendorBusinessTypeService } from './vendor-business-type.service';

describe('VendorBusinessTypeService', () => {
  let service: VendorBusinessTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorBusinessTypeService],
    }).compile();

    service = module.get<VendorBusinessTypeService>(VendorBusinessTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
