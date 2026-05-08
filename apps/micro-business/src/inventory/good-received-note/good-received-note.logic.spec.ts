import { Test, TestingModule } from '@nestjs/testing';
import { GoodReceivedNoteLogic } from './good-received-note.logic';
import { GoodReceivedNoteService } from './good-received-note.service';
import { InventoryTransactionService } from '@/inventory/inventory-transaction/inventory-transaction.service';
import { NotificationService } from '@/common';
import {
  enum_good_received_note_status,
  enum_good_received_note_type,
  enum_purchase_order_doc_status,
} from '@repo/prisma-shared-schema-tenant';

// =============================================================================
// Error / data-integrity tests for GoodReceivedNoteLogic.
// Focus: status guards on save / commit / approve / reject, partial-failure
// rollback, PO status boundary in updatePoStatuses, and BUG documentation
// for the over-receive path that has no validation.
// =============================================================================
describe('GoodReceivedNoteLogic', () => {
  let logic: GoodReceivedNoteLogic;

  const USER_ID = 'user-1';
  const TENANT_ID = 'BU001';
  const GRN_ID = 'grn-1';

  const mockGrnService = {
    getPrismaClient: jest.fn(),
    findGrnWithDetails: jest.fn(),
    findGrnForReject: jest.fn(),
    voidGrn: jest.fn(),
    updateGrnStatus: jest.fn(),
    incrementJunctionReceivedQty: jest.fn(),
    incrementPoDetailReceivedQty: jest.fn(),
    getPoDetailsByIds: jest.fn(),
    getPoDetailsForStatus: jest.fn(),
    updatePoStatus: jest.fn(),
  };

  const mockInventoryTransactionService = {
    createFromGoodReceivedNote: jest.fn(),
  };

  const mockNotificationService = {
    sendGRNNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodReceivedNoteLogic,
        { provide: GoodReceivedNoteService, useValue: mockGrnService },
        { provide: InventoryTransactionService, useValue: mockInventoryTransactionService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    logic = module.get<GoodReceivedNoteLogic>(GoodReceivedNoteLogic);
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  /** Build a Prisma mock with a `$transaction` that just invokes the callback. */
  function buildPrismaMock(transactionImpl?: (cb: (tx: any) => any) => any) {
    return {
      $transaction:
        transactionImpl ??
        jest.fn(async (cb: any) => cb({})),
    };
  }

  function wirePrisma(prisma: any = buildPrismaMock()) {
    mockGrnService.getPrismaClient.mockResolvedValue(prisma);
    return prisma;
  }

  function buildGrn(overrides: Partial<Record<string, any>> = {}) {
    return {
      id: GRN_ID,
      grn_no: 'GRN-2025-0001',
      grn_date: new Date('2025-01-15'),
      doc_status: enum_good_received_note_status.draft,
      doc_type: enum_good_received_note_type.purchase_order,
      note: null,
      created_by_id: 'creator-1',
      vendor_id: 'v-1',
      vendor_name: 'Vendor',
      tb_good_received_note_detail: [],
      ...overrides,
    };
  }

  // ===========================================================================
  // save()
  // ===========================================================================
  describe('save()', () => {
    it('returns error when tenant not found', async () => {
      mockGrnService.getPrismaClient.mockResolvedValue(null);
      const result = await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Tenant not found');
    });

    it('returns error when GRN not found', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(null);
      const result = await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('rejects saving a GRN that is already saved (line 41)', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(
        buildGrn({ doc_status: enum_good_received_note_status.saved }),
      );
      const result = await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Only draft');
    });

    it('rejects saving a committed GRN', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(
        buildGrn({ doc_status: enum_good_received_note_status.committed }),
      );
      const result = await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Only draft');
    });

    it('rolls back when inventory transaction creation fails (atomic save)', async () => {
      wirePrisma();

      // Non-empty details so createFromGoodReceivedNote is actually called.
      mockGrnService.findGrnWithDetails.mockResolvedValue(
        buildGrn({
          tb_good_received_note_detail: [
            {
              id: 'd-1',
              product_id: 'p-1',
              location_id: 'loc-1',
              location_code: 'L1',
              tb_good_received_note_detail_item: [
                {
                  id: 'item-1',
                  received_base_qty: 1,
                  base_net_amount: 100,
                  received_qty: 1,
                  purchase_order_detail_purchase_request_detail_id: null,
                },
              ],
            },
          ],
        }),
      );
      mockInventoryTransactionService.createFromGoodReceivedNote.mockRejectedValueOnce(
        new Error('cost layer write failed'),
      );

      const result = await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);

      expect(result.isOk()).toBe(false);
      // PO rollup must NOT have run because the inventory step threw first.
      expect(mockGrnService.incrementJunctionReceivedQty).not.toHaveBeenCalled();
      expect(mockGrnService.incrementPoDetailReceivedQty).not.toHaveBeenCalled();
    });

    it('skips PO rollup when GRN doc_type is not purchase_order', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(
        buildGrn({ doc_type: enum_good_received_note_type.manual }),
      );

      await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);

      expect(mockGrnService.incrementJunctionReceivedQty).not.toHaveBeenCalled();
      expect(mockGrnService.incrementPoDetailReceivedQty).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // commit()
  // ===========================================================================
  describe('commit()', () => {
    it('rejects committing a draft GRN — line 80', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(
        buildGrn({ doc_status: enum_good_received_note_status.draft }),
      );
      const result = await logic.commit(GRN_ID, {}, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Only saved');
    });

    it('rejects committing an already-committed GRN', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(
        buildGrn({ doc_status: enum_good_received_note_status.committed }),
      );
      const result = await logic.commit(GRN_ID, {}, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Only saved');
    });

    it('moves a saved GRN to committed', async () => {
      const prisma = wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(
        buildGrn({ doc_status: enum_good_received_note_status.saved }),
      );
      const result = await logic.commit(GRN_ID, {}, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(true);
      expect(mockGrnService.updateGrnStatus).toHaveBeenCalledWith(
        expect.anything(),
        GRN_ID,
        enum_good_received_note_status.committed,
        USER_ID,
      );
    });
  });

  // ===========================================================================
  // approve()
  // ===========================================================================
  describe('approve()', () => {
    it('rejects approving a draft GRN', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(buildGrn());
      const result = await logic.approve(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Only saved');
    });

    it('rejects approving an already-committed GRN', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(
        buildGrn({ doc_status: enum_good_received_note_status.committed }),
      );
      const result = await logic.approve(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Only saved');
    });
  });

  // ===========================================================================
  // reject()
  // ===========================================================================
  describe('reject()', () => {
    it('returns error when GRN not found', async () => {
      wirePrisma();
      mockGrnService.findGrnForReject.mockResolvedValue(null);
      const result = await logic.reject(GRN_ID, 'no good', USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('rejects rejecting a committed GRN — only draft/saved allowed', async () => {
      wirePrisma();
      mockGrnService.findGrnForReject.mockResolvedValue(
        buildGrn({ doc_status: enum_good_received_note_status.committed }),
      );
      const result = await logic.reject(GRN_ID, 'too late', USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Only draft or saved');
      expect(mockGrnService.voidGrn).not.toHaveBeenCalled();
    });

    it('rejects rejecting an already-voided GRN', async () => {
      wirePrisma();
      mockGrnService.findGrnForReject.mockResolvedValue(
        buildGrn({ doc_status: enum_good_received_note_status.voided }),
      );
      const result = await logic.reject(GRN_ID, '', USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(mockGrnService.voidGrn).not.toHaveBeenCalled();
    });

    it('voids a draft GRN and notifies the creator', async () => {
      wirePrisma();
      mockGrnService.findGrnForReject.mockResolvedValue(buildGrn());
      const result = await logic.reject(GRN_ID, 'wrong items', USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(true);
      expect(mockGrnService.voidGrn).toHaveBeenCalledWith(
        expect.anything(),
        GRN_ID,
        'wrong items',
        null,
        USER_ID,
      );
      expect(mockNotificationService.sendGRNNotification).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // updatePurchaseOrderReceiving / updatePoStatuses (exercised via save())
  // Focus on PO rollup boundary cases.
  // ===========================================================================
  describe('PO rollup via save()', () => {
    /**
     * Build a GRN with one detail line linked to a PO detail and one item
     * with a junction id and the given received_qty.
     */
    function buildPoGrn(receivedQty: number) {
      return buildGrn({
        tb_good_received_note_detail: [
          {
            id: 'd-1',
            product_id: 'p-1',
            location_id: 'loc-1',
            location_code: 'L1',
            purchase_order_detail_id: 'po-detail-1',
            tb_good_received_note_detail_item: [
              {
                id: 'item-1',
                purchase_order_detail_purchase_request_detail_id: 'junction-1',
                received_qty: receivedQty,
                received_base_qty: receivedQty,
                base_net_amount: 100,
              },
            ],
          },
        ],
      });
    }

    it('skips PO rollup for items with received_qty <= 0 — line 217', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(buildPoGrn(0));
      mockGrnService.getPoDetailsByIds.mockResolvedValue([]);

      await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);

      expect(mockGrnService.incrementJunctionReceivedQty).not.toHaveBeenCalled();
      expect(mockGrnService.incrementPoDetailReceivedQty).not.toHaveBeenCalled();
    });

    it('flips PO to completed when cumulative received >= order_qty - cancelled', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(buildPoGrn(10));
      mockGrnService.getPoDetailsByIds.mockResolvedValue([
        { id: 'po-detail-1', purchase_order_id: 'po-1' },
      ]);
      mockGrnService.getPoDetailsForStatus.mockResolvedValue([
        { order_qty: 10, received_qty: 10, cancelled_qty: 0 },
      ]);

      await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);

      expect(mockGrnService.updatePoStatus).toHaveBeenCalledWith(
        expect.anything(),
        'po-1',
        enum_purchase_order_doc_status.completed,
        USER_ID,
      );
    });

    it('keeps PO at partial when cumulative received < order_qty', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(buildPoGrn(5));
      mockGrnService.getPoDetailsByIds.mockResolvedValue([
        { id: 'po-detail-1', purchase_order_id: 'po-1' },
      ]);
      mockGrnService.getPoDetailsForStatus.mockResolvedValue([
        { order_qty: 10, received_qty: 5, cancelled_qty: 0 },
      ]);

      await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);

      expect(mockGrnService.updatePoStatus).toHaveBeenCalledWith(
        expect.anything(),
        'po-1',
        enum_purchase_order_doc_status.partial,
        USER_ID,
      );
    });

    // BUG: there is no over-receive guard. A GRN with received_qty > order_qty
    // is silently accepted, the PO is marked "completed", and the purchase
    // order's received_qty exceeds its order_qty. This pins the current
    // (incorrect) behavior. See plan A3.
    it('BUG: allows over-receive (received_qty > order_qty) and marks PO completed', async () => {
      wirePrisma();
      mockGrnService.findGrnWithDetails.mockResolvedValue(buildPoGrn(15));
      mockGrnService.getPoDetailsByIds.mockResolvedValue([
        { id: 'po-detail-1', purchase_order_id: 'po-1' },
      ]);
      mockGrnService.getPoDetailsForStatus.mockResolvedValue([
        { order_qty: 10, received_qty: 15, cancelled_qty: 0 },
      ]);

      const result = await logic.save(GRN_ID, {}, USER_ID, TENANT_ID);

      // Today: succeeds (no validation).
      expect(result.isOk()).toBe(true);
      expect(mockGrnService.incrementJunctionReceivedQty).toHaveBeenCalledWith(
        expect.anything(),
        'junction-1',
        15,
        USER_ID,
      );
      expect(mockGrnService.updatePoStatus).toHaveBeenCalledWith(
        expect.anything(),
        'po-1',
        enum_purchase_order_doc_status.completed,
        USER_ID,
      );
    });
  });
});
