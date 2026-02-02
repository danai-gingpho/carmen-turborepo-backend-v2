import { Test, TestingModule } from '@nestjs/testing';
import { GoodReceivedNoteService } from './good-received-note.service';


const mockInventoryService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('GoodReceivedNoteService', () => {
  let service: GoodReceivedNoteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodReceivedNoteService,
        {
          provide: 'INVENTORY_SERVICE',
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<GoodReceivedNoteService>(GoodReceivedNoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
