import { Test, TestingModule } from '@nestjs/testing';
import { Config_CreditTermController } from './config_credit_term.controller';
import { Config_CreditTermService } from './config_credit_term.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('Config_CreditTermController', () => {
  let controller: Config_CreditTermController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Config_CreditTermController],
      providers: [
        Config_CreditTermService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<Config_CreditTermController>(Config_CreditTermController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
