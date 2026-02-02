import { Test, TestingModule } from '@nestjs/testing';
import { Config_CurrenciesController } from './config_currencies.controller';
import { Config_CurrenciesService } from './config_currencies.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_CurrenciesController', () => {
  let controller: Config_CurrenciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_CurrenciesController],
      providers: [
        Config_CurrenciesService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_CurrenciesController>(
      Config_CurrenciesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
