import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRequestForPricingRequestDto {
  @ApiProperty({ description: 'Request for pricing name', example: 'Q1 2026 Pricing Request' })
  name: string;

  @ApiProperty({ description: 'Pricelist template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  pricelist_template_id: string;

  @ApiPropertyOptional({ description: 'Start date for vendor submissions (ISO 8601)', example: '2026-03-01T00:00:00.000Z' })
  start_date?: string;

  @ApiPropertyOptional({ description: 'Deadline for vendor submissions (ISO 8601)', example: '2026-03-31T23:59:59.000Z' })
  end_date?: string;

  @ApiPropertyOptional({ description: 'Custom message to vendors', example: 'Please submit your best pricing for Q1 items.' })
  custom_message?: string;

  @ApiPropertyOptional({ description: 'Email template name or ID', example: 'pricing-request-template' })
  email_template_id?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}

export class UpdateRequestForPricingRequestDto {
  @ApiPropertyOptional({ description: 'Request for pricing name', example: 'Updated Q1 2026 Pricing Request' })
  name?: string;

  @ApiPropertyOptional({ description: 'Pricelist template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  pricelist_template_id?: string;

  @ApiPropertyOptional({ description: 'Start date for vendor submissions (ISO 8601)', example: '2026-03-01T00:00:00.000Z' })
  start_date?: string;

  @ApiPropertyOptional({ description: 'Deadline for vendor submissions (ISO 8601)', example: '2026-03-31T23:59:59.000Z' })
  end_date?: string;

  @ApiPropertyOptional({ description: 'Custom message to vendors', example: 'Updated message to vendors.' })
  custom_message?: string;

  @ApiPropertyOptional({ description: 'Email template name or ID', example: 'pricing-request-template' })
  email_template_id?: string;

  @ApiPropertyOptional({ description: 'Additional metadata (JSON)', example: {} })
  info?: unknown;

  @ApiPropertyOptional({ description: 'Dimension data (JSON array)', example: [] })
  dimension?: unknown;
}
