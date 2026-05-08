import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseRequestService } from './purchase-request.service';
import { TenantService } from '@/tenant/tenant.service';
import { CommonLogic } from '@/common/common.logic';
import { WorkflowOrchestratorService } from '@/common/workflow/workflow-orchestrator.service';
import {
  enum_purchase_request_doc_status,
  enum_last_action,
} from '@repo/prisma-shared-schema-tenant';
import { stage_status } from './dto/purchase-request-detail.dto';
import { WorkflowHeader, StageStatus } from './interface/workflow.interface';

describe('PurchaseRequestService', () => {
  let service: PurchaseRequestService;

  const mockPrismaSystem = {
    tb_business_unit: { findFirst: jest.fn() },
    tb_user: { findFirst: jest.fn() },
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseRequestService,
        { provide: 'PRISMA_SYSTEM', useValue: mockPrismaSystem },
        { provide: 'PRISMA_TENANT', useValue: mockPrismaTenant },
        { provide: TenantService, useValue: mockTenantService },
        { provide: CommonLogic, useValue: mockCommonLogic },
        { provide: WorkflowOrchestratorService, useValue: { resolveUserRole: jest.fn() } },
      ],
    }).compile();

    service = await module.resolve<PurchaseRequestService>(PurchaseRequestService);
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
  const PR_ID = 'pr-001';

  function buildWorkflowHeader(overrides: Partial<WorkflowHeader> = {}): WorkflowHeader {
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

  /**
   * Sets up the mock prisma client on the service so workflow methods can run.
   * Returns the mock prisma client for further assertions.
   */
  function setupPrismaService() {
    const mockPrismaClient = {
      tb_purchase_request: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      tb_purchase_request_detail: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    // Inject the mock prisma client via initializePrismaService path
    mockTenantService.prismaTenantInstance.mockResolvedValue(mockPrismaClient);
    // Directly set private fields for testing
    (service as any)._prismaService = mockPrismaClient;
    (service as any)._bu_code = BU_CODE;
    (service as any)._userId = USER_ID;

    return mockPrismaClient;
  }

  // ===========================================================================
  // WORKFLOW: submit
  // ===========================================================================
  describe('submit (workflow)', () => {
    it('should return error when PR not found or not in draft', async () => {
      const prisma = setupPrismaService();
      prisma.tb_purchase_request.findFirst.mockResolvedValue(null);

      const result = await service.submit(
        PR_ID,
        { stage_role: 'create', details: [] },
        buildWorkflowHeader(),
      );

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
      expect(prisma.tb_purchase_request.findFirst).toHaveBeenCalledWith({
        where: {
          id: PR_ID,
          OR: [
            { pr_status: enum_purchase_request_doc_status.draft },
            { pr_status: enum_purchase_request_doc_status.in_progress, last_action: 'reviewed' },
          ],
        },
      });
    });

    it('should transition PR status from draft to in_progress', async () => {
      const prisma = setupPrismaService();
      const workflowHeader = buildWorkflowHeader();
      jest.spyOn(service as any, 'generatePRNo').mockResolvedValue('PR2501-0001');

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_date: new Date('2025-01-15'),
        pr_status: enum_purchase_request_doc_status.draft,
      });

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([]);

      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: {
            update: jest.fn().mockResolvedValue({ id: PR_ID }),
          },
          tb_purchase_request_detail: {
            update: jest.fn().mockResolvedValue({}),
          },
        };
        return cb(txPrisma);
      });

      const result = await service.submit(
        PR_ID,
        { stage_role: 'create', details: [{ id: 'detail-1', stage_status: stage_status.submit, stage_message: '' }] },
        workflowHeader,
      );

      expect(result.isOk()).toBe(true);

      // Verify the transaction was called
      expect(prisma.$transaction).toHaveBeenCalled();

      // Verify the PR header update inside the transaction
      const txCallback = prisma.$transaction.mock.calls[0][0];
      const txPrisma = {
        tb_purchase_request: { update: jest.fn().mockResolvedValue({ id: PR_ID }) },
        tb_purchase_request_detail: { update: jest.fn().mockResolvedValue({}) },
      };
      await txCallback(txPrisma);

      expect(txPrisma.tb_purchase_request.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: PR_ID },
          data: expect.objectContaining({
            pr_status: enum_purchase_request_doc_status.in_progress,
            doc_version: { increment: 1 },
          }),
        }),
      );
    });

    it('should add stages_status entry for first-time submitted detail', async () => {
      const prisma = setupPrismaService();
      const workflowHeader = buildWorkflowHeader({ workflow_previous_stage: 'Requestor' });
      const detailId = 'detail-1';
      jest.spyOn(service as any, 'generatePRNo').mockResolvedValue('PR2501-0001');

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_date: new Date('2025-01-15'),
        pr_status: enum_purchase_request_doc_status.draft,
      });

      // Detail with empty stages_status (first time submit)
      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        {
          id: detailId,
          stages_status: [],
          history: [],
          requested_qty: 10,
          requested_unit_id: 'unit-1',
          requested_unit_name: 'kg',
          requested_unit_conversion_factor: 1,
        },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: {
            update: jest.fn().mockResolvedValue({ id: PR_ID }),
          },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.submit(
        PR_ID,
        {
          stage_role: 'create',
          details: [{ id: detailId, stage_status: stage_status.submit, stage_message: 'submit for approval' }],
        },
        workflowHeader,
      );

      expect(capturedDetailUpdate).not.toBeNull();
      expect(capturedDetailUpdate.data.stages_status).toEqual([
        {
          seq: 1,
          status: stage_status.submit,
          name: 'Requestor',
          message: 'submit for approval',
        },
      ]);
      expect(capturedDetailUpdate.data.history).toEqual([
        expect.objectContaining({
          seq: 1,
          status: stage_status.submit,
          name: 'Requestor',
        }),
      ]);
      // approved_qty should be copied from requested_qty
      expect(capturedDetailUpdate.data.approved_qty).toBe(10);
    });

    it('should skip detail with stage_status approve', async () => {
      const prisma = setupPrismaService();
      const workflowHeader = buildWorkflowHeader();
      jest.spyOn(service as any, 'generatePRNo').mockResolvedValue('PR2501-0001');

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_date: new Date(),
        pr_status: enum_purchase_request_doc_status.draft,
      });

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: [], history: [], requested_qty: 5, requested_unit_id: 'u1', requested_unit_name: 'ea', requested_unit_conversion_factor: 1 },
      ]);

      let detailUpdateCalled = false;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({ id: PR_ID }) },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation(() => {
              detailUpdateCalled = true;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.submit(
        PR_ID,
        { stage_role: 'create', details: [{ id: 'detail-1', stage_status: stage_status.approve, stage_message: '' }] },
        workflowHeader,
      );

      // Detail with approve status should be skipped
      expect(detailUpdateCalled).toBe(false);
    });
  });

  // ===========================================================================
  // WORKFLOW: approve
  // ===========================================================================
  describe('approve (workflow)', () => {
    it('should return error when PR not found or not in_progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_purchase_request.findFirst.mockResolvedValue(null);

      const result = await service.approve(PR_ID, buildWorkflowHeader(), []);

      expect(result.isOk()).toBe(false);
      expect(result.error.message).toContain('not found');
    });

    it('should set PR status to approved when workflow_next_stage is "-" (final approval)', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_next_stage: '-',
        workflow_previous_stage: 'HOD',
        last_action: enum_last_action.approved,
      });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([]);

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_purchase_request_detail: { update: jest.fn().mockResolvedValue({}) },
        };
        return cb(txPrisma);
      });

      const result = await service.approve(PR_ID, workflow, []);

      expect(result.isOk()).toBe(true);
      expect(capturedHeaderUpdate.data.pr_status).toBe(
        enum_purchase_request_doc_status.approved,
      );
    });

    it('should keep PR status as in_progress when more workflow stages remain', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_next_stage: 'GM',
        workflow_previous_stage: 'HOD',
      });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([]);

      let capturedHeaderUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_purchase_request_detail: { update: jest.fn().mockResolvedValue({}) },
        };
        return cb(txPrisma);
      });

      await service.approve(PR_ID, workflow, []);

      expect(capturedHeaderUpdate.data.pr_status).toBe(
        enum_purchase_request_doc_status.in_progress,
      );
    });

    it('should update detail stages_status when pending at current stage', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_previous_stage: 'HOD',
        workflow_next_stage: '-',
      });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: 'submitted' },
        { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
      ];

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages, history: [] },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.approve(PR_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve, stage_message: 'looks good' },
      ]);

      // The pending HOD stage should be replaced with approve
      const updatedStages = capturedDetailUpdate.data.stages_status;
      expect(updatedStages[1].status).toBe(stage_status.approve);
      expect(updatedStages[1].message).toBe('looks good');
    });

    it('should skip detail when latest stage is rejected', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({ workflow_previous_stage: 'HOD' });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      const rejectedStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.reject, name: 'HOD', message: 'rejected' },
      ];

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: rejectedStages, history: [] },
      ]);

      let detailUpdateCalled = false;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation(() => {
              detailUpdateCalled = true;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.approve(PR_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve, stage_message: '' },
      ]);

      // Already-rejected detail should be skipped
      expect(detailUpdateCalled).toBe(false);
    });

    it('should add new stage entry when detail is not pending at current stage', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_previous_stage: 'Purchaser',
        workflow_next_stage: '-',
      });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
      ];

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages, history: [] },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.approve(PR_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve, stage_message: '' },
      ]);

      const updatedStages = capturedDetailUpdate.data.stages_status;
      expect(updatedStages).toHaveLength(3);
      expect(updatedStages[2]).toEqual({
        seq: 3,
        status: stage_status.approve,
        name: 'Purchaser',
        message: '',
      });
    });
  });

  // ===========================================================================
  // WORKFLOW: reject
  // ===========================================================================
  describe('reject (workflow)', () => {
    const mockRejectWorkflow: any = {
      workflow_previous_stage: 'HOD',
      workflow_current_stage: 'HOD',
      workflow_next_stage: '-',
      user_action: { execute: [] },
      last_action: 'rejected',
      last_action_at_date: new Date().toISOString(),
      last_action_by_id: 'user-1',
      last_action_by_name: 'Test User',
      workflow_history: [{ action: 'rejected', datetime: new Date().toISOString(), user: { id: 'user-1', name: 'Test User' }, current_stage: 'HOD', next_stage: '-' }],
    };

    it('should return error when PR not found or not in_progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_purchase_request.findFirst.mockResolvedValue(null);

      const result = await service.reject(PR_ID, mockRejectWorkflow, {
        stage_role: 'approve' as any,
        details: [{ id: 'detail-1', stage_status: stage_status.reject, stage_message: 'bad' }],
      });

      expect(result.isOk()).toBe(false);
    });

    it('should set PR status to voided on rejection', async () => {
      const prisma = setupPrismaService();

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
        workflow_current_stage: 'HOD',
      });

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [
            { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          ],
        },
      ]);

      let capturedHeaderUpdate: any = null;
      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      const result = await service.reject(PR_ID, mockRejectWorkflow, {
        stage_role: 'approve' as any,
        details: [{ id: 'detail-1', stage_status: stage_status.reject, stage_message: 'not approved' }],
      });

      expect(result.isOk()).toBe(true);
      expect(capturedHeaderUpdate.data.pr_status).toBe(
        enum_purchase_request_doc_status.voided,
      );
      expect(capturedHeaderUpdate.data.workflow_history).toBeDefined();
    });

    it('should mark all existing stages as rejected and add rejection stage', async () => {
      const prisma = setupPrismaService();

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
        workflow_current_stage: 'HOD',
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'Purchaser', message: '' },
      ];

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages },
      ]);

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.reject(PR_ID, mockRejectWorkflow, {
        stage_role: 'approve' as any,
        details: [{ id: 'detail-1', stage_status: stage_status.reject, stage_message: 'rejected by HOD' }],
      });

      const updatedStages = capturedDetailUpdate.data.stages_status;
      // All previous stages should now be reject
      expect(updatedStages[0].status).toBe(stage_status.reject);
      expect(updatedStages[1].status).toBe(stage_status.reject);
      // New rejection entry appended
      expect(updatedStages[2]).toEqual({
        seq: 3,
        status: stage_status.reject,
        name: 'HOD',
        message: 'rejected by HOD',
      });
    });
  });

  // ===========================================================================
  // WORKFLOW: review (send back)
  // ===========================================================================
  describe('review (workflow)', () => {
    it('should return error when PR not found or not in_progress', async () => {
      const prisma = setupPrismaService();
      prisma.tb_purchase_request.findFirst.mockResolvedValue(null);

      const result = await service.review(
        PR_ID,
        { des_stage: 'Requestor', stage_role: 'approve' as any, details: [] },
        buildWorkflowHeader(),
      );

      expect(result.isOk()).toBe(false);
    });

    it('should reset target stage to pending and trim later stages', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_previous_stage: 'Purchaser',
        workflow_current_stage: 'Requestor',
      });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      // 3 stages: Requestor(submit) -> HOD(approve) -> Purchaser(pending)
      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        { seq: 3, status: stage_status.pending, name: 'Purchaser', message: '' },
      ];

      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            findMany: jest.fn().mockResolvedValue([
              { id: 'detail-1', stages_status: [...existingStages], history: [] },
            ]),
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.review(
        PR_ID,
        {
          des_stage: 'HOD',
          stage_role: 'approve' as any,
          details: [{ id: 'detail-1', stage_status: stage_status.review, stage_message: 'please re-check' }],
        },
        workflow,
      );

      const updatedStages = capturedDetailUpdate.data.stages_status;
      // HOD should be reset to pending
      const hodStage = updatedStages.find((s: StageStatus) => s.name === 'HOD');
      expect(hodStage.status).toBe(stage_status.pending);
    });

    it('should update workflow header on review', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_previous_stage: 'Purchaser',
        workflow_current_stage: 'HOD',
      });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
      ];

      let capturedHeaderUpdate: any = null;
      let capturedDetailUpdate: any = null;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: {
            update: jest.fn().mockImplementation((args) => {
              capturedHeaderUpdate = args;
              return Promise.resolve({});
            }),
          },
          tb_purchase_request_detail: {
            findMany: jest.fn().mockResolvedValue([
              { id: 'detail-1', stages_status: [...existingStages], history: [] },
            ]),
            update: jest.fn().mockImplementation((args) => {
              capturedDetailUpdate = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.review(
        PR_ID,
        {
          des_stage: 'Requestor',
          stage_role: 'approve' as any,
          details: [{ id: 'detail-1', stage_status: stage_status.review, stage_message: 'please fix' }],
        },
        workflow,
      );

      // Header should be updated with workflow info
      expect(capturedHeaderUpdate).not.toBeNull();
      expect(capturedHeaderUpdate.data.updated_by_id).toBe(USER_ID);

      // Detail should be updated with stages_status
      expect(capturedDetailUpdate).not.toBeNull();
      expect(capturedDetailUpdate.data.stages_status).toBeDefined();
      expect(capturedDetailUpdate.data.current_stage_status).toBe('');
    });

    it('should skip detail with stage_status approve during review', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({ workflow_previous_stage: 'HOD' });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      let detailUpdateCalled = false;
      prisma.$transaction.mockImplementation(async (cb) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'detail-1',
                stages_status: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
                history: [],
              },
            ]),
            update: jest.fn().mockImplementation(() => {
              detailUpdateCalled = true;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.review(
        PR_ID,
        {
          des_stage: 'Requestor',
          stage_role: 'approve' as any,
          details: [{ id: 'detail-1', stage_status: stage_status.approve, stage_message: '' }],
        },
        workflow,
      );

      // Detail with approve status should be skipped in review
      // Only the header update should happen (not detail)
      expect(detailUpdateCalled).toBe(false);
    });
  });

  // ===========================================================================
  // splitPr (existing tests preserved)
  // ===========================================================================
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
        tb_purchase_request_detail: [{ id: 'detail-3', sequence_no: 1, product_name: 'Product 3' }],
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
          tb_purchase_request_detail: { update: jest.fn().mockResolvedValue({}) },
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
  });

  // ===========================================================================
  // current_stage_status field semantics
  // ---------------------------------------------------------------------------
  // The backend stamps `reject` (terminal) on rejection, and stamps `approve`
  // ONLY at the final approval stage (workflow_next_stage === '-').
  // Intermediate approves leave the field '' so the next stage can act on the row.
  // See: memory/feedback_current_stage_status_semantics.md
  // ===========================================================================
  describe('current_stage_status semantics', () => {
    function captureDetailUpdate(prisma: any) {
      const captured: { value: any } = { value: null };
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            findMany: jest.fn().mockResolvedValue(
              (prisma.tb_purchase_request_detail.findMany.mock.results[0]?.value) ?? [],
            ),
            update: jest.fn().mockImplementation((args: any) => {
              captured.value = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });
      return captured;
    }

    it('approve() at final stage (workflow_next_stage === "-"): writes "approve"', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_previous_stage: 'HOD',
        workflow_current_stage: 'Purchaser',
        workflow_next_stage: '-',
      });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
      ];

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages, history: [] },
      ]);

      const captured = captureDetailUpdate(prisma);

      await service.approve(PR_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve, stage_message: 'ok' },
      ]);

      expect(captured.value).not.toBeNull();
      expect(captured.value.data.current_stage_status).toBe(stage_status.approve);
    });

    it('approve() at intermediate stage (workflow_next_stage !== "-"): writes ""', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_previous_stage: 'HOD',
        workflow_current_stage: 'Purchaser',
        workflow_next_stage: 'GM',
      });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
      ];

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        { id: 'detail-1', stages_status: existingStages, history: [] },
      ]);

      const captured = captureDetailUpdate(prisma);

      await service.approve(PR_ID, workflow, [
        { id: 'detail-1', stage_status: stage_status.approve, stage_message: 'ok' },
      ]);

      expect(captured.value).not.toBeNull();
      expect(captured.value.data.current_stage_status).toBe('');
    });

    it('reject(): writes "reject" to current_stage_status (terminal stamp)', async () => {
      const prisma = setupPrismaService();
      const workflow: any = {
        workflow_previous_stage: 'HOD',
        workflow_current_stage: 'HOD',
        workflow_next_stage: '-',
        user_action: { execute: [] },
        last_action: 'rejected',
        last_action_at_date: new Date().toISOString(),
        last_action_by_id: USER_ID,
        last_action_by_name: 'Test User',
        workflow_history: [],
      };

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
        workflow_current_stage: 'HOD',
      });

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [
            { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          ],
        },
      ]);

      let captured: any = null;
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation((args: any) => {
              captured = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.reject(PR_ID, workflow, {
        stage_role: 'approve' as any,
        details: [{ id: 'detail-1', stage_status: stage_status.reject, stage_message: 'no' }],
      });

      expect(captured).not.toBeNull();
      expect(captured.data.current_stage_status).toBe(stage_status.reject);
    });

    it('reject(): all items get current_stage_status "reject" regardless of payload stage_status', async () => {
      // reject() is a terminal action — every detail row gets stamped 'reject'.
      // Even if the payload sends an empty stage_status, the document is being
      // rejected as a whole, so the stamp must always be 'reject'.
      const prisma = setupPrismaService();
      const workflow: any = {
        workflow_previous_stage: 'HOD',
        workflow_current_stage: 'HOD',
        workflow_next_stage: '-',
        user_action: { execute: [] },
        last_action: 'rejected',
        last_action_at_date: new Date().toISOString(),
        last_action_by_id: USER_ID,
        last_action_by_name: 'Test User',
        workflow_history: [],
      };

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
        workflow_current_stage: 'HOD',
      });

      prisma.tb_purchase_request_detail.findMany.mockResolvedValue([
        {
          id: 'detail-1',
          stages_status: [
            { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          ],
        },
      ]);

      const updates: any[] = [];
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            update: jest.fn().mockImplementation((args: any) => {
              updates.push(args);
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.reject(PR_ID, workflow, {
        stage_role: 'approve' as any,
        details: [
          { id: 'detail-1', stage_status: '' as any, stage_message: '' },
        ],
      });

      // All items must be stamped 'reject' — reject() is terminal.
      expect(updates).toHaveLength(1);
      expect(updates[0].data.current_stage_status).toBe(stage_status.reject);
    });

    it('review() (send-back): writes empty string to current_stage_status', async () => {
      const prisma = setupPrismaService();
      const workflow = buildWorkflowHeader({
        workflow_previous_stage: 'Purchaser',
        workflow_current_stage: 'HOD',
      });

      prisma.tb_purchase_request.findFirst.mockResolvedValue({
        id: PR_ID,
        pr_status: enum_purchase_request_doc_status.in_progress,
      });

      const existingStages: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
      ];

      let captured: any = null;
      prisma.$transaction.mockImplementation(async (cb: any) => {
        const txPrisma = {
          tb_purchase_request: { update: jest.fn().mockResolvedValue({}) },
          tb_purchase_request_detail: {
            findMany: jest.fn().mockResolvedValue([
              { id: 'detail-1', stages_status: [...existingStages], history: [] },
            ]),
            update: jest.fn().mockImplementation((args: any) => {
              captured = args;
              return Promise.resolve({});
            }),
          },
        };
        return cb(txPrisma);
      });

      await service.review(
        PR_ID,
        {
          des_stage: 'Requestor',
          stage_role: 'approve' as any,
          details: [
            { id: 'detail-1', stage_status: stage_status.review, stage_message: 'fix' },
          ],
        },
        workflow,
      );

      expect(captured).not.toBeNull();
      expect(captured.data.current_stage_status).toBe('');
      expect(captured.data.current_stage_status).not.toBe(stage_status.approve);
    });
  });
});
