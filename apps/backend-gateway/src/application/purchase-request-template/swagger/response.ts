import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseRequestTemplateDetailResponseDto {
  @ApiProperty({ description: 'Detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Parent template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  purchase_request_template_id?: string;

  @ApiPropertyOptional({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id?: string;

  @ApiPropertyOptional({ description: 'Location code', example: 'LOC-001' })
  location_code?: string;

  @ApiPropertyOptional({ description: 'Location name', example: 'Main Kitchen' })
  location_name?: string;

  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Product name', example: 'Chicken Breast' })
  product_name?: string;

  @ApiPropertyOptional({ description: 'Product local name', example: 'อกไก่' })
  product_local_name?: string;

  @ApiPropertyOptional({ description: 'Inventory unit name', example: 'kg' })
  inventory_unit_name?: string;

  @ApiPropertyOptional({ description: 'Requested quantity', example: 10 })
  requested_qty?: number;

  @ApiPropertyOptional({ description: 'Tax rate', example: 7 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Discount rate', example: 5 })
  discount_rate?: number;

  @ApiPropertyOptional({ description: 'Whether the detail is active', example: true })
  is_active?: boolean;
}

export class PurchaseRequestTemplateResponseDto {
  @ApiProperty({ description: 'Template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Template name', example: 'Weekly Kitchen Supplies' })
  name: string;

  @ApiPropertyOptional({ description: 'Template description', example: 'Standard weekly order template' })
  description?: string;

  @ApiPropertyOptional({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({ description: 'Workflow name', example: 'Purchase Approval Workflow' })
  workflow_name?: string;

  @ApiPropertyOptional({ description: 'Whether the template is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Notes', example: 'Use for recurring weekly orders' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Document version for optimistic locking', example: 1 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Template detail items', type: [PurchaseRequestTemplateDetailResponseDto] })
  tb_purchase_request_template_detail?: PurchaseRequestTemplateDetailResponseDto[];
}

export class PurchaseRequestTemplateListResponseDto {
  @ApiProperty({ description: 'List of purchase request template records', type: [PurchaseRequestTemplateResponseDto] })
  data: PurchaseRequestTemplateResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class PurchaseRequestTemplateMutationResponseDto {
  @ApiProperty({ description: 'Purchase request template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;
}
