import { Test, TestingModule } from '@nestjs/testing';
import { Config_VendorBusinessTypeController } from './config_vendor_business_type.controller';
import { Config_VendorBusinessTypeService } from './config_vendor_business_type.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_VendorBusinessTypeController', () => {
  let controller: Config_VendorBusinessTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_VendorBusinessTypeController],
      providers: [
        Config_VendorBusinessTypeService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_VendorBusinessTypeController>(Config_VendorBusinessTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
