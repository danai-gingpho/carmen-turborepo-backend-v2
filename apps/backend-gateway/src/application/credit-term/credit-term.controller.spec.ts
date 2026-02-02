import { Test, TestingModule } from '@nestjs/testing';
import { CreditTermController } from './credit-term.controller';
import { CreditTermService } from './credit-term.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('CreditTermController', () => {
  let controller: CreditTermController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CreditTermController],
      providers: [
        CreditTermService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    controller = module.get<CreditTermController>(CreditTermController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
