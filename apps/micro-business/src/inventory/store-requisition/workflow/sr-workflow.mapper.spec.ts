import { srToWorkflowDocument } from './sr-workflow.mapper';

describe('srToWorkflowDocument', () => {
  const base = {
    id: 'sr-1',
    workflow_id: 'wf-1',
    workflow_current_stage: 'HOD',
    workflow_previous_stage: 'Requestor',
    requestor_id: 'user-1',
    department_id: 'dept-uuid-3',
    department_name: 'F&B',
  };

  it('computes total_amount from approved_qty × current average cost per product', async () => {
    const costs: Record<string, number> = {
      'prod-a': 10,
      'prod-b': 25,
    };
    const doc = await srToWorkflowDocument(
      {
        ...base,
        tb_store_requisition_detail: [
          { product_id: 'prod-a', approved_qty: 3, requested_qty: 5 },
          { product_id: 'prod-b', approved_qty: 2, requested_qty: 2 },
        ],
      },
      async (productId: string) => costs[productId] ?? 0,
    );

    // 3*10 + 2*25 = 80
    expect(doc.navigation_request_data).toEqual({
      total_amount: 80,
      department: 'dept-uuid-3',
    });
  });

  it('falls back to requested_qty when approved_qty is missing', async () => {
    const doc = await srToWorkflowDocument(
      {
        ...base,
        tb_store_requisition_detail: [
          { product_id: 'prod-a', requested_qty: 4 },
        ],
      },
      async () => 7,
    );
    expect(doc.navigation_request_data.total_amount).toBe(28);
  });

  it('skips lines with zero qty (no cost lookup)', async () => {
    const lookup = jest.fn().mockResolvedValue(99);
    const doc = await srToWorkflowDocument(
      {
        ...base,
        tb_store_requisition_detail: [
          { product_id: 'prod-a', approved_qty: 0, requested_qty: 0 },
        ],
      },
      lookup,
    );
    expect(doc.navigation_request_data.total_amount).toBe(0);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('emits total_amount: 0 and department: null when no details and no department_id', async () => {
    const doc = await srToWorkflowDocument(
      { ...base, department_id: null },
      async () => 100,
    );
    expect(doc.navigation_request_data).toEqual({
      total_amount: 0,
      department: null,
    });
  });

  it('throws when workflow_id is missing', async () => {
    await expect(
      srToWorkflowDocument({ ...base, workflow_id: null }, async () => 0),
    ).rejects.toThrow(/has no workflow_id/);
  });
});
