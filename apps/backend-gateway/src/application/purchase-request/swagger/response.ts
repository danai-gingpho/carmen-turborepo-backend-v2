import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseRequestDetailResponseDto {
  @ApiProperty({ description: 'Detail line item ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Parent purchase request ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  purchase_request_id: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id?: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'LOC-001' })
  location_code?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Warehouse' })
  location_name?: string;

  @ApiPropertyOptional({ description: 'Location type', example: 'inventory' })
  location_type?: string;

  @ApiPropertyOptional({ description: 'Delivery point ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  delivery_point_id?: string;

  @ApiPropertyOptional({ description: 'Delivery point name', example: 'Kitchen Receiving' })
  delivery_point_name?: string;

  @ApiPropertyOptional({ description: 'Delivery date (ISO 8601)', example: '2026-03-15T00:00:00.000Z' })
  delivery_date?: string;

  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Fresh Salmon Fillet' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'เนื้อปลาแซลมอนสด' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Description of the line item', example: 'Fresh salmon fillet, premium grade' })
  description?: string;

  @ApiPropertyOptional({ description: 'Comment for the line item', example: 'Prefer wild-caught' })
  comment?: string;

  @ApiPropertyOptional({ description: 'Inventory unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_unit_id?: string;

  @ApiPropertyOptional({ description: 'Inventory unit name', example: 'KG' })
  inventory_unit_name?: string;

  @ApiPropertyOptional({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'Ocean Fresh Supplies Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Pricelist detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  pricelist_detail_id?: string;

  @ApiPropertyOptional({ description: 'Pricelist number', example: 'PL-2026-0001' })
  pricelist_no?: string;

  @ApiPropertyOptional({ description: 'Pricelist price', example: 350.0 })
  pricelist_price?: number;

  @ApiPropertyOptional({ description: 'Pricelist type', example: 'contract' })
  pricelist_type?: string;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Exchange rate date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  exchange_rate_date?: string;

  @ApiPropertyOptional({ description: 'Requested quantity', example: 10 })
  requested_qty?: number;

  @ApiPropertyOptional({ description: 'Requested unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  requested_unit_id?: string;

  @ApiPropertyOptional({ description: 'Requested unit name', example: 'KG' })
  requested_unit_name?: string;

  @ApiPropertyOptional({ description: 'Requested unit conversion factor', example: 1 })
  requested_unit_conversion_factor?: number;

  @ApiPropertyOptional({ description: 'Requested base quantity', example: 10 })
  requested_base_qty?: number;

  @ApiPropertyOptional({ description: 'Approved quantity', example: 10 })
  approved_qty?: number;

  @ApiPropertyOptional({ description: 'Approved unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  approved_unit_id?: string;

  @ApiPropertyOptional({ description: 'Approved unit name', example: 'KG' })
  approved_unit_name?: string;

  @ApiPropertyOptional({ description: 'Approved unit conversion factor', example: 1 })
  approved_unit_conversion_factor?: number;

  @ApiPropertyOptional({ description: 'Approved base quantity', example: 10 })
  approved_base_qty?: number;

  @ApiPropertyOptional({ description: 'FOC (free of charge) quantity', example: 0 })
  foc_qty?: number;

  @ApiPropertyOptional({ description: 'FOC unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  foc_unit_id?: string;

  @ApiPropertyOptional({ description: 'FOC unit name', example: 'KG' })
  foc_unit_name?: string;

  @ApiPropertyOptional({ description: 'FOC base quantity', example: 0 })
  foc_base_qty?: number;

  @ApiPropertyOptional({ description: 'Tax profile ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Tax profile name', example: 'VAT 7%' })
  tax_profile_name?: string;

  @ApiPropertyOptional({ description: 'Tax rate', example: 7.0 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Tax amount', example: 245.0 })
  tax_amount?: number;

  @ApiPropertyOptional({ description: 'Base tax amount', example: 245.0 })
  base_tax_amount?: number;

  @ApiPropertyOptional({ description: 'Whether tax amount is manually adjusted', example: false })
  is_tax_adjustment?: boolean;

  @ApiPropertyOptional({ description: 'Discount rate', example: 0 })
  discount_rate?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 0 })
  discount_amount?: number;

  @ApiPropertyOptional({ description: 'Base discount amount', example: 0 })
  base_discount_amount?: number;

  @ApiPropertyOptional({ description: 'Whether discount amount is manually adjusted', example: false })
  is_discount_adjustment?: boolean;

  @ApiPropertyOptional({ description: 'Subtotal price before tax and discount', example: 3500.0 })
  sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Net amount after discount before tax', example: 3500.0 })
  net_amount?: number;

  @ApiPropertyOptional({ description: 'Total price including tax and discount', example: 3745.0 })
  total_price?: number;

  @ApiPropertyOptional({ description: 'Base price (in base currency)', example: 350.0 })
  base_price?: number;

  @ApiPropertyOptional({ description: 'Base subtotal price', example: 3500.0 })
  base_sub_total_price?: number;

  @ApiPropertyOptional({ description: 'Base net amount', example: 3500.0 })
  base_net_amount?: number;

  @ApiPropertyOptional({ description: 'Base total price', example: 3745.0 })
  base_total_price?: number;

  @ApiPropertyOptional({ description: 'Current stage status', example: 'pending' })
  current_stage_status?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: string;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class PurchaseRequestResponseDto {
  @ApiProperty({ description: 'Purchase request ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Purchase request number', example: 'PR-2026-0001' })
  pr_no?: string;

  @ApiPropertyOptional({ description: 'Purchase request date', example: '2026-03-10T00:00:00.000Z' })
  pr_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Monthly kitchen supplies order' })
  description?: string;

  @ApiPropertyOptional({ description: 'Purchase request status', example: 'draft' })
  pr_status?: string;

  @ApiPropertyOptional({ description: 'Requestor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  requestor_id?: string;

  @ApiPropertyOptional({ description: 'Requestor name', example: 'John Doe' })
  requestor_name?: string;

  @ApiPropertyOptional({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  department_id?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Kitchen' })
  department_name?: string;

  @ApiPropertyOptional({ description: 'Note', example: 'Urgent order' })
  note?: string;

  @ApiPropertyOptional({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({ description: 'Workflow name', example: 'PR Approval Workflow' })
  workflow_name?: string;

  @ApiPropertyOptional({ description: 'Workflow current stage', example: 'draft' })
  workflow_current_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow previous stage', example: null })
  workflow_previous_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow next stage', example: 'hod_review' })
  workflow_next_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow history (JSON)', example: [] })
  workflow_history?: unknown;

  @ApiPropertyOptional({ description: 'User action permissions (JSON)', example: {} })
  user_action?: unknown;

  @ApiPropertyOptional({ description: 'Last action performed', example: 'submitted' })
  last_action?: string;

  @ApiPropertyOptional({ description: 'Last action date', example: '2026-03-10T10:30:00.000Z' })
  last_action_at_date?: string;

  @ApiPropertyOptional({ description: 'Last action by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  last_action_by_id?: string;

  @ApiPropertyOptional({ description: 'Last action by user name', example: 'John Doe' })
  last_action_by_name?: string;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Document version', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: string;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: string;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Purchase request detail line items', type: [PurchaseRequestDetailResponseDto] })
  details?: PurchaseRequestDetailResponseDto[];
}

export class PurchaseRequestListResponseDto {
  @ApiProperty({ description: 'List of purchase requests', type: [PurchaseRequestResponseDto] })
  data: PurchaseRequestResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class PurchaseRequestMutationResponseDto {
  @ApiProperty({ description: 'Purchase request ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Purchase request number', example: 'PR-2026-0001' })
  pr_no?: string;

  @ApiPropertyOptional({ description: 'Purchase request status', example: 'draft' })
  pr_status?: string;
}

export class SwipeResultItemDto {
  @ApiProperty({ description: 'Purchase request ID', format: 'uuid', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Whether the operation succeeded', example: true })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error message if failed', example: 'User is not an action user for this PR' })
  message?: string;
}

export class SwipeResultResponseDto {
  @ApiProperty({ description: 'Results per PR', type: [SwipeResultItemDto] })
  data: SwipeResultItemDto[];
}
