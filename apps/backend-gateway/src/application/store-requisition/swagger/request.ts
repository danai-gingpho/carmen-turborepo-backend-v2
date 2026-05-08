import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreRequisitionDetailItemSwaggerDto {
  @ApiPropertyOptional({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Fresh Salmon Fillet' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'เนื้อปลาแซลมอนสด' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Description of the line item', example: 'Weekly salmon order' })
  description?: string;

  @ApiPropertyOptional({ description: 'Requested quantity', example: 10 })
  requested_qty?: number;
}

export class UpdateStoreRequisitionDetailItemSwaggerDto extends CreateStoreRequisitionDetailItemSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID to update', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class RemoveStoreRequisitionDetailItemSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID to remove', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class StoreRequisitionDetailOperationsSwaggerDto {
  @ApiPropertyOptional({
    description: 'Detail line items to add',
    type: [CreateStoreRequisitionDetailItemSwaggerDto],
  })
  add?: CreateStoreRequisitionDetailItemSwaggerDto[];

  @ApiPropertyOptional({
    description: 'Detail line items to update',
    type: [UpdateStoreRequisitionDetailItemSwaggerDto],
  })
  update?: UpdateStoreRequisitionDetailItemSwaggerDto[];

  @ApiPropertyOptional({
    description: 'Detail line items to remove',
    type: [RemoveStoreRequisitionDetailItemSwaggerDto],
  })
  remove?: RemoveStoreRequisitionDetailItemSwaggerDto[];
}

export class CreateStoreRequisitionDetailsSwaggerDto {
  @ApiPropertyOptional({ description: 'Store requisition date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  sr_date?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date (ISO 8601)', example: '2026-03-12T00:00:00.000Z' })
  expected_date?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Weekly store replenishment' })
  description?: string;

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

  @ApiPropertyOptional({ description: 'Requestor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  requestor_id?: string;

  @ApiPropertyOptional({ description: 'Requestor name', example: 'John Doe' })
  requestor_name?: string;

  @ApiPropertyOptional({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  department_id?: string;

  @ApiPropertyOptional({ description: 'Department name', example: 'Kitchen' })
  department_name?: string;

  @ApiPropertyOptional({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({
    description: 'Store requisition detail operations (add, update, remove line items)',
    type: StoreRequisitionDetailOperationsSwaggerDto,
  })
  store_requisition_detail?: StoreRequisitionDetailOperationsSwaggerDto;
}

export class CreateStoreRequisitionSwaggerDto {
  @ApiProperty({ description: 'Stage role for the action', example: 'create', default: 'create' })
  stage_role: string;

  @ApiProperty({
    description: 'Store requisition details including header fields and line item operations',
    type: CreateStoreRequisitionDetailsSwaggerDto,
  })
  details: CreateStoreRequisitionDetailsSwaggerDto;
}

export class UpdateStoreRequisitionSwaggerDto {
  @ApiProperty({ description: 'Stage role for the action', example: 'create', default: 'create' })
  stage_role: string;

  @ApiProperty({
    description: 'Store requisition details including header fields and line item operations',
    type: CreateStoreRequisitionDetailsSwaggerDto,
  })
  details: CreateStoreRequisitionDetailsSwaggerDto;
}

export class SubmitStoreRequisitionSwaggerDto {
  @ApiPropertyOptional({ description: 'Message for submission', example: 'Submitting for approval' })
  message?: string;
}

export class ApproveStoreRequisitionSwaggerDto {
  @ApiProperty({ description: 'Stage role for approval', example: 'approve' })
  stage_role: string;

  @ApiPropertyOptional({ description: 'Approval message', example: 'Approved' })
  message?: string;

  @ApiPropertyOptional({ description: 'Details with approved quantities', type: 'array', example: [] })
  details?: unknown[];
}

export class RejectStoreRequisitionSwaggerDto {
  @ApiPropertyOptional({ description: 'Rejection reason', example: 'Insufficient stock' })
  message?: string;

  @ApiPropertyOptional({ description: 'Stage role for rejection', example: 'approve' })
  stage_role?: string;
}

export class ReviewStoreRequisitionSwaggerDto {
  @ApiPropertyOptional({ description: 'Review message', example: 'Please check quantities' })
  message?: string;

  @ApiPropertyOptional({ description: 'Stage role for review', example: 'approve' })
  stage_role?: string;

  @ApiPropertyOptional({ description: 'Target stage to send back to', example: 'draft' })
  target_stage?: string;
}
