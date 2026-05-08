import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowOrchestratorService } from './workflow-orchestrator.service';
import { MapperLogic } from '@/common/mapper/mapper.logic';
import { WorkflowDocument } from './workflow.interfaces';
import { enum_last_action, enum_stage_role } from '@repo/prisma-shared-schema-tenant';
import { of } from 'rxjs';

describe('WorkflowOrchestratorService', () => {
  let service: WorkflowOrchestratorService;

  const mockMasterService = { send: jest.fn() };
  const mockAuthService = { send: jest.fn() };
  const mockMapperLogic = { populate: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowOrchestratorService,
        { provide: 'MASTER_SERVICE', useValue: mockMasterService },
        { provide: 'AUTH_SERVICE', useValue: mockAuthService },
        { provide: MapperLogic, useValue: mockMapperLogic },
      ],
    }).compile();

    service = module.get(WorkflowOrchestratorService);
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

  function mockDocument(overrides: Partial<WorkflowDocument> = {}): WorkflowDocument {
    return {
      id: 'doc-001',
      workflow_id: 'wf-001',
      workflow_current_stage: null,
      workflow_previous_stage: null,
      workflow_history: [],
      department: { id: 'dept-001', name: 'Kitchen' },
      requestor_id: USER_ID,
      navigation_request_data: { amount: 1000 },
      ...overrides,
    };
  }

  function setupMapperPopulate(workflowData: any = { stages: [] }, userName = 'Test User') {
    mockMapperLogic.populate.mockImplementation(async (keys: Record<string, any>) => {
      const result: Record<string, any> = {};
      if (keys.workflow_id) result.workflow_id = { data: workflowData };
      if (keys.user_id) result.user_id = { name: userName };
      return result;
    });
  }

  function mockNavigateForward(currentStage: string, nextStep: string | null, previousStage?: string) {
    return of({
      previous_stage: previousStage || 'PrevStage',
      current_stage: currentStage,
      navigation_info: {
        workflow_next_step: nextStep,
        current_stage_info: { name: currentStage, assigned_users: [] },
      },
    });
  }

  // ===========================================================================
  // buildSubmitWorkflow
  // ===========================================================================
  describe('buildSubmitWorkflow', () => {
    it('should build workflow header for submit action', async () => {
      setupMapperPopulate({ stages: [{ name: 'Draft' }, { name: 'HOD' }] });

      // First call: get first stage, second call: navigate forward
      mockMasterService.send
        .mockReturnValueOnce(mockNavigateForward('Draft', 'HOD', null))
        .mockReturnValueOnce(mockNavigateForward('HOD', 'Purchaser', 'Draft'));

      const doc = mockDocument();
      const result = await service.buildSubmitWorkflow(doc, USER_ID, BU_CODE);

      expect(result.last_action).toBe(enum_last_action.submitted);
      expect(result.workflow_current_stage).toBe('HOD');
      expect(result.last_action_by_id).toBe(USER_ID);
      expect(result.workflow_history).toHaveLength(1);
      expect(result.workflow_history[0].action).toBe(enum_last_action.submitted);
    });

    it('should skip first-stage lookup when current stage already set', async () => {
      setupMapperPopulate({ stages: [] });

      mockMasterService.send
        .mockReturnValueOnce(mockNavigateForward('HOD', 'Purchaser', 'Requestor'));

      const doc = mockDocument({ workflow_current_stage: 'Requestor' });
      const result = await service.buildSubmitWorkflow(doc, USER_ID, BU_CODE);

      // Should only call navigate once (not twice for first-stage lookup)
      expect(mockMasterService.send).toHaveBeenCalledTimes(1);
      expect(result.workflow_current_stage).toBe('HOD');
    });

    it('should pass document.department to buildUserAction', async () => {
      setupMapperPopulate({ stages: [] });
      mockMasterService.send.mockReturnValueOnce(mockNavigateForward('Draft', null, null))
        .mockReturnValueOnce(mockNavigateForward('HOD', null, 'Draft'));

      // Mock buildUserAction to verify department is passed
      const spy = jest.spyOn(service, 'buildUserAction').mockResolvedValue({ execute: [] });

      const doc = mockDocument({
        workflow_current_stage: null,
        department: { id: 'override-dept', name: 'Override Dept' },
      });
      await service.buildSubmitWorkflow(doc, USER_ID, BU_CODE);

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        'override-dept',
        'Override Dept',
        USER_ID,
        BU_CODE,
      );
    });

    it('should preserve existing workflow_history from the document', async () => {
      // Regression: orchestrator must not erase prior history when appending.
      // Previously the bug class included losing history because mappers
      // forwarded `[]` from stripped data.
      setupMapperPopulate({ stages: [] });
      mockMasterService.send.mockReturnValueOnce(mockNavigateForward('HOD', 'Purchaser', 'Draft'));

      const priorHistory = [{
        action: enum_last_action.submitted,
        datetime: '2026-01-01T00:00:00Z',
        user: { id: 'prev-user', name: 'Prev' },
        current_stage: 'Draft',
        next_stage: 'HOD',
      }];
      const doc = mockDocument({
        workflow_current_stage: 'Requestor',
        workflow_history: priorHistory as any,
      });
      const result = await service.buildSubmitWorkflow(doc, USER_ID, BU_CODE);

      expect(result.workflow_history).toHaveLength(2);
      expect(result.workflow_history[0]).toEqual(priorHistory[0]);
      // Orchestrator must not mutate the input array.
      expect(doc.workflow_history).toHaveLength(1);
    });
  });

  // ===========================================================================
  // buildApproveWorkflow
  // ===========================================================================
  describe('buildApproveWorkflow', () => {
    it('should return isFinalApproval=true when no next step', async () => {
      setupMapperPopulate({ stages: [] });
      mockMasterService.send.mockReturnValueOnce(mockNavigateForward('HOD', null, 'Requestor'));

      const doc = mockDocument({ workflow_current_stage: 'Requestor' });
      const { workflow, isFinalApproval } = await service.buildApproveWorkflow(doc, USER_ID, BU_CODE);

      expect(isFinalApproval).toBe(true);
      expect(workflow.workflow_next_stage).toBe('-');
      expect(workflow.user_action).toEqual({ execute: [] });
      expect(workflow.last_action).toBe(enum_last_action.approved);
    });

    it('should return isFinalApproval=false when more stages remain', async () => {
      setupMapperPopulate({ stages: [] });
      mockMasterService.send.mockReturnValueOnce(mockNavigateForward('Purchaser', 'GM', 'HOD'));

      const doc = mockDocument({ workflow_current_stage: 'HOD' });
      const { workflow, isFinalApproval } = await service.buildApproveWorkflow(doc, USER_ID, BU_CODE);

      expect(isFinalApproval).toBe(false);
      expect(workflow.workflow_next_stage).toBe('GM');
      expect(workflow.workflow_current_stage).toBe('Purchaser');
    });

    it('should add approved and completed history entries for final approval', async () => {
      setupMapperPopulate({ stages: [] });
      mockMasterService.send.mockReturnValueOnce(mockNavigateForward('Final', null, 'HOD'));

      const doc = mockDocument({ workflow_current_stage: 'HOD' });
      const { workflow } = await service.buildApproveWorkflow(doc, USER_ID, BU_CODE);

      expect(workflow.workflow_history).toHaveLength(2);
      expect(workflow.workflow_history[0].action).toBe(enum_last_action.approved);
      expect(workflow.workflow_history[0].next_stage).toBe('-');
      expect(workflow.workflow_history[1].action).toBe('completed');
      expect(workflow.workflow_history[1].current_stage).toBe('Final');
      expect(workflow.workflow_history[1].next_stage).toBe('-');
    });
  });

  // ===========================================================================
  // buildRejectWorkflow
  // ===========================================================================
  describe('buildRejectWorkflow', () => {
    it('should build reject workflow with terminated state', async () => {
      setupMapperPopulate();

      const doc = mockDocument({ workflow_current_stage: 'HOD' });
      const result = await service.buildRejectWorkflow(doc, USER_ID, BU_CODE);

      expect(result.last_action).toBe(enum_last_action.rejected);
      expect(result.workflow_next_stage).toBe('-');
      expect(result.user_action).toEqual({ execute: [] });
      expect(result.workflow_current_stage).toBe('HOD');
      expect(result.workflow_history[0].action).toBe(enum_last_action.rejected);
      expect(result.workflow_history[0].next_stage).toBe('-');
    });
  });

  // ===========================================================================
  // buildReviewWorkflow
  // ===========================================================================
  describe('buildReviewWorkflow', () => {
    it('should build review workflow by navigating back to target stage', async () => {
      mockAuthService.send.mockReturnValueOnce(of({ data: { name: 'Reviewer' } }));
      mockMasterService.send.mockReturnValueOnce(of({
        data: {
          previous_stage: 'HOD',
          current_stage: 'Requestor',
          navigation_info: {
            // workflow_previous_step is set, so the destination is NOT the first
            // stage — the create-stage shortcut in buildReviewWorkflow won't fire.
            workflow_previous_step: 'EarlierStage',
            workflow_next_step: 'HOD',
            current_stage_info: { name: 'Requestor', assigned_users: [] },
          },
        },
      }));

      const doc = mockDocument({ workflow_current_stage: 'Purchaser' });
      const result = await service.buildReviewWorkflow(doc, 'Requestor', USER_ID, BU_CODE);

      expect(result.last_action).toBe(enum_last_action.reviewed);
      expect(result.workflow_current_stage).toBe('Requestor');
      expect(result.last_action_by_name).toBe('Reviewer');
      expect(result.workflow_history[0].action).toBe(enum_last_action.reviewed);
    });

    it('should only include requestor in user_action when reviewing back to only_creator stage', async () => {
      const REQUESTOR_ID = '00000000-0000-4000-a000-000000000099';
      const requestorProfile = {
        user_id: REQUESTOR_ID,
        email: 'requestor@test.com',
        firstname: 'Requestor',
        middlename: '',
        lastname: 'User',
        initials: 'RU',
        department: { id: 'dept-001', name: 'Kitchen' },
      };

      // 1st call: resolveUserNameFromAuth
      mockAuthService.send.mockReturnValueOnce(of({ data: { name: 'Reviewer' } }));
      // 2nd call: navigate-back-to-stage
      mockMasterService.send.mockReturnValueOnce(of({
        data: {
          previous_stage: 'HOD',
          current_stage: 'Create Request',
          navigation_info: {
            workflow_next_step: 'HOD',
            current_stage_info: {
              name: 'Create Request',
              assigned_users: [
                { user_id: REQUESTOR_ID },
                { user_id: '00000000-0000-4000-a000-000000000088' },
              ],
              creator_access: 'only_creator',
            },
          },
        },
      }));
      // 3rd call: get-user-profiles-by-ids (for requestor only)
      mockAuthService.send.mockReturnValueOnce(of({ data: [requestorProfile] }));

      const doc = mockDocument({
        workflow_current_stage: 'HOD',
        requestor_id: REQUESTOR_ID,
      });
      const result = await service.buildReviewWorkflow(doc, 'Create Request', USER_ID, BU_CODE);

      expect(result.user_action.execute).toHaveLength(1);
      expect(result.user_action.execute[0].user_id).toBe(REQUESTOR_ID);

      // Verify get-user-profiles-by-ids was called with only the requestor
      const profileCall = mockAuthService.send.mock.calls[1];
      expect(profileCall[1].user_ids).toEqual([REQUESTOR_ID]);
    });

    it('should assign requestor when reviewing back to the first stage even without creator_access flag', async () => {
      // Regression: PO/PR workflows whose first stage isn't tagged with
      // creator_access: 'only_creator' used to end up with user_action.execute = []
      // after a review-back, leaving the buyer/requestor unable to act.
      // The orchestrator now treats "destination has no previous step in history"
      // as a create-stage marker and assigns the requestor regardless.
      const REQUESTOR_ID = '00000000-0000-4000-a000-000000000077';
      const requestorProfile = {
        user_id: REQUESTOR_ID,
        email: 'buyer@test.com',
        firstname: 'Buyer',
        middlename: '',
        lastname: 'User',
        initials: 'BU',
        department: { id: 'dept-001', name: 'Kitchen' },
      };

      mockAuthService.send.mockReturnValueOnce(of({ data: { name: 'Reviewer' } }));
      mockMasterService.send.mockReturnValueOnce(of({
        data: {
          previous_stage: 'FC',
          current_stage: 'Create Request',
          navigation_info: {
            // null = destination is the first stage in history
            workflow_previous_step: null,
            workflow_next_step: 'FC',
            current_stage_info: {
              name: 'Create Request',
              assigned_users: [],
              // Note: no creator_access flag set — this is the bug scenario
            },
          },
        },
      }));
      mockAuthService.send.mockReturnValueOnce(of({ data: [requestorProfile] }));

      const doc = mockDocument({
        workflow_current_stage: 'FC',
        requestor_id: REQUESTOR_ID,
      });
      const result = await service.buildReviewWorkflow(doc, 'Create Request', USER_ID, BU_CODE);

      expect(result.user_action.execute).toHaveLength(1);
      expect(result.user_action.execute[0].user_id).toBe(REQUESTOR_ID);

      const profileCall = mockAuthService.send.mock.calls[1];
      expect(profileCall[1].user_ids).toEqual([REQUESTOR_ID]);
    });

    it('should THROW when reviewing back to create stage without requestor_id', async () => {
      // Regression guard: the original bug was caused by passing schema-stripped
      // data with `requestor_id = null` into the orchestrator, producing
      // `user_action.execute = []` silently. The orchestrator now throws so the
      // upstream data shape problem surfaces immediately instead of corrupting
      // the document in the database.
      mockAuthService.send.mockReturnValueOnce(of({ data: { name: 'Reviewer' } }));
      mockMasterService.send.mockReturnValueOnce(of({
        data: {
          previous_stage: 'FC',
          current_stage: 'Create Request',
          navigation_info: {
            workflow_previous_step: null,
            workflow_next_step: 'FC',
            current_stage_info: {
              name: 'Create Request',
              assigned_users: [],
            },
          },
        },
      }));

      const doc = mockDocument({
        workflow_current_stage: 'FC',
        requestor_id: null,
      });

      await expect(
        service.buildReviewWorkflow(doc, 'Create Request', USER_ID, BU_CODE),
      ).rejects.toThrow(/cannot resolve requestor for document/);
    });
  });

  // ===========================================================================
  // buildUserAction
  // ===========================================================================
  describe('buildUserAction', () => {
    it('should return null when no users to assign', async () => {
      const result = await service.buildUserAction(
        { assigned_users: [] },
        null,
        null,
        USER_ID,
        BU_CODE,
      );

      expect(result).toBeNull();
    });

    it('should collect assigned_users from stage info', async () => {
      mockAuthService.send.mockReturnValueOnce(of({ data: [{ user_id: 'u1', email: 'u1@test.com' }] }));

      const result = await service.buildUserAction(
        { assigned_users: ['u1'] },
        'dept-1',
        'Kitchen',
        USER_ID,
        BU_CODE,
      );

      expect(result.execute).toHaveLength(1);
      expect(result.execute[0].user_id).toBe('u1');
    });

    it('should add department users when creator_access flag is set', async () => {
      mockMasterService.send.mockReturnValueOnce(of({ data: [{ user_id: 'dept-user-1' }] }));
      mockAuthService.send.mockReturnValueOnce(of({ data: [{ user_id: 'dept-user-1' }] }));

      const result = await service.buildUserAction(
        { assigned_users: [], creator_access: 'all_department' },
        'dept-1',
        'Kitchen',
        USER_ID,
        BU_CODE,
      );

      expect(result.execute).toHaveLength(1);
    });

    it('should add HOD users when is_hod flag is set', async () => {
      mockMasterService.send.mockReturnValueOnce(of({ data: ['hod-user-1'] }));
      mockAuthService.send.mockReturnValueOnce(of({ data: [{ user_id: 'hod-user-1' }] }));

      const result = await service.buildUserAction(
        { assigned_users: [], is_hod: true },
        'dept-1',
        'Kitchen',
        USER_ID,
        BU_CODE,
      );

      expect(result.execute).toHaveLength(1);
    });

    it('should deduplicate user IDs', async () => {
      mockAuthService.send.mockReturnValueOnce(of({ data: [{ user_id: 'u1' }] }));

      const result = await service.buildUserAction(
        { assigned_users: ['u1', 'u1', 'u1'] },
        'dept-1',
        'Kitchen',
        USER_ID,
        BU_CODE,
      );

      // Should call auth service with deduplicated IDs
      expect(mockAuthService.send).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ user_ids: ['u1'] }),
      );
    });
  });

  // ===========================================================================
  // resolveUserRole
  // ===========================================================================
  describe('resolveUserRole', () => {
    it('should return "create" when document is draft and user is creator', async () => {
      const result = await service.resolveUserRole(
        true, true, 'wf-001', 'HOD', null, USER_ID, BU_CODE,
      );
      expect(result).toBe(enum_stage_role.create);
    });

    it('should return "view_only" when no workflow_id', async () => {
      const result = await service.resolveUserRole(
        false, false, null, null, null, USER_ID, BU_CODE,
      );
      expect(result).toBe(enum_stage_role.view_only);
    });

    it('should return stage role when user is in user_action.execute', async () => {
      mockMasterService.send.mockReturnValueOnce(of({
        data: { role: 'approve', name: 'HOD' },
      }));

      const result = await service.resolveUserRole(
        false, false, 'wf-001', 'HOD',
        { execute: [{ user_id: USER_ID }] },
        USER_ID, BU_CODE,
      );
      expect(result).toBe('approve');
    });

    it('should return "view_only" when user is NOT in user_action.execute', async () => {
      mockMasterService.send.mockReturnValueOnce(of({
        data: { role: 'approve', name: 'HOD' },
      }));

      const result = await service.resolveUserRole(
        false, false, 'wf-001', 'HOD',
        { execute: [{ user_id: 'other-user' }] },
        USER_ID, BU_CODE,
      );
      expect(result).toBe(enum_stage_role.view_only);
    });

    it('should return "view_only" when masterService throws', async () => {
      mockMasterService.send.mockReturnValueOnce({
        pipe: () => ({ subscribe: () => {} }),
        toPromise: () => Promise.reject(new Error('fail')),
        subscribe: () => {},
        [Symbol.observable]: () => ({ subscribe: (observer) => { observer.error(new Error('fail')); return { unsubscribe: () => {} }; } }),
      });

      // Use a throwable observable
      const { throwError } = await import('rxjs');
      mockMasterService.send.mockReset();
      mockMasterService.send.mockReturnValueOnce(throwError(() => new Error('network error')));

      const result = await service.resolveUserRole(
        false, false, 'wf-001', 'HOD',
        { execute: [{ user_id: USER_ID }] },
        USER_ID, BU_CODE,
      );
      expect(result).toBe(enum_stage_role.view_only);
    });
  });
});
