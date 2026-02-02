import { Test, TestingModule } from '@nestjs/testing';
import { GoodReceivedNoteController } from './good-received-note.controller';
import { GoodReceivedNoteService } from './good-received-note.service';

describe('GoodReceivedNoteController', () => {
  let controller: GoodReceivedNoteController;

  const mockGoodReceivedNoteService = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    exportToExcel: jest.fn(),
    reject: jest.fn(),
    findDetailById: jest.fn(),
    findDetailsByGrnId: jest.fn(),
    createDetail: jest.fn(),
    updateDetail: jest.fn(),
    deleteDetail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoodReceivedNoteController],
      providers: [
        {
          provide: GoodReceivedNoteService,
          useValue: mockGoodReceivedNoteService,
        },
      ],
    }).compile();

    controller = module.get<GoodReceivedNoteController>(GoodReceivedNoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
