import { Test, TestingModule } from '@nestjs/testing';
import { Config_ExchangeRateService } from './config_exchange-rate.service';

const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('Config_ExchangeRateService', () => {
  let service: Config_ExchangeRateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_ExchangeRateService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_ExchangeRateService>(Config_ExchangeRateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
