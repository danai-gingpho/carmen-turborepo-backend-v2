import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderService } from './purchase-order.service';
import { TenantService } from '@/tenant/tenant.service';
import { CommonLogic } from '@/common/common.logic';
import { NotificationService } from '@/common';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getTenant: jest.fn(),
  };

  const mockCommonLogic = {
    generateDocumentNumber: jest.fn(),
  };

  const mockNotificationService = {
    sendNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderService,
        {
          provide: TenantService,
          useValue: mockTenantService,
        },
        {
          provide: CommonLogic,
          useValue: mockCommonLogic,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
