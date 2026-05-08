export const EXAMPLE_CREATE_PO = {
  stage_role: 'create',
  details: {
    vendor_id: 'e0363f5a-3637-4d27-a421-8693550aa816',
    vendor_name: 'Fresh Farm Supplies Co.',
    delivery_date: '2026-04-01T00:00:00.000Z',
    currency_id: '93dabe25-1668-4c5b-bceb-3e0b83b78002',
    currency_code: 'THB',
    exchange_rate: 1,
    description: 'PO for kitchen raw materials - March 2026',
    order_date: '2026-03-20T00:00:00.000Z',
    credit_term_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    credit_term_name: 'Net 30',
    credit_term_value: 30,
    buyer_id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    buyer_name: 'Jane Smith',
    email: 'vendor@freshfarm.com',
    remarks: 'Delivery before 10:00 AM',
    note: 'Deliver to back entrance - Kitchen receiving',
    purchase_order_detail: {
      add: [
      {
        sequence: 1,
        product_id: 'bb96415b-dff0-40ec-aa2f-2b4099418314',
        product_code: 'PRD-TOM-001',
        product_name: 'Fresh Tomatoes',
        product_local_name: 'มะเขือเทศสด',
        product_sku: 'SKU-TOM-001',
        order_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
        order_unit_name: 'kg',
        order_unit_conversion_factor: 1,
        order_qty: 50,
        base_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
        base_unit_name: 'kg',
        base_qty: 50,
        price: 45,
        sub_total_price: 2250,
        net_amount: 2250,
        total_price: 2407.5,
        tax_profile_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        tax_profile_name: 'VAT 7%',
        tax_rate: 7,
        tax_amount: 157.5,
        discount_rate: 0,
        discount_amount: 0,
        is_foc: false,
        pr_detail: [
          {
            pr_detail_id: '6457d871-f8fc-4b56-b4ab-0173297caab5',
            order_qty: 50,
            order_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
            order_unit_name: 'kg',
            order_base_qty: 50,
          },
        ],
        description: 'Fresh tomatoes for kitchen',
      },
      {
        sequence: 2,
        product_id: 'cc07526c-1a4b-41d1-b925-3c5a66812345',
        product_code: 'PRD-ONI-001',
        product_name: 'Yellow Onions',
        product_local_name: 'หัวหอมใหญ่',
        product_sku: 'SKU-ONI-001',
        order_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
        order_unit_name: 'kg',
        order_unit_conversion_factor: 1,
        order_qty: 30,
        base_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
        base_unit_name: 'kg',
        base_qty: 30,
        price: 35,
        sub_total_price: 1050,
        net_amount: 997.5,
        total_price: 1067.33,
        tax_rate: 7,
        tax_amount: 69.83,
        discount_rate: 5,
        discount_amount: 52.5,
        is_foc: false,
        pr_detail: [
          {
            pr_detail_id: '8679f093-h0he-6d78-d6cd-2395409decd7',
            order_qty: 30,
            order_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
            order_unit_name: 'kg',
            order_base_qty: 30,
          },
        ],
        description: 'Yellow onions for daily use',
      },
    ],
    },
  },
};

export const EXAMPLE_SAVE_PO = {
  stage_role: 'create',
  details: {
    vendor_id: 'e0363f5a-3637-4d27-a421-8693550aa816',
  vendor_name: 'Fresh Farm Supplies Co.',
  delivery_date: '2026-04-05T00:00:00.000Z',
  currency_id: '93dabe25-1668-4c5b-bceb-3e0b83b78002',
  currency_code: 'THB',
  exchange_rate: 1,
  description: 'Updated PO - added new items',
  credit_term_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  credit_term_name: 'Net 30',
  credit_term_value: 30,
  buyer_name: 'Jane Smith',
  email: 'vendor@freshfarm.com',
  remarks: 'Urgent delivery required',
  note: 'Deliver to back entrance',
  purchase_order_detail: {
    add: [
      {
        sequence: 3,
        product_id: 'dd18637d-2b5c-52e2-ca36-4d6b77923456',
        product_code: 'PRD-CAR-001',
        product_name: 'Carrots',
        product_local_name: 'แครอท',
        order_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
        order_unit_name: 'kg',
        order_unit_conversion_factor: 1,
        order_qty: 20,
        base_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
        base_unit_name: 'kg',
        base_qty: 20,
        price: 40,
        sub_total_price: 800,
        net_amount: 800,
        total_price: 856,
        tax_rate: 7,
        tax_amount: 56,
        discount_rate: 0,
        discount_amount: 0,
        is_foc: false,
        pr_detail: [
          {
            pr_detail_id: '8679f093-h0he-6d78-d6cd-2395409decd7',
            order_qty: 20,
            order_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
            order_unit_name: 'kg',
            order_base_qty: 20,
          },
        ],
        description: 'Fresh carrots',
      },
    ],
    update: [
      {
        id: 'aa000000-0000-0000-0000-000000000001',
        sequence: 1,
        product_id: 'bb96415b-dff0-40ec-aa2f-2b4099418314',
        product_code: 'PRD-TOM-001',
        product_name: 'Fresh Tomatoes',
        order_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
        order_unit_name: 'kg',
        order_unit_conversion_factor: 1,
        order_qty: 80,
        base_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
        base_unit_name: 'kg',
        base_qty: 80,
        price: 45,
        sub_total_price: 3600,
        net_amount: 3420,
        total_price: 3659.4,
        tax_rate: 7,
        tax_amount: 239.4,
        discount_rate: 5,
        discount_amount: 180,
        is_foc: false,
        pr_detail: [
          {
            pr_detail_id: '6457d871-f8fc-4b56-b4ab-0173297caab5',
            order_qty: 80,
            order_unit_id: 'c03abcb6-8a3a-4576-85f0-0e2df8d34bf5',
            order_unit_name: 'kg',
            order_base_qty: 80,
          },
        ],
        description: 'Fresh tomatoes - qty increased',
        note: 'Grade A only',
      },
    ],
    remove: [
      { id: 'bb000000-0000-0000-0000-000000000002' },
    ],
    },
  },
};

export const EXAMPLE_SAVE_PO_APPROVE = {
  stage_role: 'approve',
  details: [
    {
      id: 'aa000000-0000-0000-0000-000000000001',
      current_stage_status: 'approve',
    },
    {
      id: 'dd000000-0000-0000-0000-000000000003',
      current_stage_status: 'approve',
    },
  ],
};

export const EXAMPLE_APPROVE_PO = {
  stage_role: 'approve',
  details: [
    {
      id: 'aa000000-0000-0000-0000-000000000001',
      stage_status: 'approve',
    },
    {
      id: 'dd000000-0000-0000-0000-000000000003',
      stage_status: 'approve',
    },
  ],
};

export const EXAMPLE_REJECT_PO = {
  stage_role: 'approve',
  details: [
    {
      id: 'aa000000-0000-0000-0000-000000000001',
      stage_status: 'reject',
      stage_message: 'Price is too high, please renegotiate with vendor',
    },
  ],
};

export const EXAMPLE_REVIEW_PO = {
  stage_role: 'approve',
  des_stage: 'purchase',
  details: [
    {
      id: 'aa000000-0000-0000-0000-000000000001',
      stage_status: 'review',
      stage_message: 'Please verify the delivery date with vendor and update pricing',
    },
  ],
};

export const EXAMPLE_GROUP_PR_FOR_PO = {
  workflow_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  pr_ids: [
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  ],
};

export const EXAMPLE_CONFIRM_PR_TO_PO = {
  workflow_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  pr_ids: [
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  ],
};
