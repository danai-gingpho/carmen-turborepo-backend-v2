import { WorkflowNavigatorService } from './workflows.navagation.service';
import { RoutingRule, Stage, WorkflowData } from '@/common/workflow/workflow.types';

const action = (active: boolean) => ({
  is_active: active,
  recipients: { next_step: false, requestor: false, current_approve: false },
});

const stage = (name: string): Stage => ({
  sla: '0',
  name,
  sla_unit: 'hours' as Stage['sla_unit'],
  description: '',
  hide_fields: {},
  assigned_users: [],
  available_actions: {
    reject: action(true),
    submit: action(true),
    approve: action(true),
    sendback: action(true),
  },
});

const buildWorkflow = (stages: string[], rules: RoutingRule[] = []): WorkflowData => ({
  stages: stages.map(stage),
  routing_rules: rules,
});

describe('WorkflowNavigatorService routing-rule evaluation', () => {
  describe('default sequential next stage (no rules)', () => {
    it('returns the stage immediately after the current one', () => {
      const nav = new WorkflowNavigatorService(buildWorkflow(['HOD', 'FC', 'GM']), 'HOD');
      expect(nav.getNavigationInfo('HOD').workflow_next_step).toBe('FC');
    });

    it('returns null when current stage is the last one', () => {
      const nav = new WorkflowNavigatorService(buildWorkflow(['HOD', 'GM']), 'GM');
      expect(nav.getNavigationInfo('GM').workflow_next_step).toBeNull();
    });
  });

  describe('NEXT_STAGE action', () => {
    it('jumps to action.parameters.target_stage when rule matches', () => {
      const rules: RoutingRule[] = [
        {
          trigger_stage: 'HOD',
          condition: { field: 'total_amount', operator: 'gte', value: ['10000'] },
          action: { type: 'NEXT_STAGE', parameters: { target_stage: 'GM' } },
        },
      ];
      const nav = new WorkflowNavigatorService(buildWorkflow(['HOD', 'FC', 'GM'], rules), 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 15000 }).workflow_next_step).toBe('GM');
    });

    it('falls back to default next stage when condition is not met', () => {
      const rules: RoutingRule[] = [
        {
          trigger_stage: 'HOD',
          condition: { field: 'total_amount', operator: 'gte', value: ['10000'] },
          action: { type: 'NEXT_STAGE', parameters: { target_stage: 'GM' } },
        },
      ];
      const nav = new WorkflowNavigatorService(buildWorkflow(['HOD', 'FC', 'GM'], rules), 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 5000 }).workflow_next_step).toBe('FC');
    });
  });

  describe('SKIP_STAGE action', () => {
    it('treats SKIP_STAGE the same as NEXT_STAGE — jumps to target_stage', () => {
      const rules: RoutingRule[] = [
        {
          trigger_stage: 'HOD',
          condition: { field: 'total_amount', operator: 'lt', value: ['10000'] },
          action: { type: 'SKIP_STAGE', parameters: { target_stage: 'GM' } },
        },
      ];
      const nav = new WorkflowNavigatorService(buildWorkflow(['HOD', 'FC', 'GM'], rules), 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 5000 }).workflow_next_step).toBe('GM');
    });
  });

  describe('between operator', () => {
    const rules: RoutingRule[] = [
      {
        trigger_stage: 'HOD',
        condition: {
          field: 'total_amount',
          operator: 'between',
          value: [],
          min_value: '1000',
          max_value: '5000',
        },
        action: { type: 'NEXT_STAGE', parameters: { target_stage: 'GM' } },
      },
    ];
    const wf = buildWorkflow(['HOD', 'FC', 'GM'], rules);

    it('matches inside the range', () => {
      const nav = new WorkflowNavigatorService(wf, 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 3000 }).workflow_next_step).toBe('GM');
    });

    it('matches on the lower edge (inclusive)', () => {
      const nav = new WorkflowNavigatorService(wf, 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 1000 }).workflow_next_step).toBe('GM');
    });

    it('matches on the upper edge (inclusive)', () => {
      const nav = new WorkflowNavigatorService(wf, 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 5000 }).workflow_next_step).toBe('GM');
    });

    it('does not match below the range', () => {
      const nav = new WorkflowNavigatorService(wf, 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 999 }).workflow_next_step).toBe('FC');
    });

    it('does not match above the range', () => {
      const nav = new WorkflowNavigatorService(wf, 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 5001 }).workflow_next_step).toBe('FC');
    });

    it('returns false (default next stage) when min/max are missing or NaN', () => {
      const badRules: RoutingRule[] = [
        {
          trigger_stage: 'HOD',
          condition: { field: 'total_amount', operator: 'between', value: [] },
          action: { type: 'NEXT_STAGE', parameters: { target_stage: 'GM' } },
        },
      ];
      const nav = new WorkflowNavigatorService(buildWorkflow(['HOD', 'FC', 'GM'], badRules), 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 3000 }).workflow_next_step).toBe('FC');
    });
  });

  describe('other operators (regression)', () => {
    const wf = (op: 'eq' | 'lt' | 'gt' | 'lte' | 'gte' | 'in' | 'not_eq', values: string[]) =>
      buildWorkflow(
        ['HOD', 'FC', 'GM'],
        [
          {
            trigger_stage: 'HOD',
            condition: { field: 'department', operator: op, value: values },
            action: { type: 'NEXT_STAGE', parameters: { target_stage: 'GM' } },
          },
        ],
      );

    it('eq matches when field value is in `value`', () => {
      const nav = new WorkflowNavigatorService(wf('eq', ['dept-a']), 'HOD');
      expect(nav.getNavigationInfo('HOD', { department: 'dept-a' }).workflow_next_step).toBe('GM');
      expect(nav.getNavigationInfo('HOD', { department: 'dept-b' }).workflow_next_step).toBe('FC');
    });

    it('in matches like eq', () => {
      const nav = new WorkflowNavigatorService(wf('in', ['dept-a', 'dept-b']), 'HOD');
      expect(nav.getNavigationInfo('HOD', { department: 'dept-b' }).workflow_next_step).toBe('GM');
    });

    it('not_eq inverts eq', () => {
      const nav = new WorkflowNavigatorService(wf('not_eq', ['dept-a']), 'HOD');
      expect(nav.getNavigationInfo('HOD', { department: 'dept-b' }).workflow_next_step).toBe('GM');
      expect(nav.getNavigationInfo('HOD', { department: 'dept-a' }).workflow_next_step).toBe('FC');
    });
  });

  describe('missing field (e.g. category)', () => {
    it('treats undefined fields as no-match (default next stage)', () => {
      const rules: RoutingRule[] = [
        {
          trigger_stage: 'HOD',
          condition: { field: 'category', operator: 'eq', value: ['food'] },
          action: { type: 'NEXT_STAGE', parameters: { target_stage: 'GM' } },
        },
      ];
      const nav = new WorkflowNavigatorService(buildWorkflow(['HOD', 'FC', 'GM'], rules), 'HOD');
      expect(nav.getNavigationInfo('HOD', { total_amount: 100 }).workflow_next_step).toBe('FC');
    });
  });
});
