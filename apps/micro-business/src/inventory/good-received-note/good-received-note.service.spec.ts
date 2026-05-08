import { Test, TestingModule } from '@nestjs/testing';
import { GoodReceivedNoteService } from './good-received-note.service';
import { TenantService } from '@/tenant/tenant.service';
import { NotificationService } from '@/common';
import { InventoryTransactionService } from '@/inventory/inventory-transaction/inventory-transaction.service';
import { enum_good_received_note_status } from '@repo/prisma-shared-schema-tenant';

// =============================================================================
// Error / data-integrity tests for GRN service.
// Focus: status guards, soft-delete filtering, void semantics, BUG documentation
// for paths with no validation. Happy paths intentionally omitted.
// =============================================================================
describe('GoodReceivedNoteService', () => {
  let service: GoodReceivedNoteService;

  const USER_ID = 'user-1';
  const TENANT_ID = 'BU001';
  const GRN_ID = 'grn-1';
  const DETAIL_ID = 'grn-detail-1';

  const mockPrismaSystem = {};
  const mockPrismaTenant = jest.fn();
  const mockMasterService = { send: jest.fn(), emit: jest.fn() };
  const mockTenantService = {
    getdb_connection: jest.fn(),
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getTenant: jest.fn(),
  };
  const mockNotificationService = { sendNotification: jest.fn() };
  const mockInventoryTransactionService = {
    createFromGoodReceivedNote: jest.fn(),
    executeAdjustmentIn: jest.fn(),
    getCalculationMethod: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoodReceivedNoteService,
        { provide: 'PRISMA_SYSTEM', useValue: mockPrismaSystem },
        { provide: 'PRISMA_TENANT', useValue: mockPrismaTenant },
        { provide: 'MASTER_SERVICE', useValue: mockMasterService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: InventoryTransactionService, useValue: mockInventoryTransactionService },
      ],
    }).compile();

    service = module.get<GoodReceivedNoteService>(GoodReceivedNoteService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function buildPrismaMock() {
    return {
      tb_good_received_note: {
        findFirst: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      tb_good_received_note_detail: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _max: { sequence_no: 0 } }),
      },
      tb_good_received_note_detail_item: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
  }

  /**
   * Wires the service so it always has a tenant + a fresh prisma mock.
   * Returns the prisma mock for further configuration.
   */
  function wireTenant(prisma: any = buildPrismaMock()) {
    mockTenantService.getdb_connection.mockResolvedValue({
      tenant_id: 'tenant-1',
      db_connection: 'conn',
    });
    mockPrismaTenant.mockResolvedValue(prisma);
    return prisma;
  }

  // ===========================================================================
  // delete() — line 1307
  // ===========================================================================
  describe('delete()', () => {
    it('returns error when tenant not found', async () => {
      mockTenantService.getdb_connection.mockResolvedValue(null);
      const result = await service.delete(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Tenant not found');
    });

    it('returns error when GRN not found', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue(null);
      const result = await service.delete(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('rejects deleting a non-draft (saved) GRN — line 1334', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue({
        id: GRN_ID,
        doc_status: enum_good_received_note_status.saved,
      });
      const result = await service.delete(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Only draft');
    });

    it('rejects deleting a committed GRN', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue({
        id: GRN_ID,
        doc_status: enum_good_received_note_status.committed,
      });
      const result = await service.delete(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Only draft');
    });

    it('queries with deleted_at: null (soft-delete filter)', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue(null);
      await service.delete(GRN_ID, USER_ID, TENANT_ID);
      expect(prisma.tb_good_received_note.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: GRN_ID, deleted_at: null }),
        }),
      );
    });
  });

  // ===========================================================================
  // voidGrnById() — line 1404
  // ===========================================================================
  describe('voidGrnById()', () => {
    it('returns error when tenant not found', async () => {
      mockTenantService.getdb_connection.mockResolvedValue(null);
      const result = await service.voidGrnById(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Tenant not found');
    });

    it('returns error when GRN not found', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue(null);
      const result = await service.voidGrnById(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('rejects voiding an already-voided GRN — line 1414', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue({
        id: GRN_ID,
        doc_status: enum_good_received_note_status.voided,
      });
      const result = await service.voidGrnById(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('already voided');
    });

    // BUG: voidGrnById() lets a *committed* GRN be voided WITHOUT reversing
    // any inventory transactions or PO received_qty. The on-hand stock layers
    // created by the GRN become orphaned and the linked PO is never rolled
    // back to "partial". This test pins the current (incorrect) behavior so
    // any future fix surfaces in code review. See plan A1.
    it('BUG: allows voiding a committed GRN without reversing inventory', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue({
        id: GRN_ID,
        doc_status: enum_good_received_note_status.committed,
        note: 'original note',
      });

      const result = await service.voidGrnById(GRN_ID, USER_ID, TENANT_ID);

      // Today: succeeds.
      expect(result.isOk()).toBe(true);
      // And it does NOT call the inventory-transaction service to reverse layers.
      expect(
        mockInventoryTransactionService.createFromGoodReceivedNote,
      ).not.toHaveBeenCalled();
      // The status update is the only mutation: voided.
      expect(prisma.tb_good_received_note.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: GRN_ID },
          data: expect.objectContaining({
            doc_status: enum_good_received_note_status.voided,
          }),
        }),
      );
    });
  });

  // ===========================================================================
  // createDetail() — line 1860
  // ===========================================================================
  describe('createDetail()', () => {
    const PAYLOAD: any = {
      product_id: 'p-1',
      location_id: 'loc-1',
      received_qty: 1,
    };

    it('returns error when tenant not found', async () => {
      mockTenantService.getdb_connection.mockResolvedValue(null);
      const result = await service.createDetail(GRN_ID, PAYLOAD, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Tenant not found');
    });

    it('returns error when GRN not found', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue(null);
      const result = await service.createDetail(GRN_ID, PAYLOAD, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('rejects adding a detail to a non-draft GRN — line 1891', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue({
        id: GRN_ID,
        doc_status: enum_good_received_note_status.committed,
      });
      const result = await service.createDetail(GRN_ID, PAYLOAD, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('non-draft');
    });
  });

  // ===========================================================================
  // updateDetail() — line 1968
  // ===========================================================================
  describe('updateDetail()', () => {
    const PAYLOAD: any = { received_qty: 5 };

    it('returns error when tenant not found', async () => {
      mockTenantService.getdb_connection.mockResolvedValue(null);
      const result = await service.updateDetail(DETAIL_ID, PAYLOAD, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Tenant not found');
    });

    it('returns error when detail not found', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note_detail.findFirst.mockResolvedValue(null);
      const result = await service.updateDetail(DETAIL_ID, PAYLOAD, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('rejects updating a detail of a non-draft GRN — line 1999', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note_detail.findFirst.mockResolvedValue({
        id: DETAIL_ID,
        tb_good_received_note: {
          doc_status: enum_good_received_note_status.saved,
        },
        tb_good_received_note_detail_item: [],
      });
      const result = await service.updateDetail(DETAIL_ID, PAYLOAD, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('non-draft');
    });
  });

  // ===========================================================================
  // deleteDetail() — line 2069
  // ===========================================================================
  describe('deleteDetail()', () => {
    it('returns error when tenant not found', async () => {
      mockTenantService.getdb_connection.mockResolvedValue(null);
      const result = await service.deleteDetail(DETAIL_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Tenant not found');
    });

    it('returns error when detail not found', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note_detail.findFirst.mockResolvedValue(null);
      const result = await service.deleteDetail(DETAIL_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('rejects deleting a detail of a non-draft GRN — line 2099', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note_detail.findFirst.mockResolvedValue({
        id: DETAIL_ID,
        tb_good_received_note: {
          doc_status: enum_good_received_note_status.committed,
        },
        tb_good_received_note_detail_item: [],
      });
      const result = await service.deleteDetail(DETAIL_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('non-draft');
    });
  });

  // ===========================================================================
  // findOne() — soft-delete filter regression test
  // ===========================================================================
  describe('findOne()', () => {
    it('passes deleted_at: null in the where clause', async () => {
      const prisma = wireTenant();
      prisma.tb_good_received_note.findFirst.mockResolvedValue(null);
      await service.findOne(GRN_ID, USER_ID, TENANT_ID);
      expect(prisma.tb_good_received_note.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: GRN_ID, deleted_at: null }),
        }),
      );
    });

    it('returns error when tenant not found', async () => {
      mockTenantService.getdb_connection.mockResolvedValue(null);
      const result = await service.findOne(GRN_ID, USER_ID, TENANT_ID);
      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Tenant not found');
    });
  });
});
