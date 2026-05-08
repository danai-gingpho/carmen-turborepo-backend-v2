import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestForPricingDetailResponseDto {
  @ApiProperty({ description: 'Detail ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Parent request for pricing ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  request_for_pricing_id: string;

  @ApiPropertyOptional({ description: 'Sequence number', example: 1 })
  sequence_no?: number;

  @ApiProperty({ description: 'Vendor ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  vendor_id: string;

  @ApiPropertyOptional({ description: 'Vendor name', example: 'ABC Suppliers Co.' })
  vendor_name?: string;

  @ApiPropertyOptional({ description: 'Contact person name', example: 'John Doe' })
  contact_person?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+66-2-123-4567' })
  contact_phone?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'john@abc-suppliers.com' })
  contact_email?: string;

  @ApiPropertyOptional({ description: 'Pricelist ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  pricelist_id?: string;

  @ApiPropertyOptional({ description: 'Pricelist number', example: 'PL-2026-001' })
  pricelist_no?: string;

  @ApiPropertyOptional({ description: 'Pricelist URL token', example: 'token-abc-123' })
  pricelist_url_token?: string;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;
}

export class RequestForPricingResponseDto {
  @ApiProperty({ description: 'Request for pricing ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Request name', example: 'Q1 2026 Pricing Request' })
  name: string;

  @ApiProperty({ description: 'Pricelist template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  pricelist_template_id: string;

  @ApiPropertyOptional({ description: 'Start date for submissions', example: '2026-03-01T00:00:00.000Z' })
  start_date?: Date;

  @ApiPropertyOptional({ description: 'Deadline for submissions', example: '2026-03-31T23:59:59.000Z' })
  end_date?: Date;

  @ApiPropertyOptional({ description: 'Custom message to vendors', example: 'Please submit your best pricing.' })
  custom_message?: string;

  @ApiPropertyOptional({ description: 'Email template ID', example: 'pricing-request-template' })
  email_template_id?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;

  @ApiPropertyOptional({ description: 'Workflow ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  workflow_id?: string;

  @ApiPropertyOptional({ description: 'Workflow name', example: 'Request For Pricing Workflow' })
  workflow_name?: string;

  @ApiPropertyOptional({ description: 'Workflow current stage', example: 'draft' })
  workflow_current_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow previous stage', example: null })
  workflow_previous_stage?: string;

  @ApiPropertyOptional({ description: 'Workflow next stage', example: 'approval' })
  workflow_next_stage?: string;

  @ApiPropertyOptional({ description: 'User action (JSON)', example: {} })
  user_action?: unknown;

  @ApiPropertyOptional({ description: 'Last action performed', example: 'submitted' })
  last_action?: string;

  @ApiPropertyOptional({ description: 'Last action date', example: '2026-03-10T10:30:00.000Z' })
  last_action_at_date?: string;

  @ApiPropertyOptional({ description: 'Last action by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  last_action_by_id?: string;

  @ApiPropertyOptional({ description: 'Last action by user name', example: 'John Doe' })
  last_action_by_name?: string;

  @ApiPropertyOptional({ description: 'Document version', example: 0 })
  doc_version?: number;

  @ApiPropertyOptional({ description: 'Created timestamp', example: '2026-03-10T00:00:00.000Z' })
  created_at?: Date;

  @ApiPropertyOptional({ description: 'Created by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  created_by_id?: string;

  @ApiPropertyOptional({ description: 'Updated timestamp', example: '2026-03-10T00:00:00.000Z' })
  updated_at?: Date;

  @ApiPropertyOptional({ description: 'Updated by user ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  updated_by_id?: string;

  @ApiPropertyOptional({ description: 'Request for pricing details', type: [RequestForPricingDetailResponseDto] })
  tb_request_for_pricing_detail?: RequestForPricingDetailResponseDto[];
}

export class RequestForPricingListResponseDto {
  @ApiProperty({ description: 'List of Request For Pricing records', type: [RequestForPricingResponseDto] })
  data: RequestForPricingResponseDto[];

  @ApiPropertyOptional({ description: 'Total count of records', example: 50 })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Records per page', example: 10 })
  perpage?: number;
}

export class RequestForPricingMutationResponseDto {
  @ApiProperty({ description: 'Request For Pricing ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({ description: 'Request name', example: 'Q1 2026 Pricing Request' })
  name?: string;

  @ApiPropertyOptional({ description: 'Document status', example: 'draft' })
  doc_status?: string;
}
