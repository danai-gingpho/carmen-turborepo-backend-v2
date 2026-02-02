import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseRequestService } from './purchase-request.service';
import { of } from 'rxjs';
import { HttpStatus } from '@nestjs/common';

const mockProcurementService = {
  send: jest.fn(),
  emit: jest.fn(),
};

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestService,
        {
          provide: 'PROCUREMENT_SERVICE',
          useValue: mockProcurementService,
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
    const mockId = 'pr-123';
    const mockBody = { detail_ids: ['detail-1', 'detail-2'] };
    const mockUserId = 'user-123';
    const mockBuCode = 'BU001';
    const mockVersion = 'latest';

    it('should successfully split a purchase request', async () => {
      const mockResponse = {
        response: { status: HttpStatus.OK },
        data: {
          original_pr_id: 'pr-123',
          new_pr_id: 'new-pr-456',
          new_pr_no: 'PR2501-0002',
          split_detail_count: 2,
        },
      };

      mockProcurementService.send.mockReturnValue(of(mockResponse));

      const result = await service.splitPr(mockId, mockBody, mockUserId, mockBuCode, mockVersion);

      expect(mockProcurementService.send).toHaveBeenCalledWith(
        { cmd: 'purchase-request.split', service: 'purchase-request' },
        {
          id: mockId,
          body: mockBody,
          user_id: mockUserId,
          bu_code: mockBuCode,
          version: mockVersion,
        },
      );
      expect(result.isOk()).toBe(true);
      expect(result.value).toEqual(mockResponse.data);
    });

    it('should return error when microservice returns error', async () => {
      const mockResponse = {
        response: {
          status: HttpStatus.NOT_FOUND,
          message: 'Purchase request not found',
        },
        data: null,
      };

      mockProcurementService.send.mockReturnValue(of(mockResponse));

      const result = await service.splitPr(mockId, mockBody, mockUserId, mockBuCode, mockVersion);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toBe('Purchase request not found');
    });

    it('should return error when invalid argument', async () => {
      const mockResponse = {
        response: {
          status: HttpStatus.BAD_REQUEST,
          message: 'No valid detail IDs provided for split',
        },
        data: null,
      };

      mockProcurementService.send.mockReturnValue(of(mockResponse));

      const result = await service.splitPr(mockId, { detail_ids: [] }, mockUserId, mockBuCode, mockVersion);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toBe('No valid detail IDs provided for split');
    });

    it('should pass correct parameters to microservice', async () => {
      const mockResponse = {
        response: { status: HttpStatus.OK },
        data: {
          original_pr_id: 'pr-999',
          new_pr_id: 'new-pr-111',
          new_pr_no: 'draft-123',
          split_detail_count: 3,
        },
      };

      mockProcurementService.send.mockReturnValue(of(mockResponse));

      await service.splitPr('pr-999', { detail_ids: ['a', 'b', 'c'] }, 'user-999', 'BU999', 'v2');

      expect(mockProcurementService.send).toHaveBeenCalledWith(
        { cmd: 'purchase-request.split', service: 'purchase-request' },
        {
          id: 'pr-999',
          body: { detail_ids: ['a', 'b', 'c'] },
          user_id: 'user-999',
          bu_code: 'BU999',
          version: 'v2',
        },
      );
    });
  });
});
