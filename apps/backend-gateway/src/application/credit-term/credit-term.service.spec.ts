import { Test, TestingModule } from '@nestjs/testing';
import { CreditTermService } from './credit-term.service';


const mockMasterService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('CreditTermService', () => {
  let service: CreditTermService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditTermService,
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
      ],
    }).compile();

    service = module.get<CreditTermService>(CreditTermService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
