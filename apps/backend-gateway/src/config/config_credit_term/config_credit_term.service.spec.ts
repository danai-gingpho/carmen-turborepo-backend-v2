import { Test, TestingModule } from '@nestjs/testing';
import { Config_CreditTermService } from './config_credit_term.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_CreditTermService', () => {
  let service: Config_CreditTermService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Config_CreditTermService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<Config_CreditTermService>(Config_CreditTermService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
