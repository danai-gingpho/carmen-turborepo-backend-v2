export const MOCK_PURCHASE_REQUEST_LIST = [
  {
    id: 1,
    number: "PR-2001",
    status: "In-progress",
    workflowStage: 1,
    requestor: "Alice Lee",
    department: "F&B",
    date: "2024-06-01",
    value: "S$1,200.00",
    business_unit: "Grand Hotel Singapore",
    role: "HOD", // Stage 1 requires HOD approval
    lastAction: "Submitted for HOD Review (2024-06-01)",
    prType: "General",
    currency: "SGD",
    exchangeRate: 0.74,
    baseCurrency: "USD",
    baseValue: "$888.00"
  },
  {
    id: 2,
    number: "PR-2002",
    status: "Converted",
    workflowStage: 4,
    requestor: "Bob Tan",
    department: "Housekeeping",
    date: "2024-06-02",
    value: "Rp 12,000,000",
    business_unit: "Business Hotel Jakarta",
    role: "Purchasing", // Stage 4 completed by Purchasing (last approver)
    prType: "Market List",
    currency: "IDR",
    exchangeRate: 0.000067,
    baseCurrency: "USD",
    baseValue: "$800.00"
  },
  {
    id: 3,
    number: "PR-2003",
    status: "In-progress",
    workflowStage: 2,
    requestor: "Charlie Lim",
    department: "Engineering",
    date: "2024-06-03",
    value: "฿21,000.00",
    business_unit: "Boutique Hotel Bangkok",
    role: "Finance", // Stage 2 requires Finance approval
    lastAction: "Approved by HOD, submitted for Finance Review (2024-06-03)",
    prType: "General",
    currency: "THB",
    exchangeRate: 0.029,
    baseCurrency: "USD",
    baseValue: "$600.00"
  },
  {
    id: 9,
    number: "PR-2009",
    status: "In-progress",
    workflowStage: 3,
    requestor: "Ivy Chen",
    department: "IT",
    date: "2024-06-09",
    value: "S$3,375.00",
    business_unit: "Grand Hotel Singapore",
    role: "Purchasing", // Stage 3 requires Purchasing approval
    prType: "Market List",
    currency: "SGD",
    exchangeRate: 0.74,
    baseCurrency: "USD",
    baseValue: "$2,500.00"
  },
  {
    id: 4,
    number: "PR-2004",
    status: "Cancelled",
    workflowStage: -3,
    requestor: "Diana Ong",
    department: "F&B",
    date: "2024-06-04",
    value: "$900.00",
    business_unit: "Grand Hotel Singapore",
    role: "HOD", // Last role that handled before cancellation
    prType: "General",
    currency: "USD",
    exchangeRate: 1.0,
    baseCurrency: "USD",
    baseValue: "$900.00"
  },
  {
    id: 5,
    number: "PR-2005",
    status: "Draft",
    workflowStage: 0,
    requestor: "Eddie Goh",
    department: "Front Office",
    date: "2024-06-05",
    value: "Rp 6,750,000",
    business_unit: "Business Hotel Jakarta",
    role: "Requestor", // Stage 0 is owned by Requestor
    prType: "Market List",
    currency: "IDR",
    exchangeRate: 0.000067,
    baseCurrency: "USD",
    baseValue: "$450.00"
  },
  {
    id: 6,
    number: "PR-2006",
    status: "Rejected",
    workflowStage: -1,
    requestor: "Fiona Chua",
    department: "Housekeeping",
    date: "2024-06-06",
    value: "฿38,500.00",
    business_unit: "Boutique Hotel Bangkok",
    role: "Finance", // Rejected by Finance
    prType: "General",
    currency: "THB",
    exchangeRate: 0.029,
    baseCurrency: "USD",
    baseValue: "$1,100.00"
  },
  {
    id: 7,
    number: "PR-2007",
    status: "In-progress",
    workflowStage: 1,
    requestor: "George Tan",
    department: "F&B",
    date: "2024-06-07",
    value: "S$2,700.00",
    business_unit: "Grand Hotel Singapore",
    role: "HOD", // Stage 1 requires HOD approval
    prType: "Market List",
    currency: "SGD",
    exchangeRate: 0.74,
    baseCurrency: "USD",
    baseValue: "$2,000.00"
  },
  {
    id: 8,
    number: "PR-2008",
    status: "Converted",
    workflowStage: 4,
    requestor: "Helen Lee",
    department: "Engineering",
    date: "2024-06-08",
    value: "Rp 10,500,000",
    business_unit: "Business Hotel Jakarta",
    role: "Purchasing", // Stage 4 completed by Purchasing (last approver)
    prType: "General",
    currency: "IDR",
    exchangeRate: 0.000067,
    baseCurrency: "USD",
    baseValue: "$700.00"
  },
  // Additional PRs for better testing coverage
  {
    id: 10,
    number: "PR-2010",
    status: "Returned",
    workflowStage: 1,
    requestor: "John Smith",
    department: "Kitchen",
    date: "2024-06-10",
    value: "$350.00",
    business_unit: "Grand Hotel Singapore", 
    role: "HOD", // Returned to HOD for changes
    lastAction: "Returned by Finance for additional information (2024-06-10)",
    prType: "General",
    currency: "USD",
    exchangeRate: 1.0,
    baseCurrency: "USD",
    baseValue: "$350.00"
  },
  {
    id: 11,
    number: "PR-2011",
    status: "In-progress",
    workflowStage: 2,
    requestor: "Sarah Wilson",
    department: "Housekeeping",
    date: "2024-06-11",
    value: "Rp 11,250,000",
    business_unit: "Business Hotel Jakarta",
    role: "Finance", // Stage 2 requires Finance approval
    prType: "Market List",
    currency: "IDR",
    exchangeRate: 0.000067,
    baseCurrency: "USD",
    baseValue: "$750.00"
  },
  {
    id: 12,
    number: "PR-2012",
    status: "Completed",
    workflowStage: 4,
    requestor: "Mike Johnson",
    department: "Maintenance",
    date: "2024-06-12",
    value: "฿33,250.00",
    business_unit: "Boutique Hotel Bangkok",
    role: "Purchasing", // Completed by Purchasing
    prType: "General",
    currency: "THB",
    exchangeRate: 0.029,
    baseCurrency: "USD",
    baseValue: "$950.00"
  }
];

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