import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== PR Detail Linkage ====================

export class PurchaseOrderPrDetailSwaggerDto {
  @ApiProperty({ description: 'PR Detail ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  pr_detail_id: string;

  @ApiProperty({ description: 'Order quantity for this PR detail', example: 10 })
  order_qty: number;

  @ApiProperty({ description: 'Order unit ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  order_unit_id: string;

  @ApiPropertyOptional({ description: 'Order unit name', example: 'kg' })
  order_unit_name?: string;

  @ApiProperty({ description: 'Order base quantity (calculated: order_qty * conversion_factor)', example: 10 })
  order_base_qty: number;

  @ApiPropertyOptional({ description: 'Order base unit ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  order_base_unit_id?: string;

  @ApiPropertyOptional({ description: 'Order base unit name', example: 'kg' })
  order_base_unit_name?: string;
}

// ==================== PO Detail (for Create and Save Add) ====================

export class CreatePurchaseOrderDetailSwaggerDto {
  @ApiProperty({ description: 'Sequence number', example: 1 })
  sequence: number;

  @ApiProperty({ description: 'Product ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product code', example: 'PRD-001' })
  product_code?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Tomatoes' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'มะเขือเทศ' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Product SKU', example: 'SKU-TOM-001' })
  product_sku?: string;

  @ApiProperty({ description: 'Order unit ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  order_unit_id: string;

  @ApiPropertyOptional({ description: 'Order unit name', example: 'kg' })
  order_unit_name?: string;

  @ApiPropertyOptional({ description: 'Order unit conversion factor', example: 1, default: 1 })
  order_unit_conversion_factor?: number;

  @ApiProperty({ description: 'Order quantity', example: 10 })
  order_qty: number;

  @ApiPropertyOptional({ description: 'Base unit ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  base_unit_id?: string;

  @ApiPropertyOptional({ description: 'Base unit name', example: 'kg' })
  base_unit_name?: string;

  @ApiPropertyOptional({ description: 'Base quantity', example: 10 })
  base_qty?: number;

  @ApiPropertyOptional({ description: 'Unit price', example: 50.0, default: 0 })
  price?: number;

  @ApiPropertyOptional({ description: 'Sub total price (price * qty)', example: 500.0, default: 0 })
  sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Net amount (after discount)', example: 475.0, default: 0 })
  net_amount?: number;

  @ApiPropertyOptional({ description: 'Total price (net + tax)', example: 508.25, default: 0 })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Tax profile ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Tax profile name', example: 'VAT 7%' })
  tax_profile_name?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 7.0, default: 0 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Tax amount', example: 33.25, default: 0 })
  tax_amount?: number;

  @ApiPropertyOptional({ description: 'Is tax adjustment', example: false, default: false })
  is_tax_adjustment?: boolean;

  @ApiPropertyOptional({ description: 'Discount rate percentage', example: 5.0, default: 0 })
  discount_rate?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 25.0, default: 0 })
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Is discount adjustment', example: false, default: false })
  is_discount_adjustment?: boolean;

  @ApiPropertyOptional({ description: 'Is FOC (Free of Charge)', example: false, default: false })
  is_foc?: boolean;

  @ApiProperty({
    description: 'PR Detail linkages - connects this PO detail to PR details',
    type: [PurchaseOrderPrDetailSwaggerDto],
  })
  pr_detail: PurchaseOrderPrDetailSwaggerDto[];

  @ApiPropertyOptional({ description: 'Description', example: 'Fresh vegetables' })
  description?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Handle with care' })
  note?: string;
}

export class UpdatePurchaseOrderDetailSwaggerDto extends CreatePurchaseOrderDetailSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID to update', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class RemovePurchaseOrderDetailSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID to remove', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

// ==================== Detail Operations (add/update/remove) ====================

export class PurchaseOrderDetailOperationsSwaggerDto {
  @ApiPropertyOptional({
    description: 'Detail line items to add',
    type: [CreatePurchaseOrderDetailSwaggerDto],
  })
  add?: CreatePurchaseOrderDetailSwaggerDto[];

  @ApiPropertyOptional({
    description: 'Detail line items to update',
    type: [UpdatePurchaseOrderDetailSwaggerDto],
  })
  update?: UpdatePurchaseOrderDetailSwaggerDto[];

  @ApiPropertyOptional({
    description: 'Detail line items to remove',
    type: [RemovePurchaseOrderDetailSwaggerDto],
  })
  remove?: RemovePurchaseOrderDetailSwaggerDto[];
}

// ==================== Create PO Detail Operations ====================

export class CreatePurchaseOrderDetailOperationsSwaggerDto {
  @ApiPropertyOptional({
    description: 'Detail line items to add',
    type: [CreatePurchaseOrderDetailSwaggerDto],
  })
  add?: CreatePurchaseOrderDetailSwaggerDto[];
}

// ==================== Create PO Inner Data ====================

export class CreatePurchaseOrderDataSwaggerDto {
  @ApiPropertyOptional({ description: 'Purchase order type (defaults to manual)', enum: ['manual', 'purchase_request'], default: 'manual', example: 'manual' })
  po_type?: string;

  @ApiProperty({ description: 'Vendor ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id: string;

  @ApiProperty({ description: 'Expected delivery date (ISO 8601)', example: '2026-03-17T00:00:00.000Z' })
  delivery_date: string;

  @ApiProperty({ description: 'Currency ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id: string;

  @ApiPropertyOptional({ description: 'Vendor name (auto-enriched from vendor_id)', example: 'ABC Supplies Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Currency code (auto-enriched from currency_id)', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0, default: 1 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'PO for kitchen supplies' })
  description?: string;

  @ApiPropertyOptional({ description: 'Order date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  order_date?: string;

  @ApiPropertyOptional({ description: 'Credit term ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  credit_term_id?: string;

  @ApiPropertyOptional({ description: 'Credit term name', example: 'Net 30' })
  credit_term_name?: string;

  @ApiPropertyOptional({ description: 'Credit term value in days', example: 30 })
  credit_term_value?: number;

  @ApiPropertyOptional({ description: 'Buyer ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  buyer_id?: string;

  @ApiPropertyOptional({ description: 'Buyer name', example: 'Jane Smith' })
  buyer_name?: string;

  @ApiPropertyOptional({ description: 'Vendor email', format: 'email', example: 'vendor@example.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Remarks', example: 'Urgent order' })
  remarks?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Deliver to back entrance' })
  note?: string;

  @ApiProperty({ description: 'Workflow ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id: string;

  @ApiProperty({
    description: 'Purchase order detail operations (add line items) — at least 1 detail required',
    type: CreatePurchaseOrderDetailOperationsSwaggerDto,
  })
  purchase_order_detail: CreatePurchaseOrderDetailOperationsSwaggerDto;
}

// ==================== Create PO (wrapper) ====================

export class CreatePurchaseOrderSwaggerDto {
  @ApiProperty({ description: 'Stage role', enum: ['create'], example: 'create' })
  stage_role: string;

  @ApiProperty({ description: 'Purchase order data', type: CreatePurchaseOrderDataSwaggerDto })
  details: CreatePurchaseOrderDataSwaggerDto;
}

// ==================== Update PO ====================

export class UpdatePurchaseOrderSwaggerDto {
  @ApiPropertyOptional({ description: 'Purchase order date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  order_date?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date (ISO 8601)', example: '2026-03-17T00:00:00.000Z' })
  delivery_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Updated PO for kitchen supplies' })
  description?: string;

  @ApiPropertyOptional({ description: 'Vendor ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'ABC Supplies Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Currency ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Buyer ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  buyer_id?: string;

  @ApiPropertyOptional({ description: 'Buyer name', example: 'Jane Smith' })
  buyer_name?: string;

  @ApiPropertyOptional({ description: 'Credit term ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  credit_term_id?: string;

  @ApiPropertyOptional({ description: 'Credit term name', example: 'Net 30' })
  credit_term_name?: string;

  @ApiPropertyOptional({ description: 'Credit term value in days', example: 30 })
  credit_term_value?: number;

  @ApiPropertyOptional({ description: 'Vendor email', format: 'email', example: 'vendor@example.com' })
  email?: string;

  @ApiPropertyOptional({ description: 'Remarks', example: 'Urgent order' })
  remarks?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Deliver to back entrance' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;
}

// ==================== Save PO (wrapper) ====================
// For create role: details is an object with header fields + purchase_order_detail
// For approve/purchase role: details is a flat array of [{ id, current_stage_status }]

export class SavePurchaseOrderApproveDetailSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Current stage status', example: 'approve', enum: ['submit', 'pending', 'approve', 'reject', 'review'] })
  current_stage_status?: string;
}

export class SavePurchaseOrderSwaggerDto {
  @ApiProperty({ description: 'Stage role — determines payload shape. "create": details is object with header + purchase_order_detail. Other roles: details is flat array of [{ id, current_stage_status }]', enum: ['create', 'approve', 'purchase', 'view_only', 'issue'], example: 'create' })
  stage_role: string;

  @ApiProperty({ description: 'For create role: object with header fields + purchase_order_detail. For approve/purchase: array of { id, current_stage_status }. See examples.' })
  details: unknown;
}

// ==================== Submit PO ====================

export class SubmitPurchaseOrderDetailSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Stage status', example: 'submit', enum: ['submit', 'pending', 'approve', 'reject', 'review'] })
  stage_status: string;

  @ApiPropertyOptional({ description: 'Stage message', example: null })
  stage_message?: string | null;
}

export class SubmitPurchaseOrderSwaggerDto {
  @ApiProperty({ description: 'Stage role for submit', example: 'create', enum: ['create', 'approve', 'purchase', 'view_only', 'issue'] })
  stage_role: string;

  @ApiProperty({
    description: 'Detail items to submit',
    type: [SubmitPurchaseOrderDetailSwaggerDto],
  })
  details: SubmitPurchaseOrderDetailSwaggerDto[];
}

// ==================== Approve PO ====================

export class ApprovePurchaseOrderDetailSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Stage status', example: 'approve', enum: ['submit', 'pending', 'approve', 'reject', 'review'] })
  stage_status: string;
}

export class ApprovePurchaseOrderSwaggerDto {
  @ApiProperty({ description: 'Stage role for approval', example: 'approve', enum: ['create', 'approve', 'purchase', 'view_only', 'issue'] })
  stage_role: string;

  @ApiProperty({
    description: 'Detail items to approve',
    type: [ApprovePurchaseOrderDetailSwaggerDto],
  })
  details: ApprovePurchaseOrderDetailSwaggerDto[];
}

// ==================== Reject PO ====================

export class RejectPurchaseOrderDetailSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Stage status', example: 'reject', enum: ['submit', 'pending', 'approve', 'reject', 'review'] })
  stage_status: string;

  @ApiPropertyOptional({ description: 'Rejection message', example: 'Price is too high, please renegotiate with vendor' })
  stage_message?: string;
}

export class RejectPurchaseOrderSwaggerDto {
  @ApiProperty({ description: 'Stage role for rejection', example: 'approve', enum: ['create', 'approve', 'purchase', 'view_only', 'issue'] })
  stage_role: string;

  @ApiProperty({
    description: 'Detail items to reject',
    type: [RejectPurchaseOrderDetailSwaggerDto],
  })
  details: RejectPurchaseOrderDetailSwaggerDto[];
}

// ==================== Review PO ====================

export class ReviewPurchaseOrderDetailSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Stage status', example: 'review', enum: ['submit', 'pending', 'approve', 'reject', 'review'] })
  stage_status: string;

  @ApiPropertyOptional({ description: 'Review message', example: 'Please verify the delivery date with vendor' })
  stage_message?: string;
}

export class ReviewPurchaseOrderSwaggerDto {
  @ApiProperty({ description: 'Stage role for review', example: 'approve', enum: ['create', 'approve', 'purchase', 'view_only', 'issue'] })
  stage_role: string;

  @ApiPropertyOptional({ description: 'Target stage to return to', example: 'purchase' })
  des_stage?: string;

  @ApiProperty({
    description: 'Detail items to review',
    type: [ReviewPurchaseOrderDetailSwaggerDto],
  })
  details: ReviewPurchaseOrderDetailSwaggerDto[];
}

// ==================== Group PR for PO ====================

export class GroupPrForPoSwaggerDto {
  @ApiPropertyOptional({ description: 'Workflow ID for PO (auto-resolves purchase_order_workflow if omitted)', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiProperty({ description: 'Array of PR IDs to group for PO creation', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  pr_ids: string[];
}

// ==================== Confirm PR to PO ====================

export class ConfirmPrToPoSwaggerDto {
  @ApiPropertyOptional({ description: 'Workflow ID for PO (auto-resolves purchase_order_workflow if omitted)', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiProperty({ description: 'Array of PR IDs to confirm and create POs from', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  pr_ids: string[];
}
