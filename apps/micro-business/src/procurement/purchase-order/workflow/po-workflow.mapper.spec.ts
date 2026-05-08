import { poToWorkflowDocument } from './po-workflow.mapper';

describe('poToWorkflowDocument', () => {
  const base = {
    id: 'po-1',
    workflow_id: 'wf-1',
    workflow_current_stage: 'FC',
    workflow_previous_stage: 'HOD',
    buyer_id: 'buyer-1',
    created_by_id: 'creator-1',
  };

  it('emits total_amount and department (from creatorDepartment.id)', () => {
    const doc = poToWorkflowDocument(
      {
        ...base,
        purchase_order_detail: [{ total_price: 1000 }, { total_price: 500 }],
      },
      { id: 'dept-uuid-2', name: 'Procurement' },
    );

    expect(doc.navigation_request_data).toEqual({
      total_amount: 1500,
      department: 'dept-uuid-2',
    });
  });

  it('emits department: null when creatorDepartment is null', () => {
    const doc = poToWorkflowDocument(
      { ...base, purchase_order_detail: [] },
      null,
    );
    expect(doc.navigation_request_data.department).toBeNull();
    expect(doc.navigation_request_data.total_amount).toBe(0);
  });

  it('falls back to tb_purchase_order_detail when purchase_order_detail is absent', () => {
    const doc = poToWorkflowDocument(
      { ...base, tb_purchase_order_detail: [{ total_price: 42 }] },
      { id: 'dept-uuid-2', name: 'Procurement' },
    );
    expect(doc.navigation_request_data.total_amount).toBe(42);
  });
});
