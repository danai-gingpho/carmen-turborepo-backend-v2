import { Test, TestingModule } from '@nestjs/testing';
import { Config_VendorBusinessTypeService } from './config_vendor_business_type.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_VendorBusinessTypeService', () => {
  let service: Config_VendorBusinessTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_VendorBusinessTypeService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_VendorBusinessTypeService>(Config_VendorBusinessTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
