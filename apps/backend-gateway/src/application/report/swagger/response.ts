import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportTypeResponseDto {
  @ApiProperty({ description: 'Report type identifier', example: 'inventory_summary' })
  report_type: string;

  @ApiProperty({ description: 'Report name', example: 'Inventory Summary' })
  name: string;

  @ApiProperty({ description: 'Report description', example: 'Summary of current inventory levels by location' })
  description: string;

  @ApiProperty({ description: 'Report category (numeric)', example: 1 })
  category: number;

  @ApiProperty({ description: 'Supported output formats (1=PDF, 2=Excel, 3=CSV, 4=JSON)', example: [1, 2, 3, 4], type: [Number] })
  supported_formats: number[];
}

export class ReportTemplateResponseDto {
  @ApiProperty({ description: 'Template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Template name', example: 'Standard Inventory Report' })
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  description?: string;

  @ApiProperty({ description: 'Report group', example: 'inventory' })
  report_group: string;

  @ApiProperty({ description: 'Dialog configuration (JSON string)' })
  dialog: string;

  @ApiProperty({ description: 'Template content (JSON string)' })
  content: string;

  @ApiProperty({ description: 'Whether this is a standard template', example: true })
  is_standard: boolean;

  @ApiProperty({ description: 'Allowed business unit codes', type: [String] })
  allow_business_unit: string[];

  @ApiProperty({ description: 'Denied business unit codes', type: [String] })
  deny_business_unit: string[];

  @ApiProperty({ description: 'Whether this template is active', example: true })
  is_active: boolean;
}

export class ViewerResponseDto {
  @ApiProperty({ description: 'External report viewer URL', example: 'https://report.blueledgers.cloud/viewer/abc123' })
  url: string;
}

export class LookupItemDto {
  @ApiProperty({ description: 'Item code', example: 'V001' })
  code: string;

  @ApiProperty({ description: 'Item name', example: 'Vendor ABC' })
  name: string;
}

export class AsyncResponseDto {
  @ApiProperty({ description: 'Job ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  job_id: string;

  @ApiProperty({ description: 'Status message', example: 'Report job queued successfully' })
  message: string;
}

export class JobStatusResponseDto {
  @ApiProperty({ description: 'Job ID' })
  job_id: string;

  @ApiProperty({ description: 'Report type' })
  report_type: string;

  @ApiProperty({ description: 'Format (numeric)' })
  format: number;

  @ApiProperty({ description: 'Job status (1=queued, 2=processing, 3=completed, 4=failed, 5=cancelled)' })
  status: number;

  @ApiPropertyOptional({ description: 'File URL when completed' })
  file_url?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  file_size?: number;

  @ApiPropertyOptional({ description: 'Row count' })
  row_count?: number;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error_message?: string;
}

export class ScheduleDeliveryResponseDto {
  @ApiPropertyOptional({ description: 'Delivery type', example: 'viewer_url' })
  type?: string;

  @ApiPropertyOptional({ description: 'Viewer endpoint used at run-time to mint the report URL' })
  viewer_endpoint?: string;
}

export class ScheduleNotificationsResponseDto {
  @ApiPropertyOptional({ description: 'In-app notification enabled', example: true })
  web?: boolean;

  @ApiPropertyOptional({ description: 'Email notification enabled', example: true })
  email?: boolean;
}

export class ScheduleResponseDto {
  @ApiProperty({ description: 'Schedule ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Schedule name', example: 'Daily Inventory Report' })
  name: string;

  @ApiProperty({ description: 'Report type', example: 'inventory_summary' })
  report_type: string;

  @ApiPropertyOptional({ description: 'Report template ID (UUID)' })
  report_template_id?: string;

  @ApiProperty({ description: 'Output format', example: 'viewer_url' })
  format: string;

  @ApiProperty({ description: 'Cron expression', example: '0 8 * * *' })
  cron_expression: string;

  @ApiPropertyOptional({ description: 'Delivery settings', type: ScheduleDeliveryResponseDto })
  delivery?: ScheduleDeliveryResponseDto;

  @ApiPropertyOptional({ description: 'Notification channels', type: ScheduleNotificationsResponseDto })
  notifications?: ScheduleNotificationsResponseDto;

  @ApiPropertyOptional({ description: 'Recipient user IDs', type: [String] })
  recipients?: string[];

  @ApiProperty({ description: 'Whether schedule is active', example: true })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'Last run timestamp' })
  last_run_at?: string;

  @ApiPropertyOptional({ description: 'Next run timestamp' })
  next_run_at?: string;
}
