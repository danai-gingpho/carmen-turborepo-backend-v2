import { Test, TestingModule } from '@nestjs/testing';
import { Config_LocationProductService } from './config_location-product.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_LocationProductService', () => {
  let service: Config_LocationProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_LocationProductService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_LocationProductService>(Config_LocationProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
