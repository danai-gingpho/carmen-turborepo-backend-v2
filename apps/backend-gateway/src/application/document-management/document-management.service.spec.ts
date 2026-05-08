import { Test, TestingModule } from '@nestjs/testing';
import { DocumentManagementService } from './document-management.service';

const mockFileService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('DocumentManagementService', () => {
  let service: DocumentManagementService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentManagementService,
        {
          provide: 'FILE_SERVICE',
          useValue: mockFileService,
        },
      ],
    }).compile();

    service = module.get<DocumentManagementService>(DocumentManagementService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
