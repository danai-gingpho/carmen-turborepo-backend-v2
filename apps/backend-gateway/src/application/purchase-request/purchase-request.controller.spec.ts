import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequestService } from './purchase-request.service';
import { PermissionService } from 'src/auth/services/permission.service';
import { Result } from '@/common';

const mockProcurementService = {
  send: jest.fn(),
  emit: jest.fn(),
};
const mockPrismaSystem = {};
const mockPermissionService = {
  getUserPermissions: jest.fn().mockResolvedValue({}),
};

const mockPurchaseRequestService = {
  findById: jest.fn(),
  findAll: jest.fn(),
  findAllWorkflowStagesByPr: jest.fn(),
  create: jest.fn(),
  duplicatePr: jest.fn(),
  splitPr: jest.fn(),
  save: jest.fn(),
  submit: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
  review: jest.fn(),
  delete: jest.fn(),
  findAllByStatus: jest.fn(),
  exportToExcel: jest.fn(),
  printToPdf: jest.fn(),
};

describe('PurchaseRequestController', () => {
  let controller: PurchaseRequestController;
  let purchaseRequestService: PurchaseRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseRequestController],
      providers: [
        {
          provide: PurchaseRequestService,
          useValue: mockPurchaseRequestService,
        },
        {
          provide: 'PROCUREMENT_SERVICE',
          useValue: mockProcurementService,
        },
        {
          provide: PermissionService,
          useValue: mockPermissionService,
        },
        {
          provide: 'PRISMA_SYSTEM',
          useValue: mockPrismaSystem,
        },
      ],
    }).compile();

    controller = module.get<PurchaseRequestController>(PurchaseRequestController);
    purchaseRequestService = module.get<PurchaseRequestService>(PurchaseRequestService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('splitPr', () => {
    const mockRequest = {
      headers: {
        'x-user-id': 'user-123',
        'x-bu-datas': JSON.stringify([{ bu_code: 'BU001' }]),
      },
      user: {
        user_id: 'user-123',
      },
    } as unknown as Request;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    } as unknown as any;

    it('should successfully split a purchase request', async () => {
      const mockResult = Result.ok({
        original_pr_id: 'pr-123',
        new_pr_id: 'new-pr-456',
        new_pr_no: 'PR2501-0002',
        split_detail_count: 2,
      });

      mockPurchaseRequestService.splitPr.mockResolvedValue(mockResult);

      await controller.splitPr(
        'pr-123',
        'BU001',
        { detail_ids: ['detail-1', 'detail-2'] },
        mockRequest,
        mockResponse,
        'latest',
      );

      expect(mockPurchaseRequestService.splitPr).toHaveBeenCalledWith(
        'pr-123',
        { detail_ids: ['detail-1', 'detail-2'] },
        'user-123',
        'BU001',
        'latest',
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle error when PR not found', async () => {
      const mockResult = Result.error('Purchase request not found', 3); // NOT_FOUND

      mockPurchaseRequestService.splitPr.mockResolvedValue(mockResult);

      await controller.splitPr(
        'non-existent-pr',
        'BU001',
        { detail_ids: ['detail-1'] },
        mockRequest,
        mockResponse,
        'latest',
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle error when invalid detail IDs', async () => {
      const mockResult = Result.error('No valid detail IDs provided for split', 1); // INVALID_ARGUMENT

      mockPurchaseRequestService.splitPr.mockResolvedValue(mockResult);

      await controller.splitPr(
        'pr-123',
        'BU001',
        { detail_ids: ['invalid-id'] },
        mockRequest,
        mockResponse,
        'latest',
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should pass version parameter correctly', async () => {
      const mockResult = Result.ok({
        original_pr_id: 'pr-123',
        new_pr_id: 'new-pr-789',
        new_pr_no: 'draft-123',
        split_detail_count: 1,
      });

      mockPurchaseRequestService.splitPr.mockResolvedValue(mockResult);

      await controller.splitPr(
        'pr-123',
        'BU001',
        { detail_ids: ['detail-1'] },
        mockRequest,
        mockResponse,
        'v2.0',
      );

      expect(mockPurchaseRequestService.splitPr).toHaveBeenCalledWith(
        'pr-123',
        { detail_ids: ['detail-1'] },
        'user-123',
        'BU001',
        'v2.0',
      );
    });
  });
});
