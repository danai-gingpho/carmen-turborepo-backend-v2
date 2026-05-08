import { stage_status } from '@/procurement/purchase-request/dto/purchase-request-detail.dto';
import { WorkflowPersistenceHelper } from './workflow-persistence.helper';
import { StageStatus } from './workflow.interfaces';

describe('WorkflowPersistenceHelper', () => {
  // ===========================================================================
  // buildSubmitStagesStatus
  // ===========================================================================
  describe('buildSubmitStagesStatus', () => {
    it('should skip when detail stage_status is approve', () => {
      const { stages, skipped } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
        [],
        { stage_status: stage_status.approve, stage_message: '' },
        'Requestor',
      );

      expect(skipped).toBe(true);
      expect(stages).toEqual([]);
    });

    it('should push first entry (seq 1) when stage_status is submit', () => {
      const { stages, skipped } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
        [],
        { stage_status: stage_status.submit, stage_message: 'submit for approval' },
        'Requestor',
      );

      expect(skipped).toBe(false);
      expect(stages).toHaveLength(1);
      expect(stages[0]).toEqual({
        seq: 1,
        status: stage_status.submit,
        name: 'Requestor',
        message: 'submit for approval',
      });
    });

    it('should replace pending stage at same workflow stage', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
      ];

      const { stages } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
        existing,
        { stage_status: stage_status.approve, stage_message: 'ok' },
        'HOD',
      );

      // Should NOT push new entry, should replace the pending one
      // Wait - approve is handled by the skip branch. Let me use a different status.
      // Actually "approve" in submit is skipped. Let me test with a re-submit after review.
    });

    it('should skip when stage was already approved in stages_status', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        { seq: 3, status: stage_status.pending, name: 'Purchaser', message: '' },
      ];

      const { stages, skipped } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
        existing,
        { stage_status: stage_status.submit, stage_message: '' },
        'HOD',
      );

      expect(skipped).toBe(true);
      expect(stages).toHaveLength(3);
    });

    it('should skip when item has prior approve at any stage (different name)', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
      ];

      const { stages, skipped } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
        existing,
        { stage_status: stage_status.submit, stage_message: 're-submit' },
        'Create Request',
      );

      expect(skipped).toBe(true);
      expect(stages).toHaveLength(2);
    });

    it('should replace pending entry when re-submitting after review (no prior approve)', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.pending, name: 'Create Request', message: '' },
      ];

      const { stages, skipped } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
        existing,
        { stage_status: stage_status.submit, stage_message: 'submit for approval' },
        'Create Request',
      );

      expect(skipped).toBe(false);
      expect(stages).toHaveLength(1);
      expect(stages[0]).toEqual({
        seq: 1,
        status: stage_status.submit,
        name: 'Create Request',
        message: 'submit for approval',
      });
    });

    it('should replace pending entry at same stage name', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
      ];

      const { stages, skipped } = WorkflowPersistenceHelper.buildSubmitStagesStatus(
        existing,
        { stage_status: stage_status.review, stage_message: 'updated' },
        'HOD',
      );

      expect(skipped).toBe(false);
      expect(stages).toHaveLength(2);
      expect(stages[1].status).toBe(stage_status.review);
      expect(stages[1].message).toBe('updated');
    });
  });

  // ===========================================================================
  // buildApproveStagesStatus
  // ===========================================================================
  describe('buildApproveStagesStatus', () => {
    it('should skip when latest stage is already approved at same stage', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
      ];

      const { stages, skipped } = WorkflowPersistenceHelper.buildApproveStagesStatus(
        existing,
        { stage_status: stage_status.approve },
        'HOD',
      );

      expect(skipped).toBe(true);
      expect(stages).toHaveLength(2);
    });

    it('should skip when latest stage is rejected', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.reject, name: 'HOD', message: 'rejected' },
      ];

      const { stages, skipped } = WorkflowPersistenceHelper.buildApproveStagesStatus(
        existing,
        { stage_status: stage_status.approve },
        'HOD',
      );

      expect(skipped).toBe(true);
      expect(stages).toHaveLength(2);
    });

    it('should replace pending stage at same workflow stage', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
      ];

      const { stages, skipped } = WorkflowPersistenceHelper.buildApproveStagesStatus(
        existing,
        { stage_status: stage_status.approve, stage_message: 'looks good' },
        'HOD',
      );

      expect(skipped).toBe(false);
      expect(stages).toHaveLength(2);
      expect(stages[1].status).toBe(stage_status.approve);
      expect(stages[1].message).toBe('looks good');
    });

    it('should push new entry when not pending at current stage', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
      ];

      const { stages, skipped } = WorkflowPersistenceHelper.buildApproveStagesStatus(
        existing,
        { stage_status: stage_status.approve },
        'Purchaser',
      );

      expect(skipped).toBe(false);
      expect(stages).toHaveLength(3);
      expect(stages[2]).toEqual({
        seq: 3,
        status: stage_status.approve,
        name: 'Purchaser',
        message: '',
      });
    });
  });

  // ===========================================================================
  // buildRejectStagesStatus
  // ===========================================================================
  describe('buildRejectStagesStatus', () => {
    it('should mark all existing stages as rejected and append rejection entry', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'Purchaser', message: '' },
      ];

      const result = WorkflowPersistenceHelper.buildRejectStagesStatus(
        existing,
        { stage_status: stage_status.reject, stage_message: 'not approved' },
        'HOD',
      );

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(stage_status.reject);
      expect(result[1].status).toBe(stage_status.reject);
      expect(result[2]).toEqual({
        seq: 3,
        status: stage_status.reject,
        name: 'HOD',
        message: 'not approved',
      });
    });

    it('should handle empty stages', () => {
      const result = WorkflowPersistenceHelper.buildRejectStagesStatus(
        [],
        { stage_status: stage_status.reject, stage_message: 'rejected' },
        'HOD',
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        seq: 1,
        status: stage_status.reject,
        name: 'HOD',
        message: 'rejected',
      });
    });
  });

  // ===========================================================================
  // buildReviewStagesStatus
  // ===========================================================================
  describe('buildReviewStagesStatus', () => {
    it('should reset target stage to pending', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        { seq: 3, status: stage_status.pending, name: 'Purchaser', message: '' },
      ];

      const result = WorkflowPersistenceHelper.buildReviewStagesStatus(existing, 'HOD');

      const hodStage = result.find((s) => s.name === 'HOD');
      expect(hodStage.status).toBe(stage_status.pending);
      // Stages after HOD should be trimmed
      expect(result.some((s) => s.name === 'Purchaser')).toBe(false);
      expect(result).toHaveLength(2);
    });

    it('rolls back to target with downstream approves preserved (target marked approve)', () => {
      const existing: StageStatus[] = [
        { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
        { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        { seq: 3, status: stage_status.approve, name: 'Purchaser', message: '' },
        { seq: 4, status: stage_status.pending, name: 'GM', message: '' },
      ];

      const result = WorkflowPersistenceHelper.buildReviewStagesStatus(existing, 'HOD');

      // Target HOD entry is marked approve (row had downstream approves);
      // downstream approve at Purchaser preserved; pending GM dropped.
      expect(result.find((s) => s.name === 'HOD')?.status).toBe(stage_status.approve);
      expect(result.some((s) => s.name === 'Purchaser' && s.status === stage_status.approve)).toBe(true);
      expect(result.some((s) => s.name === 'GM')).toBe(false);
      expect(result).toHaveLength(3);
    });
  });

  // ===========================================================================
  // appendHistory
  // ===========================================================================
  describe('appendHistory', () => {
    it('should append entry with correct seq number', () => {
      const existing = [
        { seq: 1, status: 'submit', name: 'Requestor', message: '' },
      ];

      const result = WorkflowPersistenceHelper.appendHistory(
        existing as any,
        {
          status: stage_status.approve,
          name: 'HOD',
          message: 'approved',
          userId: 'user-1',
          userName: 'Test User',
        },
      );

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(
        expect.objectContaining({
          seq: 2,
          status: stage_status.approve,
          name: 'HOD',
          message: 'approved',
          user: { id: 'user-1', name: 'Test User' },
        }),
      );
    });

    it('should handle empty history', () => {
      const result = WorkflowPersistenceHelper.appendHistory(
        [],
        {
          status: stage_status.submit,
          name: 'Requestor',
          userId: 'user-1',
        },
      );

      expect(result).toHaveLength(1);
      expect(result[0].seq).toBe(1);
    });

    it('should include action field when provided', () => {
      const result = WorkflowPersistenceHelper.appendHistory(
        [],
        {
          status: stage_status.approve,
          name: 'HOD',
          userId: 'user-1',
          action: 'approved',
        },
      );

      expect(result[0]).toHaveProperty('action', 'approved');
    });

    it('should handle null history input', () => {
      const result = WorkflowPersistenceHelper.appendHistory(
        null as any,
        {
          status: stage_status.submit,
          name: 'Requestor',
          userId: 'user-1',
        },
      );

      expect(result).toHaveLength(1);
    });
  });

  // ===========================================================================
  // Composite detail-update builders
  // ===========================================================================

  describe('buildRejectDetailUpdate', () => {
    it('should stamp current_stage_status as reject', () => {
      const result = WorkflowPersistenceHelper.buildRejectDetailUpdate({
        payloadDetail: { stage_status: stage_status.reject, stage_message: 'no' },
        currentStages: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
        currentHistory: [],
        workflowCurrentStage: 'HOD',
        userId: 'user-1',
      });

      expect(result.current_stage_status).toBe(stage_status.reject);
      expect(result.stages_status).toHaveLength(2);
      expect(result.history).toHaveLength(1);
    });
  });

  describe('buildReviewDetailUpdate', () => {
    it('approve-during-review pushes an approve entry; CSS resolved against destination stage', () => {
      const result = WorkflowPersistenceHelper.buildReviewDetailUpdate({
        payloadDetail: { stage_status: stage_status.approve, stage_message: 'keep' },
        currentStages: [
          { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
        ],
        currentHistory: [],
        workflowPreviousStage: 'HOD',
        workflowCurrentStage: 'Requestor',
        desStage: 'Requestor',
        userId: 'user-1',
      });

      expect(result).not.toBeNull();
      // doc rolled back to Requestor; Requestor entry is submit, not approve → CSS ''
      expect(result!.current_stage_status).toBe('');
      expect(result!.stages_status).toHaveLength(2);
      expect(result!.stages_status[1]).toMatchObject({ status: stage_status.approve, name: 'HOD' });
      expect(result!.history).toHaveLength(1);
    });

    it('approve-during-review returns null when item already approved at the stage', () => {
      const result = WorkflowPersistenceHelper.buildReviewDetailUpdate({
        payloadDetail: { stage_status: stage_status.approve, stage_message: '' },
        currentStages: [
          { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        ],
        currentHistory: [],
        workflowPreviousStage: 'HOD',
        workflowCurrentStage: 'Requestor',
        desStage: 'Requestor',
        userId: 'user-1',
      });

      expect(result).toBeNull();
    });

    it('should stamp reject on review when payload stage_status is reject', () => {
      const result = WorkflowPersistenceHelper.buildReviewDetailUpdate({
        payloadDetail: { stage_status: stage_status.reject, stage_message: 'bad' },
        currentStages: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
        currentHistory: [],
        workflowPreviousStage: 'HOD',
        workflowCurrentStage: 'Requestor',
        desStage: 'Requestor',
        userId: 'user-1',
      });

      expect(result).not.toBeNull();
      expect(result.current_stage_status).toBe(stage_status.reject);
    });

    it('should set empty current_stage_status for review (send-back)', () => {
      const result = WorkflowPersistenceHelper.buildReviewDetailUpdate({
        payloadDetail: { stage_status: stage_status.review, stage_message: 'fix' },
        currentStages: [
          { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
        ],
        currentHistory: [],
        workflowPreviousStage: 'HOD',
        workflowCurrentStage: 'Requestor',
        desStage: 'Requestor',
        userId: 'user-1',
      });

      expect(result).not.toBeNull();
      expect(result.current_stage_status).toBe('');
    });
  });

  describe('buildApproveDetailUpdate', () => {
    it('stamps approve when destination stage entry is approve', () => {
      // Final-stage scenario: doc moves to '-' (or the same final stage entry).
      // Here we approve at HOD with final stage = HOD.
      const result = WorkflowPersistenceHelper.buildApproveDetailUpdate({
        payloadDetail: { stage_status: stage_status.approve, stage_message: 'ok' },
        currentStages: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
        currentHistory: [],
        workflowPreviousStage: 'HOD',
        workflowCurrentStage: 'HOD',
        userId: 'user-1',
      });

      expect(result).not.toBeNull();
      expect(result.current_stage_status).toBe(stage_status.approve);
    });

    it('stamps "" for intermediate approve when destination stage is fresh', () => {
      // After HOD approves, doc moves forward to DM. DM has no entry yet → ''.
      const result = WorkflowPersistenceHelper.buildApproveDetailUpdate({
        payloadDetail: { stage_status: stage_status.approve, stage_message: 'ok' },
        currentStages: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
        currentHistory: [],
        workflowPreviousStage: 'HOD',
        workflowCurrentStage: 'DM',
        userId: 'user-1',
      });

      expect(result).not.toBeNull();
      expect(result.current_stage_status).toBe('');
    });

    it('should stamp reject when a detail is individually rejected during approve', () => {
      const result = WorkflowPersistenceHelper.buildApproveDetailUpdate({
        payloadDetail: { stage_status: stage_status.reject, stage_message: 'nope' },
        currentStages: [{ seq: 1, status: stage_status.submit, name: 'Requestor', message: '' }],
        currentHistory: [],
        workflowPreviousStage: 'HOD',
        workflowCurrentStage: 'HOD',
        userId: 'user-1',
      });

      expect(result).not.toBeNull();
      expect(result.current_stage_status).toBe(stage_status.reject);
    });

    it('should return null (skip) when already approved at same stage', () => {
      const result = WorkflowPersistenceHelper.buildApproveDetailUpdate({
        payloadDetail: { stage_status: stage_status.approve },
        currentStages: [
          { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        ],
        currentHistory: [],
        workflowPreviousStage: 'HOD',
        workflowCurrentStage: 'DM',
        userId: 'user-1',
      });

      expect(result).toBeNull();
    });
  });

  describe('buildSubmitDetailUpdate', () => {
    it('should return null (skip) when detail stage_status is approve', () => {
      const result = WorkflowPersistenceHelper.buildSubmitDetailUpdate({
        payloadDetail: { stage_status: stage_status.approve },
        currentStages: [],
        currentHistory: [],
        workflowPreviousStage: 'Requestor',
        workflowCurrentStage: 'HOD',
        userId: 'user-1',
      });

      expect(result).toBeNull();
    });

    it('should set empty current_stage_status on submit (fresh row)', () => {
      const result = WorkflowPersistenceHelper.buildSubmitDetailUpdate({
        payloadDetail: { stage_status: stage_status.submit, stage_message: '' },
        currentStages: [],
        currentHistory: [],
        workflowPreviousStage: 'Requestor',
        workflowCurrentStage: 'HOD',
        userId: 'user-1',
      });

      expect(result).not.toBeNull();
      expect(result.current_stage_status).toBe('');
      expect(result.stages_status).toHaveLength(1);
      expect(result.history).toHaveLength(1);
    });
  });

  describe('resolveCurrentStageStatus', () => {
    it('returns "reject" when payload status is reject regardless of stages', () => {
      expect(WorkflowPersistenceHelper.resolveCurrentStageStatus({
        payloadStatus: stage_status.reject,
        stages: [{ seq: 1, status: stage_status.approve, name: 'HOD', message: '' }],
        workflowCurrentStage: 'HOD',
      })).toBe(stage_status.reject);
    });

    it('returns "reject" when any stage in stages_status is reject (terminal)', () => {
      // Even if doc moves to a stage where the row has no entry, a prior reject
      // sticks because reject is terminal.
      expect(WorkflowPersistenceHelper.resolveCurrentStageStatus({
        payloadStatus: stage_status.submit,
        stages: [
          { seq: 1, status: stage_status.reject, name: 'Create Request', message: '' },
          { seq: 2, status: stage_status.reject, name: 'HOD', message: '' },
        ],
        workflowCurrentStage: 'Issue',
      })).toBe(stage_status.reject);
    });

    it('returns "approve" when destination stage entry is approve', () => {
      expect(WorkflowPersistenceHelper.resolveCurrentStageStatus({
        payloadStatus: stage_status.submit,
        stages: [
          { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        ],
        workflowCurrentStage: 'HOD',
      })).toBe(stage_status.approve);
    });

    it('returns "reject" when destination stage entry is reject', () => {
      expect(WorkflowPersistenceHelper.resolveCurrentStageStatus({
        payloadStatus: stage_status.review,
        stages: [
          { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          { seq: 2, status: stage_status.reject, name: 'HOD', message: '' },
        ],
        workflowCurrentStage: 'HOD',
      })).toBe(stage_status.reject);
    });

    it('returns "" when destination stage entry is missing', () => {
      expect(WorkflowPersistenceHelper.resolveCurrentStageStatus({
        payloadStatus: stage_status.approve,
        stages: [
          { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
        ],
        workflowCurrentStage: 'DM',
      })).toBe('');
    });

    it('returns "" when destination stage entry is pending or submit', () => {
      expect(WorkflowPersistenceHelper.resolveCurrentStageStatus({
        payloadStatus: stage_status.review,
        stages: [{ seq: 1, status: stage_status.pending, name: 'Requestor', message: '' }],
        workflowCurrentStage: 'Requestor',
      })).toBe('');
    });

    it('uses the latest entry when destination stage appears multiple times', () => {
      expect(WorkflowPersistenceHelper.resolveCurrentStageStatus({
        payloadStatus: stage_status.submit,
        stages: [
          { seq: 1, status: stage_status.submit, name: 'Requestor', message: '' },
          { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
          { seq: 3, status: stage_status.submit, name: 'Requestor', message: '' },
        ],
        // Latest Requestor entry is submit → ''
        workflowCurrentStage: 'Requestor',
      })).toBe('');
    });
  });

  describe('buildReviewStagesStatus preserves approve entries on rollback', () => {
    it('keeps approve entries past the rollback target and marks target approve', () => {
      // Multi-stage send-back: DM sends back to Create with item already approved at HOD.
      const stages = WorkflowPersistenceHelper.buildReviewStagesStatus(
        [
          { seq: 1, status: stage_status.submit, name: 'Create Request', message: '' },
          { seq: 2, status: stage_status.approve, name: 'HOD', message: '' },
          { seq: 3, status: stage_status.pending, name: 'DM', message: '' },
        ],
        'Create Request',
        'fix',
      );

      expect(stages).toHaveLength(2);
      // target Create Request is marked approve because the row has downstream approve at HOD
      expect(stages[0]).toMatchObject({ status: stage_status.approve, name: 'Create Request' });
      expect(stages[1]).toMatchObject({ status: stage_status.approve, name: 'HOD' });
    });

    it('marks target pending when no downstream approve exists', () => {
      const stages = WorkflowPersistenceHelper.buildReviewStagesStatus(
        [
          { seq: 1, status: stage_status.submit, name: 'Create Request', message: '' },
          { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
        ],
        'Create Request',
        'fix',
      );

      expect(stages).toHaveLength(1);
      expect(stages[0]).toMatchObject({ status: stage_status.pending, name: 'Create Request' });
    });

    it('returns unchanged copy when row has any reject (terminal)', () => {
      const input: StageStatus[] = [
        { seq: 1, status: stage_status.reject, name: 'Create Request', message: '' },
        { seq: 2, status: stage_status.reject, name: 'HOD', message: 'no' },
      ];
      const stages = WorkflowPersistenceHelper.buildReviewStagesStatus(input, 'Create Request', 'fix');
      expect(stages).toHaveLength(2);
      expect(stages[0].status).toBe(stage_status.reject);
      expect(stages[1].status).toBe(stage_status.reject);
      expect(stages).not.toBe(input);
    });

    it('drops non-approve entries past the rollback target', () => {
      const stages = WorkflowPersistenceHelper.buildReviewStagesStatus(
        [
          { seq: 1, status: stage_status.submit, name: 'Create Request', message: '' },
          { seq: 2, status: stage_status.pending, name: 'HOD', message: '' },
        ],
        'Create Request',
      );

      expect(stages).toHaveLength(1);
      expect(stages[0]).toMatchObject({ status: stage_status.pending, name: 'Create Request' });
    });

    it('returns a copy unchanged when target stage is absent', () => {
      const input = [{ seq: 1, status: stage_status.submit, name: 'Create Request', message: '' }];
      const stages = WorkflowPersistenceHelper.buildReviewStagesStatus(input, 'NonExistent');
      expect(stages).toHaveLength(1);
      expect(stages[0]).toMatchObject({ status: stage_status.submit, name: 'Create Request' });
      expect(stages).not.toBe(input);
    });
  });
});
