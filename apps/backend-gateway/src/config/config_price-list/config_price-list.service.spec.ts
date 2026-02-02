import { Test, TestingModule } from '@nestjs/testing';
import { Config_PriceListService } from './config_price-list.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_PriceListService', () => {
  let service: Config_PriceListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_PriceListService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_PriceListService>(Config_PriceListService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
