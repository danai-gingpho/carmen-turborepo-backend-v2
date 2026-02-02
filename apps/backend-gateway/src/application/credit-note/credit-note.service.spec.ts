import { Test, TestingModule } from '@nestjs/testing';
import { CreditNoteService } from './credit-note.service';


const mockProcurementService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('CreditNoteService', () => {
  let service: CreditNoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditNoteService,
        {
          provide: 'PROCUREMENT_SERVICE',
          useValue: mockProcurementService,
        },
      ],
    }).compile();

    service = module.get<CreditNoteService>(CreditNoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
