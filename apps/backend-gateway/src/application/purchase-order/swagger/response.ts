import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Embedded Schemas ====================

export class VendorEmbeddedResponseDto {
  @ApiPropertyOptional({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'ABC Supplies Co.' })
  name?: string;

  @ApiPropertyOptional({ description: 'Vendor code', example: 'VND-001' })
  code?: string;
}

export class CurrencyEmbeddedResponseDto {
  @ApiPropertyOptional({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id?: string;

  @ApiPropertyOptional({ description: 'Currency name', example: 'Thai Baht' })
  name?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  code?: string;

  @ApiPropertyOptional({ description: 'Currency symbol', example: '฿' })
  symbol?: string;
}

// ==================== PO Detail Response ====================

export class PurchaseOrderDetailItemResponseDto {
  @ApiProperty({ description: 'Detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Line item sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Tomatoes' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'มะเขือเทศ' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'SKU-TOM-001' })
  product_sku?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Fresh vegetables' })
  description?: string;

  @ApiPropertyOptional({ description: 'Order quantity', example: 100 })
  order_qty?: number;

  @ApiPropertyOptional({ description: 'Order unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  order_unit_id?: string;

  @ApiPropertyOptional({ description: 'Order unit name', example: 'kg' })
  order_unit_name?: string;

  @ApiPropertyOptional({ description: 'Base quantity', example: 100 })
  base_qty?: number;

  @ApiPropertyOptional({ description: 'Base unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  base_unit_id?: string;

  @ApiPropertyOptional({ description: 'Base unit name', example: 'kg' })
  base_unit_name?: string;

  @ApiPropertyOptional({ description: 'Unit price', example: 50.0 })
  unit_price?: number;

  @ApiPropertyOptional({ description: 'Sub total price', example: 5000.0 })
  sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Base sub total price', example: 5000.0 })
  base_sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Whether the item is free of charge', example: false })
  is_foc?: boolean;

  @ApiPropertyOptional({ description: 'Whether tax is included in the price', example: true })
  is_tax_included?: boolean;

  @ApiPropertyOptional({ description: 'Tax rate', example: 7.0 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Tax amount', example: 350.0 })
  tax_amount?: number;

  @ApiPropertyOptional({ description: 'Discount rate', example: 5.0 })
  discount_rate?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 250.0 })
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Net amount', example: 5100.0 })
  net_amount?: number;

  @ApiPropertyOptional({ description: 'Base net amount', example: 5100.0 })
  base_net_amount?: number;

  @ApiPropertyOptional({ description: 'Total price', example: 5350.0 })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Base total price', example: 5350.0 })
  base_total_price?: number;

  @ApiPropertyOptional({ description: 'Current stage status set by approver', example: 'approve', enum: ['submit', 'pending', 'approve', 'reject', 'review'] })
  current_stage_status?: string;

  @ApiPropertyOptional({ description: 'History of stage status changes (JSON array)', example: [{ seq: 1, stage: 'HOD', status: 'approve', by: { id: '...', name: 'User A' }, at: '2026-03-10T10:00:00Z' }] })
  stages_status?: unknown;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;
}

// ==================== PO Detail Response (findOne) ====================

export class PurchaseOrderDetailResponseDto {
  @ApiProperty({ description: 'Purchase order ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'User role for this PO (create, approve, purchase, view_only, issue)', example: 'approve', enum: ['create', 'approve', 'purchase', 'view_only', 'issue'] })
  role: string;

  @ApiPropertyOptional({ description: 'Purchase order number', example: 'PO260301001' })
  po_no?: string;

  @ApiPropertyOptional({ description: 'Purchase order status', example: 'draft', enum: ['draft', 'in_progress', 'approved', 'completed', 'cancelled', 'voided'] })
  po_status?: string;

  @ApiPropertyOptional({ description: 'Purchase order type', example: 'purchase_request', enum: ['manual', 'purchase_request'] })
  po_type?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'PO for kitchen supplies' })
  description?: string;

  @ApiPropertyOptional({ description: 'Order date', example: '2026-03-10T00:00:00.000Z' })
  order_date?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date', example: '2026-03-17T00:00:00.000Z' })
  delivery_date?: string;

  @ApiPropertyOptional({ description: 'Approval date', example: '2026-03-15T00:00:00.000Z' })
  approval_date?: string;

  @ApiPropertyOptional({ description: 'Vendor ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'Fresh Farm Supplies Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Vendor details', type: VendorEmbeddedResponseDto })
  vendor?: VendorEmbeddedResponseDto;

  @ApiPropertyOptional({ description: 'Currency ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Currency details', type: CurrencyEmbeddedResponseDto })
  currency?: CurrencyEmbeddedResponseDto;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Total quantity', example: 80 })
  total_qty?: number;

  @ApiPropertyOptional({ description: 'Total price', example: 25000.0 })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Total tax', example: 1750.0 })
  total_tax?: number;

  @ApiPropertyOptional({ description: 'Total amount', example: 26750.0 })
  total_amount?: number;

  @ApiPropertyOptional({ description: 'Vendor email', example: 'vendor@example.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Buyer ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  buyer_id?: string;

  @ApiPropertyOptional({ description: 'Buyer name', example: 'Jane Smith' })
  buyer_name?: string;

  @ApiPropertyOptional({ description: 'Credit term ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  credit_term_id?: string;

  @ApiPropertyOptional({ description: 'Credit term name', example: 'Net 30' })
  credit_term_name?: string;

  @ApiPropertyOptional({ description: 'Credit term value (days)', example: 30 })
  credit_term_value?: number;

  @ApiPropertyOptional({ description: 'Remarks', example: 'Urgent order' })
  remarks?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Deliver to back entrance' })
  note?: string;

  // Workflow
  @ApiPropertyOptional({ description: 'Workflow ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({ description: 'Workflow name', example: 'PO Approval Workflow' })
  workflow_name?: string;

  @ApiPropertyOptional({ description: 'Workflow current stage', example: 'purchase' })
  workflow_current_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow previous stage', example: 'draft' })
  workflow_previous_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow next stage', example: 'approve' })
  workflow_next_stage?: string;

  @ApiPropertyOptional({ description: 'User actions for current stage (JSON)' })
  user_action?: unknown;

  @ApiPropertyOptional({ description: 'Last action performed', example: 'submitted' })
  last_action?: string;

  @ApiPropertyOptional({ description: 'Last action timestamp', example: '2026-03-10T00:00:00.000Z' })
  last_action_at_date?: string;

  @ApiPropertyOptional({ description: 'Last action by user ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  last_action_by_id?: string;

  @ApiPropertyOptional({ description: 'Last action by user name', example: 'Jane Smith' })
  last_action_by_name?: string;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Whether the purchase order is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: string;

  @ApiPropertyOptional({ description: 'Purchase order detail line items', type: [PurchaseOrderDetailItemResponseDto] })
  purchase_order_detail?: PurchaseOrderDetailItemResponseDto[];
}

// ==================== PO List Response (findAll) ====================

export class PurchaseOrderListItemResponseDto {
  @ApiProperty({ description: 'Purchase order ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Purchase order number', example: 'PO-2026-0001' })
  po_no?: string;

  @ApiPropertyOptional({ description: 'Purchase order status', example: 'draft' })
  po_status?: string;

  @ApiPropertyOptional({ description: 'Purchase order type', example: 'purchase_request', enum: ['manual', 'purchase_request'] })
  po_type?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'PO for kitchen supplies' })
  description?: string;

  @ApiPropertyOptional({ description: 'Order date', example: '2026-03-10T00:00:00.000Z' })
  order_date?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date', example: '2026-03-17T00:00:00.000Z' })
  delivery_date?: string;

  @ApiPropertyOptional({ description: 'Vendor ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'ABC Supplies Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Buyer name', example: 'Jane Smith' })
  buyer_name?: string;

  @ApiPropertyOptional({ description: 'Total quantity', example: 500 })
  total_qty?: number;

  @ApiPropertyOptional({ description: 'Total price', example: 25000.0 })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Total tax', example: 1750.0 })
  total_tax?: number;

  @ApiPropertyOptional({ description: 'Net amount', example: 23750.0 })
  net_amount?: number;

  @ApiPropertyOptional({ description: 'Base net amount', example: 23750.0 })
  base_net_amount?: number;

  @ApiPropertyOptional({ description: 'Total amount', example: 25500.0 })
  total_amount?: number;

  @ApiPropertyOptional({ description: 'Base total amount', example: 25500.0 })
  base_total_amount?: number;

  @ApiPropertyOptional({ description: 'Workflow current stage', example: 'draft' })
  workflow_current_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow next stage', example: 'approval' })
  workflow_next_stage?: string;

  @ApiPropertyOptional({ description: 'Last action performed', example: 'submitted' })
  last_action?: string;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: string;
}

export class PurchaseOrderListResponseDto {
  @ApiProperty({ description: 'List of purchase orders', type: [PurchaseOrderListItemResponseDto] })
  data: PurchaseOrderListItemResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

// ==================== Group PR Response ====================

export class GroupPrWorkflowResponseDto {
  @ApiProperty({ description: 'Workflow ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Workflow name', example: 'PO Approval Workflow' })
  name: string;
}

export class GroupPrProductResponseDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Fresh Tomatoes' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 50 })
  qty?: number;

  @ApiPropertyOptional({ description: 'Price per unit', example: 45 })
  price_per_unit?: number;

  @ApiPropertyOptional({ description: 'Total price', example: 2250 })
  total?: number;

  @ApiPropertyOptional({ description: 'Base total price', example: 2250 })
  base_total_price?: number;
}

export class GroupPrGroupItemResponseDto {
  @ApiProperty({ description: 'Draft PO number', example: '#01' })
  po_no: string;

  @ApiPropertyOptional({ description: 'Delivery date', example: '2026-04-01' })
  delivery_date?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'Fresh Farm Supplies Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Total price', example: 2250 })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Base price', example: 2250 })
  base_price?: number;

  @ApiPropertyOptional({ description: 'Products in this group', type: [GroupPrProductResponseDto] })
  products?: GroupPrProductResponseDto[];

  @ApiPropertyOptional({ description: 'PR numbers included', type: [String], example: ['PR-2026-0001'] })
  pr?: string[];
}

export class GroupPrForPoResponseDto {
  @ApiPropertyOptional({ description: 'Resolved workflow', type: GroupPrWorkflowResponseDto })
  workflow?: GroupPrWorkflowResponseDto;

  @ApiProperty({ description: 'Grouped PO previews', type: [GroupPrGroupItemResponseDto] })
  groups: GroupPrGroupItemResponseDto[];
}

// ==================== Confirm PR Response ====================

export class ConfirmPrCreatedPoResponseDto {
  @ApiProperty({ description: 'Purchase order ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Purchase order number', example: 'PO260301001' })
  po_no?: string;

  @ApiPropertyOptional({ description: 'Vendor ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'Fresh Farm Supplies Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Delivery date', example: '2026-04-01T00:00:00.000Z' })
  delivery_date?: string;

  @ApiPropertyOptional({ description: 'Currency ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Total quantity', example: 80 })
  total_qty?: number;

  @ApiPropertyOptional({ description: 'Total price', example: 3600 })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Total tax', example: 252 })
  total_tax?: number;

  @ApiPropertyOptional({ description: 'Total amount', example: 3852 })
  total_amount?: number;

  @ApiPropertyOptional({ description: 'Number of line items', example: 2 })
  items_count?: number;
}

export class ConfirmPrSummaryResponseDto {
  @ApiProperty({ description: 'Total POs created', example: 1 })
  total_pos_created: number;

  @ApiProperty({ description: 'Total PRs processed', example: 2 })
  total_prs_processed: number;

  @ApiProperty({ description: 'Total PR details processed', example: 5 })
  total_pr_details_processed: number;
}

export class ConfirmPrToPoResponseDto {
  @ApiProperty({ description: 'Created purchase orders', type: [ConfirmPrCreatedPoResponseDto] })
  purchase_orders: ConfirmPrCreatedPoResponseDto[];

  @ApiProperty({ description: 'Summary of the operation', type: ConfirmPrSummaryResponseDto })
  summary: ConfirmPrSummaryResponseDto;
}

// ==================== Previous Stages Response ====================

export class PurchaseOrderPreviousStagesResponseDto {
  @ApiProperty({
    description: 'Numbered map of workflow stages before the current stage',
    example: { '1': 'Create Request', '2': 'HOD Approval', '3': 'Purchaser' },
    type: 'object',
    additionalProperties: { type: 'string' },
  })
  stages: Record<string, string>;
}

// ==================== Mutation Response ====================

export class PurchaseOrderMutationResponseDto {
  @ApiProperty({ description: 'Purchase order ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
