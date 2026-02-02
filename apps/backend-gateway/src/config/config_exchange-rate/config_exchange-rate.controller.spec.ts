import { Test, TestingModule } from '@nestjs/testing';
import { Config_ExchangeRateController } from './config_exchange-rate.controller';
import { Config_ExchangeRateService } from './config_exchange-rate.service';

const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('Config_ExchangeRateController', () => {
  let controller: Config_ExchangeRateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_ExchangeRateController],
      providers: [
        Config_ExchangeRateService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_ExchangeRateController>(Config_ExchangeRateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
