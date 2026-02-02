import { Test, TestingModule } from '@nestjs/testing';
import { Config_CurrenciesService } from './config_currencies.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('CurrenciesService', () => {
  let service: Config_CurrenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_CurrenciesService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_CurrenciesService>(Config_CurrenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
