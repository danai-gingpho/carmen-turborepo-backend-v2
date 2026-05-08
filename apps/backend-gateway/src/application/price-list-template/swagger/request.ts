import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PriceListTemplateProductAddDto {
  @ApiProperty({ description: 'Product ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  product_id: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiPropertyOptional({ description: 'Minimum order quantity config', example: {} })
  moq?: unknown;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;
}

export class PriceListTemplateProductsModificationDto {
  @ApiPropertyOptional({ description: 'Products to add', type: [PriceListTemplateProductAddDto] })
  add?: PriceListTemplateProductAddDto[];

  @ApiPropertyOptional({ description: 'Products to remove', example: [] })
  remove?: unknown[];

  @ApiPropertyOptional({ description: 'Products to update', example: [] })
  update?: unknown[];
}

export class PriceListTemplateCreateRequestDto {
  @ApiProperty({ description: 'Template name', example: 'Monthly Food Supply Template' })
  name: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Template for monthly food supply price collection' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Note', example: 'Use for all food vendors' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Status', example: 'draft', enum: ['draft', 'active', 'inactive'] })
  status?: string;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string | null;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string | null;

  @ApiPropertyOptional({ description: 'Validity period in days', example: 30 })
  validity_period?: number | null;

  @ApiPropertyOptional({ description: 'Instructions for vendors', example: 'Please provide unit prices excluding VAT' })
  vendor_instructions?: string | null;

  @ApiPropertyOptional({ description: 'Whether to send reminders', example: true })
  send_reminders?: boolean;

  @ApiPropertyOptional({ description: 'Reminder days before deadline', type: [Number], example: [7, 3, 1] })
  reminder_days?: number[];

  @ApiPropertyOptional({ description: 'Days after which to escalate', example: 14 })
  escalation_after_days?: number | null;

  @ApiPropertyOptional({ description: 'Products modification', type: PriceListTemplateProductsModificationDto })
  products?: PriceListTemplateProductsModificationDto;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;
}

export class PriceListTemplateUpdateRequestDto {
  @ApiPropertyOptional({ description: 'Template name', example: 'Monthly Food Supply Template - Updated' })
  name?: string;

  @ApiPropertyOptional({ description: 'Description', example: 'Updated template description' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Note', example: 'Updated note' })
  note?: string | null;

  @ApiPropertyOptional({ description: 'Status', example: 'active', enum: ['draft', 'active', 'inactive'] })
  status?: string;

  @ApiPropertyOptional({ description: 'Currency ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  currency_id?: string | null;

  @ApiPropertyOptional({ description: 'Currency code', example: 'THB' })
  currency_code?: string | null;

  @ApiPropertyOptional({ description: 'Validity period in days', example: 30 })
  validity_period?: number | null;

  @ApiPropertyOptional({ description: 'Instructions for vendors', example: 'Please provide unit prices excluding VAT' })
  vendor_instructions?: string | null;

  @ApiPropertyOptional({ description: 'Whether to send reminders', example: true })
  send_reminders?: boolean;

  @ApiPropertyOptional({ description: 'Reminder days before deadline', type: [Number], example: [7, 3, 1] })
  reminder_days?: number[];

  @ApiPropertyOptional({ description: 'Days after which to escalate', example: 14 })
  escalation_after_days?: number | null;

  @ApiPropertyOptional({ description: 'Products modification', type: PriceListTemplateProductsModificationDto })
  products?: PriceListTemplateProductsModificationDto;

  @ApiPropertyOptional({ description: 'Additional info (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON)', example: [] })
  dimension?: unknown;
}

export class PriceListTemplateUpdateStatusRequestDto {
  @ApiProperty({ description: 'New status', example: 'active', enum: ['draft', 'active', 'inactive'] })
  status: string;
}
