import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseRequestDetailItemSwaggerDto {
  @ApiPropertyOptional({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id?: string;

  @ApiPropertyOptional({ description: 'Description of the line item', example: 'Fresh salmon fillet' })
  description?: string;

  @ApiPropertyOptional({ description: 'Comment for the line item', example: 'Prefer wild-caught' })
  comment?: string;

  @ApiPropertyOptional({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id?: string;

  @ApiPropertyOptional({ description: 'Delivery point ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  delivery_point_id?: string;

  @ApiPropertyOptional({ description: 'Delivery date (ISO 8601)', example: '2026-03-15T00:00:00.000Z' })
  delivery_date?: string;

  @ApiPropertyOptional({ description: 'Requested quantity', example: 10 })
  requested_qty?: number;

  @ApiPropertyOptional({ description: 'Requested unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  requested_unit_id?: string;

  @ApiPropertyOptional({ description: 'Requested unit conversion factor', example: 1 })
  requested_unit_conversion_factor?: number;

  @ApiPropertyOptional({ description: 'FOC (free of charge) quantity', example: 0 })
  foc_qty?: number;

  @ApiPropertyOptional({ description: 'FOC unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  foc_unit_id?: string;

  @ApiPropertyOptional({ description: 'FOC unit conversion rate', example: 1 })
  foc_unit_conversion_rate?: number;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Exchange rate date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  exchange_rate_date?: string;

  @ApiPropertyOptional({ description: 'Inventory unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_unit_id?: string;
}

export class UpdatePurchaseRequestDetailItemSwaggerDto extends CreatePurchaseRequestDetailItemSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID to update', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class RemovePurchaseRequestDetailItemSwaggerDto {
  @ApiProperty({ description: 'Detail line item ID to remove', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}

export class PurchaseRequestDetailOperationsSwaggerDto {
  @ApiPropertyOptional({
    description: 'Detail line items to add',
    type: [CreatePurchaseRequestDetailItemSwaggerDto],
  })
  add?: CreatePurchaseRequestDetailItemSwaggerDto[];

  @ApiPropertyOptional({
    description: 'Detail line items to update',
    type: [UpdatePurchaseRequestDetailItemSwaggerDto],
  })
  update?: UpdatePurchaseRequestDetailItemSwaggerDto[];

  @ApiPropertyOptional({
    description: 'Detail line items to remove',
    type: [RemovePurchaseRequestDetailItemSwaggerDto],
  })
  remove?: RemovePurchaseRequestDetailItemSwaggerDto[];
}

export class CreatePurchaseRequestDetailsSwaggerDto {
  @ApiPropertyOptional({ description: 'Purchase request date (ISO 8601)', example: '2026-03-10T00:00:00.000Z' })
  pr_date?: string;

  @ApiPropertyOptional({ description: 'Description of the purchase request', example: 'Monthly kitchen supplies order' })
  description?: string;

  @ApiPropertyOptional({ description: 'Requestor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  requestor_id?: string;

  @ApiPropertyOptional({ description: 'Department ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  department_id?: string;

  @ApiPropertyOptional({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({
    description: 'Purchase request detail operations (add, update, remove line items)',
    type: PurchaseRequestDetailOperationsSwaggerDto,
  })
  purchase_request_detail?: PurchaseRequestDetailOperationsSwaggerDto;
}

export class CreatePurchaseRequestSwaggerDto {
  @ApiProperty({ description: 'Stage role for the action', example: 'create', default: 'create' })
  stage_role: string;

  @ApiProperty({
    description: 'Purchase request details including header fields and line item operations',
    type: CreatePurchaseRequestDetailsSwaggerDto,
  })
  details: CreatePurchaseRequestDetailsSwaggerDto;
}

export class UpdatePurchaseRequestSwaggerDto {
  @ApiProperty({ description: 'Stage role for the action', example: 'create', default: 'create' })
  stage_role: string;

  @ApiProperty({
    description: 'Purchase request details including header fields and line item operations',
    type: CreatePurchaseRequestDetailsSwaggerDto,
  })
  details: CreatePurchaseRequestDetailsSwaggerDto;
}

export class DuplicatePurchaseRequestSwaggerDto {
  @ApiProperty({ description: 'Array of purchase request IDs to duplicate', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  ids: string[];
}

export class SplitPurchaseRequestSwaggerDto {
  @ApiProperty({ description: 'Array of purchase request detail IDs to split into a new PR', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  detail_ids: string[];
}

export class SubmitPurchaseRequestSwaggerDto {
  @ApiPropertyOptional({ description: 'Message for the submission', example: 'Submitting for approval' })
  message?: string;
}

export class ApprovePurchaseRequestSwaggerDto {
  @ApiProperty({ description: 'Stage role for approval (e.g., approve, purchase)', example: 'approve' })
  stage_role: string;

  @ApiPropertyOptional({ description: 'Message for the approval', example: 'Approved as requested' })
  message?: string;

  @ApiPropertyOptional({ description: 'Details with pricing info (used by purchase role)', type: 'array', example: [] })
  details?: unknown[];
}

export class RejectPurchaseRequestSwaggerDto {
  @ApiPropertyOptional({ description: 'Reason for rejection', example: 'Budget exceeded for this period' })
  message?: string;

  @ApiPropertyOptional({ description: 'Stage role for rejection', example: 'approve' })
  stage_role?: string;
}

export class ReviewPurchaseRequestSwaggerDto {
  @ApiPropertyOptional({ description: 'Message for the review', example: 'Please update quantities' })
  message?: string;

  @ApiPropertyOptional({ description: 'Stage role for review', example: 'approve' })
  stage_role?: string;

  @ApiPropertyOptional({ description: 'Target stage to send back to', example: 'draft' })
  target_stage?: string;
}

export class CalculatePurchaseRequestDetailSwaggerDto {
  @ApiPropertyOptional({ description: 'Pricelist type', example: 'contract' })
  pricelist_type?: string;

  @ApiPropertyOptional({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id?: string;

  @ApiPropertyOptional({ description: 'Quantity', example: 10 })
  qty?: number;
}

export class SwipeApprovePurchaseRequestSwaggerDto {
  @ApiProperty({ description: 'Array of purchase request IDs to approve', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f12345678901'] })
  pr_ids: string[];
}

export class SwipeRejectPurchaseRequestSwaggerDto {
  @ApiProperty({ description: 'Array of purchase request IDs to reject', type: [String], example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'] })
  pr_ids: string[];

  @ApiProperty({ description: 'Reject message applied to all PRs', example: 'Budget exceeded for this period' })
  reject_message: string;
}
