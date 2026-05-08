import { prToWorkflowDocument } from './pr-workflow.mapper';

describe('prToWorkflowDocument', () => {
  const base = {
    id: 'pr-1',
    workflow_id: 'wf-1',
    workflow_current_stage: 'HOD',
    workflow_previous_stage: 'Requestor',
    requestor_id: 'user-1',
    department_id: 'dept-uuid-1',
    department_name: 'Kitchen',
  };

  it('emits total_amount and department in navigation_request_data', () => {
    const doc = prToWorkflowDocument({
      ...base,
      purchase_request_detail: [
        { total_price: '100.5' },
        { total_price: 250 },
      ],
    });

    expect(doc.navigation_request_data).toEqual({
      total_amount: 350.5,
      department: 'dept-uuid-1',
    });
  });

  it('falls back to tb_purchase_request_detail when purchase_request_detail is absent', () => {
    const doc = prToWorkflowDocument({
      ...base,
      tb_purchase_request_detail: [{ total_price: 99 }],
    });
    expect(doc.navigation_request_data.total_amount).toBe(99);
  });

  it('emits department: null when department_id is missing', () => {
    const doc = prToWorkflowDocument({
      ...base,
      department_id: null,
      purchase_request_detail: [],
    });
    expect(doc.navigation_request_data.department).toBeNull();
    expect(doc.navigation_request_data.total_amount).toBe(0);
  });

  it('throws when workflow_id is missing', () => {
    expect(() =>
      prToWorkflowDocument({ ...base, workflow_id: null }),
    ).toThrow(/has no workflow_id/);
  });
});
