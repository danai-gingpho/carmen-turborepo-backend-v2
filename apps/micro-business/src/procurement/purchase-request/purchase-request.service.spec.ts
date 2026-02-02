import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseRequestService } from './purchase-request.service';
import { TenantService } from '@/tenant/tenant.service';
import { CommonLogic } from '@/common/common.logic';
import { enum_purchase_request_doc_status } from '@repo/prisma-shared-schema-tenant';

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;

  const mockPrismaSystem = {
    tb_business_unit: {
      findFirst: jest.fn(),
    },
    tb_user: {
      findFirst: jest.fn(),
    },
  };

  const mockPrismaTenant = jest.fn();

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getdb_connection: jest.fn(),
  };

  const mockCommonLogic = {
    getRunningPattern: jest.fn(),
    generateRunningCode: jest.fn(),
  };

  const mockAuthService = {
    send: jest.fn(),
  };

  const mockMasterService = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestService,
        {
          provide: 'PRISMA_SYSTEM',
          useValue: mockPrismaSystem,
        },
        {
          provide: 'PRISMA_TENANT',
          useValue: mockPrismaTenant,
        },
        {
          provide: 'AUTH_SERVICE',
          useValue: mockAuthService,
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
          provide: CommonLogic,
          useValue: mockCommonLogic,
        },
      ],
    }).compile();

    service = module.get<PurchaseRequestService>(PurchaseRequestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('splitPr', () => {
    const mockUserId = 'user-123';
    const mockBuCode = 'BU001';
    const mockPrId = 'pr-123';
    const mockDetailIds = ['detail-1', 'detail-2'];

    const mockTenant = {
      tenant_id: 'tenant-123',
      db_connection: 'connection-string',
    };

    const mockOriginalPr = {
      id: mockPrId,
      pr_no: 'PR2501-0001',
      pr_date: new Date('2025-01-15'),
      pr_status: enum_purchase_request_doc_status.draft,
      description: 'Test PR',
      workflow_id: 'workflow-1',
      workflow_name: 'Default Workflow',
      workflow_current_stage: null,
      workflow_previous_stage: null,
      workflow_next_stage: null,
      workflow_history: null,
      user_action: null,
      last_action: null,
      last_action_at_date: null,
      last_action_by_id: null,
      last_action_by_name: null,
      requestor_id: mockUserId,
      requestor_name: 'Test User',
      department_id: 'dept-1',
      department_name: 'Test Department',
      note: null,
      info: null,
      dimension: null,
      tb_purchase_request_detail: [
        { id: 'detail-1', sequence_no: 1, product_name: 'Product 1' },
        { id: 'detail-2', sequence_no: 2, product_name: 'Product 2' },
        { id: 'detail-3', sequence_no: 3, product_name: 'Product 3' },
      ],
    };

    const mockPrismaClient = {
      tb_purchase_request: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      tb_purchase_request_detail: {
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    beforeEach(() => {
      mockTenantService.getdb_connection.mockResolvedValue(mockTenant);
      mockPrismaTenant.mockResolvedValue(mockPrismaClient);
    });

    it('should return error when tenant not found', async () => {
      mockTenantService.getdb_connection.mockResolvedValue(null);

      const result = await service.splitPr(mockPrId, mockDetailIds, mockUserId, mockBuCode);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toBe('Tenant not found');
    });

    it('should return error when purchase request not found', async () => {
      mockPrismaClient.tb_purchase_request.findFirst.mockResolvedValue(null);

      const result = await service.splitPr(mockPrId, mockDetailIds, mockUserId, mockBuCode);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toBe('Purchase request not found');
    });

    it('should return error when no valid detail IDs provided', async () => {
      mockPrismaClient.tb_purchase_request.findFirst.mockResolvedValue({
        ...mockOriginalPr,
        tb_purchase_request_detail: [
          { id: 'detail-3', sequence_no: 1, product_name: 'Product 3' },
        ],
      });

      const result = await service.splitPr(mockPrId, ['non-existent-id'], mockUserId, mockBuCode);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toBe('No valid detail IDs provided for split');
    });

    it('should return error when trying to split all details', async () => {
      const prWithTwoDetails = {
        ...mockOriginalPr,
        tb_purchase_request_detail: [
          { id: 'detail-1', sequence_no: 1, product_name: 'Product 1' },
          { id: 'detail-2', sequence_no: 2, product_name: 'Product 2' },
        ],
      };
      mockPrismaClient.tb_purchase_request.findFirst.mockResolvedValue(prWithTwoDetails);

      const result = await service.splitPr(mockPrId, ['detail-1', 'detail-2'], mockUserId, mockBuCode);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toBe('Cannot split all details. At least one detail must remain in the original PR');
    });

    it('should successfully split PR with draft status', async () => {
      mockPrismaClient.tb_purchase_request.findFirst.mockResolvedValue(mockOriginalPr);

      const newPrId = 'new-pr-123';
      const newPrNo = 'draft-20250115120000';

      mockPrismaClient.$transaction.mockImplementation(async (callback) => {
        const txPrisma = {
          tb_purchase_request: {
            create: jest.fn().mockResolvedValue({ id: newPrId, pr_no: newPrNo }),
            update: jest.fn().mockResolvedValue({}),
          },
          tb_purchase_request_detail: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txPrisma);
      });

      const result = await service.splitPr(mockPrId, mockDetailIds, mockUserId, mockBuCode);

      expect(result.isOk()).toBe(true);
      const data = result.value;
      expect(data.original_pr_id).toBe(mockPrId);
      expect(data.new_pr_id).toBe(newPrId);
      expect(data.split_detail_count).toBe(2);
    });

    it('should re-sequence details in both original and new PR', async () => {
      mockPrismaClient.tb_purchase_request.findFirst.mockResolvedValue(mockOriginalPr);

      const detailUpdates: any[] = [];
      mockPrismaClient.$transaction.mockImplementation(async (callback) => {
        const txPrisma = {
          tb_purchase_request: {
            create: jest.fn().mockResolvedValue({ id: 'new-pr-123', pr_no: 'draft-123' }),
            update: jest.fn().mockResolvedValue({}),
          },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation((args) => {
              detailUpdates.push(args);
              return Promise.resolve({});
            }),
          },
        };
        return callback(txPrisma);
      });

      await service.splitPr(mockPrId, mockDetailIds, mockUserId, mockBuCode);

      // Check that details were updated - 2 for new PR + 1 for remaining in original
      expect(detailUpdates.length).toBe(3);

      // New PR details should have sequence_no 1 and 2
      const newPrUpdates = detailUpdates.filter(u => u.data.purchase_request_id === 'new-pr-123');
      expect(newPrUpdates.some(u => u.data.sequence_no === 1)).toBe(true);
      expect(newPrUpdates.some(u => u.data.sequence_no === 2)).toBe(true);
    });

    it('should copy header information from original PR', async () => {
      mockPrismaClient.tb_purchase_request.findFirst.mockResolvedValue(mockOriginalPr);

      let createdPrData: any = null;
      mockPrismaClient.$transaction.mockImplementation(async (callback) => {
        const txPrisma = {
          tb_purchase_request: {
            create: jest.fn().mockImplementation((args) => {
              createdPrData = args.data;
              return Promise.resolve({ id: 'new-pr-123', pr_no: 'draft-123' });
            }),
            update: jest.fn().mockResolvedValue({}),
          },
          tb_purchase_request_detail: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txPrisma);
      });

      await service.splitPr(mockPrId, mockDetailIds, mockUserId, mockBuCode);

      expect(createdPrData.pr_status).toBe(enum_purchase_request_doc_status.draft);
      expect(createdPrData.requestor_id).toBe(mockUserId);
      expect(createdPrData.requestor_name).toBe('Test User');
      expect(createdPrData.department_id).toBe('dept-1');
      expect(createdPrData.department_name).toBe('Test Department');
      expect(createdPrData.workflow_id).toBe('workflow-1');
      expect(createdPrData.workflow_name).toBe('Default Workflow');
    });

    it('should update original PR doc_version', async () => {
      mockPrismaClient.tb_purchase_request.findFirst.mockResolvedValue(mockOriginalPr);

      let originalPrUpdateData: any = null;
      mockPrismaClient.$transaction.mockImplementation(async (callback) => {
        const txPrisma = {
          tb_purchase_request: {
            create: jest.fn().mockResolvedValue({ id: 'new-pr-123', pr_no: 'draft-123' }),
            update: jest.fn().mockImplementation((args) => {
              if (args.where.id === mockPrId) {
                originalPrUpdateData = args.data;
              }
              return Promise.resolve({});
            }),
          },
          tb_purchase_request_detail: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(txPrisma);
      });

      await service.splitPr(mockPrId, mockDetailIds, mockUserId, mockBuCode);

      expect(originalPrUpdateData.doc_version).toEqual({ increment: 1 });
      expect(originalPrUpdateData.updated_by_id).toBe(mockUserId);
    });
  });
});
