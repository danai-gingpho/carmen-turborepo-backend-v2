import { Test, TestingModule } from '@nestjs/testing';
import { Config_ProductLocationService } from './config_product-location.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_ProductLocationService', () => {
  let service: Config_ProductLocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_ProductLocationService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_ProductLocationService>(Config_ProductLocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
