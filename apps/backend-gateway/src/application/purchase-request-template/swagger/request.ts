import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseRequestTemplateDetailRequestDto {
  @ApiPropertyOptional({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  location_id?: string;

  @ApiPropertyOptional({ description: 'Delivery point ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  delivery_point_id?: string;

  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Inventory unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  inventory_unit_id?: string;

  @ApiPropertyOptional({ description: 'Inventory unit name', example: 'kg' })
  inventory_unit_name?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Fresh vegetables for kitchen' })
  description?: string;

  @ApiPropertyOptional({ description: 'Comment', example: 'Urgent order' })
  comment?: string;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1, default: 1 })
  exchange_rate?: number;

  @ApiPropertyOptional({ description: 'Requested quantity', example: 10, default: 0 })
  requested_qty?: number;

  @ApiPropertyOptional({ description: 'Requested unit ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  requested_unit_id?: string;

  @ApiPropertyOptional({ description: 'Tax profile ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  tax_profile_id?: string;

  @ApiPropertyOptional({ description: 'Tax rate', example: 7, default: 0 })
  tax_rate?: number;

  @ApiPropertyOptional({ description: 'Discount rate', example: 5, default: 0 })
  discount_rate?: number;

  @ApiPropertyOptional({ description: 'Whether the detail is active', example: true, default: true })
  is_active?: boolean;
}

export class CreatePurchaseRequestTemplateRequestDto {
  @ApiProperty({ description: 'Template name', example: 'Weekly Kitchen Supplies' })
  name: string;

  @ApiPropertyOptional({ description: 'Template description', example: 'Standard weekly order template for kitchen department' })
  description?: string;

  @ApiPropertyOptional({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({ description: 'Whether the template is active', example: true, default: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Notes', example: 'Use for recurring weekly orders' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Template detail items to add' })
  purchase_request_template_detail?: {
    add?: CreatePurchaseRequestTemplateDetailRequestDto[];
  };
}

export class UpdatePurchaseRequestTemplateRequestDto {
  @ApiPropertyOptional({ description: 'Template name', example: 'Updated Weekly Kitchen Supplies' })
  name?: string;

  @ApiPropertyOptional({ description: 'Template description', example: 'Updated description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({ description: 'Whether the template is active', example: true })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Notes', example: 'Updated notes' })
  note?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Template detail items to add, update, or delete' })
  purchase_request_template_detail?: {
    add?: unknown[];
    update?: unknown[];
    delete?: { id: string }[];
  };
}
