import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StoreRequisitionDetailResponseDto {
  @ApiProperty({ description: 'Detail line item ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Parent store requisition ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  store_requisition_id: string;

  @ApiPropertyOptional({ description: 'Inventory transaction ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_transaction_id?: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Fresh salmon fillet' })
  description?: string;

  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Fresh Salmon Fillet' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'เนื้อปลาแซลมอนสด' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Requested quantity', example: 10 })
  requested_qty?: number;

  @ApiPropertyOptional({ description: 'Approved quantity', example: 10 })
  approved_qty?: number;

  @ApiPropertyOptional({ description: 'Issued quantity', example: 10 })
  issued_qty?: number;

  @ApiPropertyOptional({ description: 'Last action performed', example: 'approved' })
  last_action?: string;

  @ApiPropertyOptional({ description: 'Approval message', example: 'Approved as requested' })
  approved_message?: string;

  @ApiPropertyOptional({ description: 'Approved by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  approved_by_id?: string;

  @ApiPropertyOptional({ description: 'Approved by user name', example: 'Jane Smith' })
  approved_by_name?: string;

  @ApiPropertyOptional({ description: 'Approval date', example: '2026-03-11T10:00:00.000Z' })
  approved_date_at?: string;

  @ApiPropertyOptional({ description: 'Review message', example: 'Please verify quantities' })
  review_message?: string;

  @ApiPropertyOptional({ description: 'Review by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  review_by_id?: string;

  @ApiPropertyOptional({ description: 'Review by user name', example: 'Bob Johnson' })
  review_by_name?: string;

  @ApiPropertyOptional({ description: 'Review date', example: '2026-03-11T09:00:00.000Z' })
  review_date_at?: string;

  @ApiPropertyOptional({ description: 'Rejection message', example: 'Insufficient stock' })
  reject_message?: string;

  @ApiPropertyOptional({ description: 'Rejected by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  reject_by_id?: string;

  @ApiPropertyOptional({ description: 'Rejected by user name', example: 'Jane Smith' })
  reject_by_name?: string;

  @ApiPropertyOptional({ description: 'Rejection date', example: '2026-03-11T10:00:00.000Z' })
  reject_date_at?: string;

  @ApiPropertyOptional({ description: 'History (JSON)', example: [] })
  history?: unknown;

  @ApiPropertyOptional({ description: 'Stages status (JSON)', example: {} })
  stages_status?: unknown;

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

export class StoreRequisitionResponseDto {
  @ApiProperty({ description: 'Store requisition ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Store requisition number', example: 'SR-2026-0001' })
  sr_no?: string;

  @ApiPropertyOptional({ description: 'Store requisition date', example: '2026-03-10T00:00:00.000Z' })
  sr_date?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date', example: '2026-03-12T00:00:00.000Z' })
  expected_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Weekly store replenishment' })
  description?: string;

  @ApiPropertyOptional({ description: 'Document status', example: 'draft' })
  doc_status?: string;

  @ApiPropertyOptional({ description: 'From location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  from_location_id?: string;

  @ApiPropertyOptional({ description: 'From location code', example: 'MAIN-STORE' })
  from_location_code?: string;

  @ApiPropertyOptional({ description: 'From location name', example: 'Main Store' })
  from_location_name?: string;

  @ApiPropertyOptional({ description: 'To location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  to_location_id?: string;

  @ApiPropertyOptional({ description: 'To location code', example: 'KITCHEN' })
  to_location_code?: string;

  @ApiPropertyOptional({ description: 'To location name', example: 'Kitchen Store' })
  to_location_name?: string;

  @ApiPropertyOptional({
    description:
      "SR type derived from to_location.location_type. 'transfer' when destination is inventory or consignment; 'issue' when destination is direct.",
    example: 'transfer',
    enum: ['transfer', 'issue'],
  })
  sr_type?: string;

  @ApiPropertyOptional({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({ description: 'Workflow name', example: 'SR Approval Workflow' })
  workflow_name?: string;

  @ApiPropertyOptional({ description: 'Workflow history (JSON)', example: [] })
  workflow_history?: unknown;

  @ApiPropertyOptional({ description: 'Workflow current stage', example: 'draft' })
  workflow_current_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow previous stage', example: null })
  workflow_previous_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow next stage', example: 'approval' })
  workflow_next_stage?: string;

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

  @ApiPropertyOptional({ description: 'Requestor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  requestor_id?: string;

  @ApiPropertyOptional({ description: 'Requestor name', example: 'John Doe' })
  requestor_name?: string;

  @ApiPropertyOptional({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  department_id?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Kitchen' })
  department_name?: string;

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

  @ApiPropertyOptional({ description: 'Store requisition detail line items', type: [StoreRequisitionDetailResponseDto] })
  details?: StoreRequisitionDetailResponseDto[];
}

export class StoreRequisitionListResponseDto {
  @ApiProperty({ description: 'List of store requisitions', type: [StoreRequisitionResponseDto] })
  data: StoreRequisitionResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class StoreRequisitionMutationResponseDto {
  @ApiProperty({ description: 'Store requisition ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Store requisition number', example: 'SR-2026-0001' })
  sr_no?: string;

  @ApiPropertyOptional({ description: 'Document status', example: 'draft' })
  doc_status?: string;
}
