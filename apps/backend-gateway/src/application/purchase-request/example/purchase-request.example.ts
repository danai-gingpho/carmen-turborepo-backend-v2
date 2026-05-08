export const EXAMPLE_PURCHASE_REQUEST = {
  pr_date: '2025-06-13T15:30:00Z',
  description: 'Purchase request for office supplies',
  workflow_id: '0090b76d-e4f4-415c-8a1b-4b4f06fc2ecb',
  workflow_obj: {
    status: 'pending',
    assigned_to: 'user123'
  },
  workflow_history: [
    {
      status: 'draft',
      timestamp: '2023-10-01',
      user: 'user123'
    },
    {
      status: 'pending',
      timestamp: '2023-10-02',
      user: 'user456'
    }
  ],
  current_workflow_status: 'pending',
  pr_status: 'draft',
  requestor_id: '123e4567-e89b-12d3-a456-426614174002',
  requestor_name: 'John Doe',
  department_id: '123e4567-e89b-12d3-a456-426614174003',
  department_name: 'Procurement',
  is_active: true,
  doc_version: 1.0,
  note: 'Urgent request',
  info: {
    priority: 'high',
    budget_code: 'BUD-2023-001'
  },
  dimension: {
    cost_center: 'CC-001',
    project: 'Project A'
  },
  created_at: '2023-10-01T00:00:00Z',
  created_by_id: '123e4567-e89b-12d3-a456-426614174004',
  updated_at: '2023-10-02T00:00:00Z',
  updated_by_id: '123e4567-e89b-12d3-a456-426614174005',
  purchase_request_detail: {
    add: [
      {
        location_id: '3ded4758-46f5-4995-bd0b-69f7ef464f92',
        location_name: 'Warehouse A',
        product_id: '0f9955f0-2f5b-437d-a787-7c79a043da38',
        product_name: 'Laptop',
        vendor_id: '82756e45-6354-4a6f-b3ee-c0b0a4ec6e61',
        vendor_name: 'Vendor A',
        price_list_id: '1c5b5aa8-e1b4-4071-9de4-3c8a6dc56178',
        description: 'High-performance laptop',
        requested_qty: 5,
        requested_unit_id: '4b84205f-5102-41fa-8a18-42b687a7956e',
        requested_unit_name: 'Piece',
        approved_qty: 5,
        approved_unit_id: 'ea321636-59f5-4a9e-b6c0-42024156993e',
        approved_unit_name: 'Piece',
        currency_id: '01e9b558-3c17-42b0-b95d-2aece05ebd29',
        exchange_rate: 1.0,
        exchange_rate_date: '2023-10-01T00:00:00Z',
        price: 1000.00,
        total_price: 5000.00,
        foc: 12,
        foc_unit_id: 'ea321636-59f5-4a9e-b6c0-42024156993e',
        foc_unit_name: 'Piece',
        tax_profile_id: '01e9b558-3c17-42b0-b95d-2aece05ebd29',
        tax_profile_name: 'VAT 7%',
        tax_rate: 7.00,
        tax_amount: 350.00,
        is_tax_adjustment: false,
        is_discount: false,
        discount_rate: 0.00,
        discount_amount: 0.00,
        is_discount_adjustment: false,
        is_active: true,
        note: 'Approved',
        info: {
            specifications: '16GB RAM, 512GB SSD'
        },
        dimension: {
            cost_center: 'CC-001',
            project: 'Project A'
        }
      }
    ]
  }
}