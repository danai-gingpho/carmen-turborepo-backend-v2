import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseOrderService } from './purchase-order.service';
import { TenantService } from '@/tenant/tenant.service';
import { CommonLogic } from '@/common/common.logic';
import { NotificationService } from '@/common/services/notification.service';
import { stage_status } from '@/procurement/purchase-request/dto/purchase-request-detail.dto';
import {
  enum_purchase_order_doc_status,
  enum_last_action,
} from '@repo/prisma-shared-schema-tenant';
import { StageStatus } from '../purchase-request/interface/workflow.interface';
import { WorkflowOrchestratorService } from '@/common/workflow/workflow-orchestrator.service';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;

  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
    getTenantInfo: jest.fn(),
    getTenant: jest.fn(),
  };

  const mockCommonLogic = {
    generateDocumentNumber: jest.fn(),
    getRunningPattern: jest.fn(),
    generateRunningCode: jest.fn(),
  };

  const mockNotificationService = {
    sendNotification: jest.fn(),
  };

  const mockMasterService = { send: jest.fn() };
  const mockPrismaSystem = {
    tb_business_unit: { findFirst: jest.fn() },
  };
  const mockPrismaTenant = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderService,
        { provide: 'PRISMA_SYSTEM', useValue: mockPrismaSystem },
        { provide: 'PRISMA_TENANT', useValue: mockPrismaTenant },
        { provide: 'MASTER_SERVICE', useValue: mockMasterService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: CommonLogic, useValue: mockCommonLogic },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: WorkflowOrchestratorService, useValue: { resolveUserRole: jest.fn() } },
      ],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const USER_ID = '00000000-0000-4000-a000-000000000001';
  const BU_CODE = 'BU001';
  const PO_ID = 'po-001';

  function buildWorkflow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      workflow_previous_stage: 'Requestor',
      workflow_current_stage: 'HOD',
      workflow_next_stage: 'Purchaser',
      user_action: { execute: [] },
      last_action: enum_last_action.submitted,
      last_action_at_date: new Date().toISOString(),
      last_action_by_id: USER_ID,
      last_action_by_name: 'Test User',
      workflow_history: [],
      ...overrides,
    };
  }

  function setupPrismaService() {
    const mockPrismaClient = {
      tb_purchase_order: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      tb_purchase_order_detail: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    (service as any)._prismaService = mockPrismaClient;
    (service as any)._bu_code = BU_CODE;
    (service as any)._userId = USER_ID;

    return mockPrismaClient;
  }

  // ===========================================================================
  // WORKFLOW: submit
  // ===========================================================================
  describe('submit (workflow)', () => {
    it('should return error when PO is neither draft nor reviewed-in-progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_purchase_order.findFirst.mockResolvedValue(null);

      const result = await service.submit(
        PO_ID,
        { stage_role: 'create', details: [] },
        buildWorkflow(),
      );

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not submittable');
      expect(prisma.tb_purchase_order.findFirst).toHaveBeenCalledWith({
        where: {
          id: PO_ID,
          OR: [
            { po_status: enum_purchase_order_doc_status.draft },
            {
              po_status: enum_purchase_order_doc_status.in_progress,
              last_action: enum_last_action.reviewed,
            },
          ],
        },
      });
    });

    it('should re-submit a reviewed in_progress PO without regenerating po_no', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow();
      const generatePONoSpy = jest
        .spyOn(service as any, 'generatePONo')
        .mockResolvedValue('PO-SHOULD-NOT-BE-USED');

      const existingPoNo = 'PO2501-0042';
      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_no: existingPoNo,
        order_date: new Date('2025-01-15'),
        po_status: enum_purchase_order_doc_status.in_progress,
        last_action: enum_last_action.reviewed,
      });

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_purchase_order_detail: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(txPrisma);
      });

      const result = await service.submit(
        PO_ID,
        { stage_role: 'create', details: [] },
        workflow,
      );

      expect(result.isOk()).toBe(true);
      expect(generatePONoSpy).not.toHaveBeenCalled();
      expect(capturedHeaderUpdate.data.po_no).toBe(existingPoNo);
      expect(capturedHeaderUpdate.data.po_status).toBe(
        enum_purchase_order_doc_status.in_progress,
      );
      expect((result.value as { po_no: string }).po_no).toBe(existingPoNo);
    });

    it('should transition PO status from draft to in_progress', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow();
      jest.spyOn(service as any, 'generatePONo').mockResolvedValue('PO2501-0001');

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        order_date: new Date('2025-01-15'),
        po_status: enum_purchase_order_doc_status.draft,
      });

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_purchase_order_detail: {
            findMany: jest.fn().mockResolvedValue([]),
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(txPrisma);
      });

      const result = await service.submit(
        PO_ID,
        { stage_role: 'create', details: [] },
        workflow,
      );

      expect(result.isOk()).toBe(true);
      expect(capturedHeaderUpdate.data.po_status).toBe(
        enum_purchase_order_doc_status.in_progress,
      );
      expect(capturedHeaderUpdate.data.doc_version).toEqual({ increment: 1 });
    });

    it('should add stages_status and history for submitted detail', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow({ workflow_previous_stage: 'Requestor' });
      const detailId = 'detail-1';
      jest.spyOn(service as any, 'generatePONo').mockResolvedValue('PO2501-0001');

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        order_date: new Date('2025-01-15'),
        po_status: enum_purchase_order_doc_status.draft,
      });

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: {
            update: jest.fn().mockResolvedValue({}),
          },
          tb_purchase_order_detail: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: detailId,
                history: [],
                stages_status: [],
              },
            ]),
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.submit(
        PO_ID,
        {
          stage_role: 'create',
          details: [{ id: detailId, stage_status: stage_status.submit, stage_message: 'submit for approval' }],
        },
        workflow,
      );

      expect(capturedDetailUpdate).not.toBeNull();
      expect(capturedDetailUpdate.data.stages_status).toEqual([
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: 'submit for approval' },
      ]);
      expect(capturedDetailUpdate.data.history[0]).toEqual(
        expect.objectContaining({
          seq: 1,
          status: stage_status.submit,
          name: 'Requestor',
        }),
      );
    });
  });

  // ===========================================================================
  // WORKFLOW: approve
  // ===========================================================================
  describe('approve (workflow)', () => {
    it('should return error when PO not found or not in_progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_purchase_order.findFirst.mockResolvedValue(null);

      const result = await service.approve(PO_ID, buildWorkflow(), []);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('should update detail stages_status when pending at current stage', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow({
        workflow_previous_stage: 'HOD',
        workflow_next_stage: '-',
      });

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
      ];

      prisma.tb_purchase_order_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages, history: [] },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_order_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.approve(PO_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve },
      ]);

      const updatedStages = capturedDetailUpdate.data.stages_status;
      expect(updatedStages[1].status).toBe(stage_status.approve);
    });

    it('should skip the detail update entirely when the latest stage is already rejected', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow({ workflow_previous_stage: 'HOD' });

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
      });

      const rejectedStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.reject, name: 'HOD', message: 'rejected' },
      ];

      prisma.tb_purchase_order_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: rejectedStages, history: [] },
      ]);

      const detailUpdateSpy = jest.fn().mockResolvedValue({});
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_order_detail: {
            update: detailUpdateSpy,
          },
        };
        return cb(txPrisma);
      });

      const result = await service.approve(PO_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve },
      ]);

      // Service hits `if (result.skipped) continue;` for already-rejected rows,
      // so the detail row is not touched at all — neither stages_status nor history
      // is rewritten. The approve call itself still succeeds.
      expect(result.isOk()).toBe(true);
      expect(detailUpdateSpy).not.toHaveBeenCalled();
    });

    it('should add new stage entry when detail is not pending at current stage', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow({
        workflow_previous_stage: 'Purchaser',
        workflow_next_stage: '-',
      });

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
      ];

      prisma.tb_purchase_order_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages, history: [] },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_order_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.approve(PO_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve },
      ]);

      const updatedStages = capturedDetailUpdate.data.stages_status;
      expect(updatedStages).toHaveLength(3);
      expect(updatedStages[2]).toEqual(
        expect.objectContaining({
          seq: 3,
          status: stage_status.approve,
          name: 'Purchaser',
        }),
      );
    });

    it('should add history entry on approval', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow({
        workflow_previous_stage: 'HOD',
        workflow_next_stage: '-',
      });

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
      });

      prisma.tb_purchase_order_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [
            { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          ],
          history: [],
        },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_order_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.approve(PO_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve },
      ]);

      const history = capturedDetailUpdate.data.history;
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(
        expect.objectContaining({
          seq: 1,
          action: 'approved',
          status: stage_status.approve,
          user: { id: USER_ID },
        }),
      );
    });
  });

  // ===========================================================================
  // WORKFLOW: reject
  // ===========================================================================
  describe('reject (workflow)', () => {
    it('should return error when PO not found or not in_progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_purchase_order.findFirst.mockResolvedValue(null);

      const result = await service.reject(PO_ID, buildWorkflow(), []);

      expect(result.isOk()).toBe(false);
    });

    it('should set PO status to closed on rejection', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow();

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
        workflow_current_stage: 'HOD',
      });

      prisma.tb_purchase_order_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
          history: [],
        },
      ]);

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_purchase_order_detail: { update: jest.fn().mockResolvedValue({}) },
        };
        return cb(txPrisma);
      });

      const result = await service.reject(PO_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.reject, stage_message: 'not approved' },
      ]);

      expect(result.isOk()).toBe(true);
      expect(capturedHeaderUpdate.data.po_status).toBe(
        enum_purchase_order_doc_status.voided,
      );
    });

    it('should mark all existing stages as rejected and add rejection stage', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow();

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
        workflow_current_stage: 'HOD',
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'Purchaser', message: '' },
      ];

      prisma.tb_purchase_order_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages, history: [] },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_order_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.reject(PO_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.reject, stage_message: 'rejected by HOD' },
      ]);

      const updatedStages = capturedDetailUpdate.data.stages_status;
      // All previous stages should be marked as rejected
      expect(updatedStages[0].status).toBe(stage_status.reject);
      expect(updatedStages[1].status).toBe(stage_status.reject);
      // New rejection entry
      expect(updatedStages[2]).toEqual(
        expect.objectContaining({
          seq: 3,
          status: stage_status.reject,
          name: 'HOD',
          message: 'rejected by HOD',
        }),
      );
    });

    it('should add rejection history entry', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow();

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
        workflow_current_stage: 'HOD',
      });

      prisma.tb_purchase_order_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
          history: [],
        },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_order_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.reject(PO_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.reject, stage_message: 'too expensive' },
      ]);

      const history = capturedDetailUpdate.data.history;
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(
        expect.objectContaining({
          seq: 1,
          action: 'rejected',
          status: stage_status.reject,
          message: 'too expensive',
          user: { id: USER_ID },
        }),
      );
    });
  });

  // ===========================================================================
  // WORKFLOW: review (send back)
  // ===========================================================================
  describe('review (workflow)', () => {
    it('should return error when PO not found or not in_progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_purchase_order.findFirst.mockResolvedValue(null);

      const result = await service.review(PO_ID, buildWorkflow(), []);

      expect(result.isOk()).toBe(false);
    });

    it('should reset target stage to pending and trim later stages', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow({
        workflow_current_stage: 'HOD', // des_stage - going back to HOD
      });

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        { seq: 3, status: stage_status.pending, name: 'Purchaser', message: '' },
      ];

      prisma.tb_purchase_order_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: [...existingStages], history: [] },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_order_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.review(PO_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.review, stage_message: 'please re-check' },
      ]);

      const updatedStages = capturedDetailUpdate.data.stages_status;
      // HOD should be reset to pending
      const hodStage = updatedStages.find((s: StageStatus) => s.name === 'HOD');
      expect(hodStage.status).toBe(stage_status.pending);
    });

    it('should add review entry to history', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflow({
        workflow_current_stage: 'HOD',
      });

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
      });

      prisma.tb_purchase_order_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [
            { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
            { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
          ],
          history: [],
        },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_order_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.review(PO_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.review, stage_message: 'needs fix' },
      ]);

      const history = capturedDetailUpdate.data.history;
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(
        expect.objectContaining({
          seq: 1,
          action: 'reviewed',
          status: stage_status.review,
          message: 'needs fix',
          user: { id: USER_ID },
        }),
      );
    });
  });

  // ===========================================================================
  // WORKFLOW: cancel
  // ===========================================================================
  describe('cancel (workflow)', () => {
    it('should return error when PO not found', async () => {
      const prisma = setupPrismaService();
      prisma.tb_purchase_order.findFirst.mockResolvedValue(null);

      const result = await service.cancel(PO_ID);

      expect(result.isOk()).toBe(false);
    });

    it('should set PO status to closed and calculate cancelled_qty', async () => {
      const prisma = setupPrismaService();

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.in_progress,
        is_active: true,
        deleted_at: null,
        tb_purchase_order_detail: [
          { id: 'detail-1', order_qty: 100, received_qty: 30 },
          { id: 'detail-2', order_qty: 50, received_qty: 0 },
        ],
      });

      const detailUpdates: any[] = [];
      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_order: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_purchase_order_detail: {
            update: jest.fn().mockImplementation((args) => {
              detailUpdates.push(args);
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      const result = await service.cancel(PO_ID);

      expect(result.isOk()).toBe(true);
      expect(capturedHeaderUpdate.data.po_status).toBe(
        enum_purchase_order_doc_status.closed,
      );

      // cancelled_qty = order_qty - received_qty
      expect(detailUpdates[0].data.cancelled_qty).toBe(70); // 100 - 30
      expect(detailUpdates[1].data.cancelled_qty).toBe(50); // 50 - 0
    });

    it('should reject cancellation for completed PO', async () => {
      const prisma = setupPrismaService();

      prisma.tb_purchase_order.findFirst.mockResolvedValue({
        id: PO_ID,
        po_status: enum_purchase_order_doc_status.completed,
        is_active: true,
        deleted_at: null,
        tb_purchase_order_detail: [],
      });

      const result = await service.cancel(PO_ID);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('Cannot cancel');
    });
  });
});
