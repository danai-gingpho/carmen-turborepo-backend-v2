import { Test, TestingModule } from '@nestjs/testing';
import { StoreRequisitionService } from './store-requisition.service';
import { TenantService } from '@/tenant/tenant.service';
import { stage_status } from '@/procurement/purchase-request/dto/purchase-request-detail.dto';
import {
  enum_doc_status,
  enum_last_action,
} from '@repo/prisma-shared-schema-tenant';
import { StageStatus, WorkflowHeader } from './interface/workflow.interface';
import { WorkflowOrchestratorService } from '@/common/workflow/workflow-orchestrator.service';

describe('StoreRequisitionService', () => {
  let service: StoreRequisitionService;

  const mockPrismaSystem = {
    tb_business_unit: { findFirst: jest.fn() },
  };

  const mockPrismaTenant = jest.fn();
  const mockTenantService = {
    prismaTenantInstance: jest.fn(),
  };
  const mockAuthService = { send: jest.fn() };
  const mockMasterService = { send: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreRequisitionService,
        { provide: 'PRISMA_SYSTEM', useValue: mockPrismaSystem },
        { provide: 'PRISMA_TENANT', useValue: mockPrismaTenant },
        { provide: 'AUTH_SERVICE', useValue: mockAuthService },
        { provide: 'MASTER_SERVICE', useValue: mockMasterService },
        { provide: TenantService, useValue: mockTenantService },
        { provide: WorkflowOrchestratorService, useValue: { resolveUserRole: jest.fn() } },
      ],
    }).compile();

    service = module.get<StoreRequisitionService>(StoreRequisitionService);
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
  const SR_ID = 'sr-001';

  function buildWorkflowHeader(overrides: Partial<WorkflowHeader> = {}): WorkflowHeader {
    return {
      workflow_previous_stage: 'Requestor',
      workflow_current_stage: 'HOD',
      workflow_next_stage: 'Issuer',
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
      tb_store_requisition: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      tb_store_requisition_detail: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      tb_product_location: {
        findMany: jest.fn(),
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
    it('should return error when SR is neither draft nor reviewed-in-progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_store_requisition.findFirst.mockResolvedValue(null);

      const result = await service.submit(
        SR_ID,
        { stage_role: 'create', details: [] },
        buildWorkflowHeader(),
      );

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not submittable');
      expect(prisma.tb_store_requisition.findFirst).toHaveBeenCalledWith({
        where: {
          id: SR_ID,
          OR: [
            { doc_status: enum_doc_status.draft },
            {
              doc_status: enum_doc_status.in_progress,
              last_action: enum_last_action.reviewed,
            },
          ],
        },
      });
    });

    it('should re-submit a reviewed in_progress SR without regenerating sr_no', async () => {
      const prisma = setupPrismaService();
      const workflowHeader = buildWorkflowHeader();
      const generateSRNoSpy = jest
        .spyOn(service as any, 'generateSRNo')
        .mockResolvedValue('SR-SHOULD-NOT-BE-USED');

      const existingSrNo = 'SR2501-0042';
      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        sr_no: existingSrNo,
        sr_date: new Date('2025-01-15'),
        doc_status: enum_doc_status.in_progress,
        last_action: enum_last_action.reviewed,
        to_location_id: null,
      });

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({ id: SR_ID });
            }),
          },
          tb_store_requisition_detail: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(txPrisma);
      });

      // tb_store_requisition_detail.findMany is called outside the transaction
      // for the SR detail iteration; return empty so we exercise only the header path.
      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([]);

      const result = await service.submit(
        SR_ID,
        { stage_role: 'create', details: [] },
        workflowHeader,
      );

      expect(result.isOk()).toBe(true);
      expect(generateSRNoSpy).not.toHaveBeenCalled();
      expect(capturedHeaderUpdate.data.sr_no).toBe(existingSrNo);
      expect(capturedHeaderUpdate.data.doc_status).toBe(
        enum_doc_status.in_progress,
      );
    });

    it('should transition SR status from draft to in_progress', async () => {
      const prisma = setupPrismaService();
      const workflowHeader = buildWorkflowHeader();
      jest.spyOn(service as any, 'generateSRNo').mockResolvedValue('SR2501-0001');

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        sr_date: new Date('2025-01-15'),
        doc_status: enum_doc_status.draft,
        to_location_id: null,
      });

      // generateSRNo is mocked via jest.spyOn above

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([]);

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({ id: SR_ID });
            }),
          },
          tb_store_requisition_detail: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(txPrisma);
      });

      const result = await service.submit(
        SR_ID,
        { stage_role: 'create', details: [] },
        workflowHeader,
      );

      expect(result.isOk()).toBe(true);
      expect(capturedHeaderUpdate.data.doc_status).toBe(enum_doc_status.in_progress);
      expect(capturedHeaderUpdate.data.doc_version).toEqual({ increment: 1 });
    });

    it('should add stages_status and history for first-time submitted detail', async () => {
      const prisma = setupPrismaService();
      const workflowHeader = buildWorkflowHeader({ workflow_previous_stage: 'Requestor' });
      const detailId = 'detail-1';
      jest.spyOn(service as any, 'generateSRNo').mockResolvedValue('SR2501-0001');

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        sr_date: new Date('2025-01-15'),
        doc_status: enum_doc_status.draft,
        to_location_id: null,
      });

      // generateSRNo is mocked via jest.spyOn above

      // Detail with empty stages_status
      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([
        {
          id: detailId,
          stages_status: [],
          history: [],
          requested_qty: 20,
        },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: {
            update: jest.fn().mockResolvedValue({ id: SR_ID }),
          },
          tb_store_requisition_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.submit(
        SR_ID,
        {
          stage_role: 'create',
          details: [{ id: detailId, stage_status: stage_status.submit, stage_message: 'submit for approval' }],
        },
        workflowHeader,
      );

      expect(capturedDetailUpdate).not.toBeNull();
      expect(capturedDetailUpdate.data.stages_status).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            seq: 1,
            status: stage_status.submit,
            name: 'Requestor',
          }),
        ]),
      );
      expect(capturedDetailUpdate.data.history).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            seq: 1,
            status: stage_status.submit,
            name: 'Requestor',
          }),
        ]),
      );
      // approved_qty should be set from requested_qty
      expect(capturedDetailUpdate.data.approved_qty).toBe(20);
    });

    it('should validate products are allowed in destination location', async () => {
      const prisma = setupPrismaService();
      const workflowHeader = buildWorkflowHeader();

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        sr_date: new Date('2025-01-15'),
        doc_status: enum_doc_status.draft,
        to_location_id: 'loc-1',
      });

      // Detail with a product
      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          product_id: 'product-not-allowed',
          product_name: 'Forbidden Product',
          stages_status: [],
          history: [],
          requested_qty: 10,
          deleted_at: null,
        },
      ]);

      // No products allowed in location
      prisma.tb_product_location.findMany.mockResolvedValue([]);

      const result = await service.submit(
        SR_ID,
        {
          stage_role: 'create',
          details: [{ id: 'detail-1', stage_status: stage_status.submit, stage_message: '' }],
        },
        workflowHeader,
      );

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not allowed');
    });
  });

  // ===========================================================================
  // WORKFLOW: approve
  // ===========================================================================
  describe('approve (workflow)', () => {
    it('should return error when SR not found or not in_progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_store_requisition.findFirst.mockResolvedValue(null);

      const result = await service.approve(SR_ID, buildWorkflowHeader(), []);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('should set SR status to completed when workflow_next_stage is "-" (final approval)', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_next_stage: '-',
        workflow_previous_stage: 'HOD',
        last_action: enum_last_action.approved,
      });

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        doc_status: enum_doc_status.in_progress,
      });

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([]);

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_store_requisition_detail: { update: jest.fn().mockResolvedValue({}) },
        };
        return cb(txPrisma);
      });

      const result = await service.approve(SR_ID, workflow, []);

      expect(result.isOk()).toBe(true);
      expect(capturedHeaderUpdate.data.doc_status).toBe(enum_doc_status.completed);
    });

    it('should keep SR status as in_progress when more stages remain', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_next_stage: 'Issuer',
        workflow_previous_stage: 'HOD',
      });

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        doc_status: enum_doc_status.in_progress,
      });

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([]);

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_store_requisition_detail: { update: jest.fn().mockResolvedValue({}) },
        };
        return cb(txPrisma);
      });

      await service.approve(SR_ID, workflow, []);

      expect(capturedHeaderUpdate.data.doc_status).toBe(enum_doc_status.in_progress);
    });

    it('should update detail stages_status when pending at current stage', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_previous_stage: 'HOD',
        workflow_next_stage: '-',
        last_action_by_name: 'Test User',
      });

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        doc_status: enum_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
      ];

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages, history: [] },
      ]);

      // SR approve calls this.prismaService.tb_store_requisition_detail.update (not txp)
      let capturedDetailUpdate: any = null;
      prisma.tb_store_requisition_detail.update.mockImplementation((args) => {
        capturedDetailUpdate = args;
        return Promise.resolve({});
      });

      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: { update: jest.fn().mockResolvedValue({}) },
        };
        return cb(txPrisma);
      });

      await service.approve(SR_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve, stage_message: 'approved' },
      ]);

      const updatedStages = capturedDetailUpdate.data.stages_status;
      expect(updatedStages[1].status).toBe(stage_status.approve);
      expect(updatedStages[1].message).toBe('approved');
    });

    it('should skip detail when latest stage is rejected', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({ workflow_previous_stage: 'HOD' });

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        doc_status: enum_doc_status.in_progress,
      });

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [
            { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
            { seq: 2, status: stage_status.reject, name: 'HOD', message: 'rejected' },
          ],
          history: [],
        },
      ]);

      let detailUpdateCalled = false;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: { update: jest.fn().mockResolvedValue({}) },
          tb_store_requisition_detail: {
            update: jest.fn().mockImplementation(() => {
              detailUpdateCalled = true;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.approve(SR_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve, stage_message: '' },
      ]);

      expect(detailUpdateCalled).toBe(false);
    });
  });

  // ===========================================================================
  // WORKFLOW: reject
  // ===========================================================================
  describe('reject (workflow)', () => {
    it('should return error when SR not found or not in_progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_store_requisition.findFirst.mockResolvedValue(null);

      const result = await service.reject(
        SR_ID,
        { last_action_by_name: 'Test' } as any,
        {
          stage_role: 'approve' as any,
          details: [{ id: 'detail-1', stage_status: stage_status.reject, stage_message: 'bad' }],
        },
      );

      expect(result.isOk()).toBe(false);
    });

    it('should set SR status to voided on rejection', async () => {
      const prisma = setupPrismaService();
      const workflow = {
        ...buildWorkflowHeader({ last_action: enum_last_action.rejected }),
        last_action_by_name: 'Test User',
      };

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        doc_status: enum_doc_status.in_progress,
        workflow_current_stage: 'HOD',
      });

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
          history: [],
        },
      ]);

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_store_requisition_detail: { update: jest.fn().mockResolvedValue({}) },
        };
        return cb(txPrisma);
      });

      const result = await service.reject(SR_ID, workflow, {
        stage_role: 'approve' as any,
        details: [{ id: 'detail-1', stage_status: stage_status.reject, stage_message: 'not approved' }],
      });

      expect(result.isOk()).toBe(true);
      expect(capturedHeaderUpdate.data.doc_status).toBe(enum_doc_status.voided);
    });

    it('should mark all existing stages as rejected and add rejection stage', async () => {
      const prisma = setupPrismaService();
      const workflow = {
        ...buildWorkflowHeader(),
        last_action_by_name: 'Test User',
      };

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        doc_status: enum_doc_status.in_progress,
        workflow_current_stage: 'HOD',
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'Purchaser', message: '' },
      ];

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages, history: [] },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: { update: jest.fn().mockResolvedValue({}) },
          tb_store_requisition_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.reject(SR_ID, workflow, {
        stage_role: 'approve' as any,
        details: [{ id: 'detail-1', stage_status: stage_status.reject, stage_message: 'rejected by HOD' }],
      });

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
  });

  // ===========================================================================
  // WORKFLOW: review (send back)
  // ===========================================================================
  describe('review (workflow)', () => {
    it('should return error when SR not found or not in_progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_store_requisition.findFirst.mockResolvedValue(null);

      const result = await service.review(
        SR_ID,
        { ...buildWorkflowHeader(), last_action_by_name: 'Test' } as any,
        { des_stage: 'Requestor', stage_role: 'approve' as any, details: [] },
      );

      expect(result.isOk()).toBe(false);
    });

    it('should reset target stage to pending and trim later stages', async () => {
      const prisma = setupPrismaService();
      const workflow = {
        ...buildWorkflowHeader({
          workflow_previous_stage: 'Issuer',
          workflow_current_stage: 'HOD',
        }),
        last_action_by_name: 'Test User',
      };

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        doc_status: enum_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        { seq: 3, status: stage_status.pending, name: 'Issuer', message: '' },
      ];

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: [...existingStages], history: [] },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: { update: jest.fn().mockResolvedValue({}) },
          tb_store_requisition_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.review(SR_ID, workflow, {
        des_stage: 'HOD',
        stage_role: 'approve' as any,
        details: [{ id: 'detail-1', stage_status: stage_status.review, stage_message: 'please re-check' }],
      });

      const updatedStages = capturedDetailUpdate.data.stages_status;
      const hodStage = updatedStages.find((s: StageStatus) => s.name === 'HOD');
      expect(hodStage.status).toBe(stage_status.pending);
    });

    it('should add review entry to history', async () => {
      const prisma = setupPrismaService();
      const workflow = {
        ...buildWorkflowHeader({
          workflow_previous_stage: 'Issuer',
          workflow_current_stage: 'HOD',
        }),
        last_action_by_name: 'Test User',
      };

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        doc_status: enum_doc_status.in_progress,
      });

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([
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
          tb_store_requisition: { update: jest.fn().mockResolvedValue({}) },
          tb_store_requisition_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.review(SR_ID, workflow, {
        des_stage: 'Requestor',
        stage_role: 'approve' as any,
        details: [{ id: 'detail-1', stage_status: stage_status.review, stage_message: 'needs fix' }],
      });

      const history = capturedDetailUpdate.data.history;
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(
        expect.objectContaining({
          seq: 1,
          status: stage_status.review,
          name: 'Issuer',
          message: 'needs fix',
        }),
      );
    });

    it('should skip detail with stage_status approve during review', async () => {
      const prisma = setupPrismaService();
      const workflow = {
        ...buildWorkflowHeader({ workflow_previous_stage: 'HOD' }),
        last_action_by_name: 'Test',
      };

      prisma.tb_store_requisition.findFirst.mockResolvedValue({
        id: SR_ID,
        doc_status: enum_doc_status.in_progress,
      });

      prisma.tb_store_requisition_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
          history: [],
        },
      ]);

      let detailUpdateCalled = false;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_store_requisition: { update: jest.fn().mockResolvedValue({}) },
          tb_store_requisition_detail: {
            update: jest.fn().mockImplementation(() => {
              detailUpdateCalled = true;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.review(SR_ID, workflow, {
        des_stage: 'Requestor',
        stage_role: 'approve' as any,
        details: [{ id: 'detail-1', stage_status: stage_status.approve, stage_message: '' }],
      });

      expect(detailUpdateCalled).toBe(false);
    });
  });
});
