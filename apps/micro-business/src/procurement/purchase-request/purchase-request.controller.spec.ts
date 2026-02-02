import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseRequestController } from './purchase-request.controller';
import { PurchaseRequestService } from './purchase-request.service';
import { PurchaseRequestLogic } from './logic/purchase-request.logic';
import { Result } from '@/common';
import { HttpStatus } from '@nestjs/common';

describe('PurchaseRequestController', () => {
  let controller: PurchaseRequestController;
  let purchaseRequestService: PurchaseRequestService;

  const mockPurchaseRequestService = {
    findById: jest.fn(),
    findAll: jest.fn(),
    findAllMyPending: jest.fn(),
    findAllWorkflowStagesByPr: jest.fn(),
    findAllByStatus: jest.fn(),
    findAllMyPendingStages: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    duplicatePr: jest.fn(),
    splitPr: jest.fn(),
    reject: jest.fn(),
    exportToExcel: jest.fn(),
    printToPdf: jest.fn(),
    initializePrismaService: jest.fn(),
  };

  const mockPurchaseRequestLogic = {
    create: jest.fn(),
    save: jest.fn(),
    submit: jest.fn(),
    approve: jest.fn(),
    review: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PurchaseRequestController],
      providers: [
        {
          provide: PurchaseRequestService,
          useValue: mockPurchaseRequestService,
        },
        {
          provide: PurchaseRequestLogic,
          useValue: mockPurchaseRequestLogic,
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
    const mockPayload = {
      id: 'pr-123',
      body: {
        detail_ids: ['detail-1', 'detail-2'],
      },
      user_id: 'user-123',
      bu_code: 'BU001',
      tenant_id: 'BU001',
      request_id: 'req-123',
      ip_address: '127.0.0.1',
      user_agent: 'test-agent',
    };

    it('should successfully split a purchase request', async () => {
      const mockResult = Result.ok({
        original_pr_id: 'pr-123',
        new_pr_id: 'new-pr-456',
        new_pr_no: 'PR2501-0002',
        split_detail_count: 2,
      });

      mockPurchaseRequestService.splitPr.mockResolvedValue(mockResult);

      const result = await controller.splitPr(mockPayload);

      expect(mockPurchaseRequestService.splitPr).toHaveBeenCalledWith(
        'pr-123',
        ['detail-1', 'detail-2'],
        'user-123',
        'BU001',
      );
      expect(result.response.status).toBe(HttpStatus.OK);
      expect(result.data.new_pr_id).toBe('new-pr-456');
      expect(result.data.split_detail_count).toBe(2);
    });

    it('should handle error when PR not found', async () => {
      const mockResult = Result.error('Purchase request not found', 3); // ErrorCode.NOT_FOUND

      mockPurchaseRequestService.splitPr.mockResolvedValue(mockResult);

      const result = await controller.splitPr(mockPayload);

      expect(mockPurchaseRequestService.splitPr).toHaveBeenCalled();
      expect(result.response.status).toBe(HttpStatus.NOT_FOUND);
      expect(result.response.message).toBe('Purchase request not found');
    });

    it('should handle error when no valid detail IDs provided', async () => {
      const mockResult = Result.error('No valid detail IDs provided for split', 1); // ErrorCode.INVALID_ARGUMENT

      mockPurchaseRequestService.splitPr.mockResolvedValue(mockResult);

      const result = await controller.splitPr({
        ...mockPayload,
        body: { detail_ids: ['non-existent-id'] },
      });

      expect(result.response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.response.message).toBe('No valid detail IDs provided for split');
    });

    it('should handle error when trying to split all details', async () => {
      const mockResult = Result.error('Cannot split all details. At least one detail must remain in the original PR', 1);

      mockPurchaseRequestService.splitPr.mockResolvedValue(mockResult);

      const result = await controller.splitPr(mockPayload);

      expect(result.response.status).toBe(HttpStatus.BAD_REQUEST);
      expect(result.response.message).toBe('Cannot split all details. At least one detail must remain in the original PR');
    });

    it('should pass correct parameters to service', async () => {
      const mockResult = Result.ok({
        original_pr_id: 'pr-123',
        new_pr_id: 'new-pr-789',
        new_pr_no: 'draft-20250115',
        split_detail_count: 3,
      });

      mockPurchaseRequestService.splitPr.mockResolvedValue(mockResult);

      const customPayload = {
        id: 'custom-pr-id',
        body: {
          detail_ids: ['d1', 'd2', 'd3'],
        },
        user_id: 'custom-user',
        bu_code: 'CUSTOM_BU',
        tenant_id: 'CUSTOM_BU',
        request_id: 'req-456',
        ip_address: '192.168.1.1',
        user_agent: 'custom-agent',
      };

      await controller.splitPr(customPayload);

      expect(mockPurchaseRequestService.splitPr).toHaveBeenCalledWith(
        'custom-pr-id',
        ['d1', 'd2', 'd3'],
        'custom-user',
        'CUSTOM_BU',
      );
    });
  });
});
