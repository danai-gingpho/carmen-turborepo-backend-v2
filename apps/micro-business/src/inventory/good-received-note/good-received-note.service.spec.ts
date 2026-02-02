import { Test, TestingModule } from '@nestjs/testing';
import { GoodReceivedNoteService } from './good-received-note.service';
import { TenantService } from '@/tenant/tenant.service';
import { NotificationService } from '@/common';

describe('GoodReceivedNoteService', () => {
  let service: GoodReceivedNoteService;

  const mockPrismaSystem = {};

  const mockPrismaTenant = jest.fn();

  const mockMasterService = {
    send: jest.fn(),
    emit: jest.fn(),
  };

  const mockTenantService = {
    getdb_connection: jest.fn(),
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getTenant: jest.fn(),
  };

  const mockNotificationService = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodReceivedNoteService,
        {
          provide: 'PRISMA_SYSTEM',
          useValue: mockPrismaSystem,
        },
        {
          provide: 'PRISMA_TENANT',
          useValue: mockPrismaTenant,
        },
        {
          provide: 'MASTER_SERVICE',
          useValue: mockMasterService,
        },
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<GoodReceivedNoteService>(GoodReceivedNoteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
