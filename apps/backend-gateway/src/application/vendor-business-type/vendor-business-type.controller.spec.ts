import { Test, TestingModule } from '@nestjs/testing';
import { VendorBusinessTypeController } from './vendor-business-type.controller';
import { VendorBusinessTypeService } from './vendor-business-type.service';

describe('VendorBusinessTypeController', () => {
  let controller: VendorBusinessTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VendorBusinessTypeController],
      providers: [VendorBusinessTypeService],
    }).compile();

    controller = module.get<VendorBusinessTypeController>(VendorBusinessTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
