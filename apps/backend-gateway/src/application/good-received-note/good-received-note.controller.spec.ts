import { Test, TestingModule } from '@nestjs/testing';
import { GoodReceivedNoteController } from './good-received-note.controller';
import { GoodReceivedNoteService } from './good-received-note.service';


const mockInventoryService = {
  send: jest.fn(),
  emit: jest.fn(),
};
describe('GoodReceivedNoteController', () => {
  let controller: GoodReceivedNoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoodReceivedNoteController],
      providers: [
        GoodReceivedNoteService,
        {
          provide: 'INVENTORY_SERVICE',
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    controller = module.get<GoodReceivedNoteController>(GoodReceivedNoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
