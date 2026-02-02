import { Test, TestingModule } from '@nestjs/testing';
import { Config_VendorsService } from './config_vendors.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_VendorsService', () => {
  let service: Config_VendorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_VendorsService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_VendorsService>(Config_VendorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
