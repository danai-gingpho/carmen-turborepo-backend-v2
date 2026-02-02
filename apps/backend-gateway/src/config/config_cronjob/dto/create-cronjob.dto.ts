import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCronjobDto {
  @ApiProperty({
    description: 'Name of the cron job',
    example: 'Daily Backup Job'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the cron job',
    example: 'Performs daily database backup at midnight'
  })
  description?: string;

  @ApiProperty({
    description: 'Cron expression defining the schedule',
    example: '0 0 * * *',
    pattern: '^(\\*|([0-5]?\\d)|\\*/([0-5]?\\d)|([0-5]?\\d)-([0-5]?\\d)|([0-5]?\\d),([0-5]?\\d))\\s+(\\*|([01]?\\d|2[0-3])|\\*/([01]?\\d|2[0-3])|([01]?\\d|2[0-3])-([01]?\\d|2[0-3])|([01]?\\d|2[0-3]),([01]?\\d|2[0-3]))\\s+(\\*|([12]?\\d|3[01])|\\*/([12]?\\d|3[01])|([12]?\\d|3[01])-([12]?\\d|3[01])|([12]?\\d|3[01]),([12]?\\d|3[01]))\\s+(\\*|([1-9]|1[0-2])|\\*/([1-9]|1[0-2])|([1-9]|1[0-2])-([1-9]|1[0-2])|([1-9]|1[0-2]),([1-9]|1[0-2]))\\s+(\\*|[0-6]|\\*/[0-6]|[0-6]-[0-6]|[0-6],[0-6])$'
  })
  cronExpression: string;

  @ApiProperty({
    description: 'Type of job to execute',
    example: 'notification_check',
    enum: ['notification_check', 'database_backup', 'data_cleanup', 'report_generation']
  })
  jobType: string;

  @ApiPropertyOptional({
    description: 'JSON string containing job-specific data',
    example: '{"title":"System Check","message":"Performing system health check","type":"info"}'
  })
  jobData?: string;

  @ApiPropertyOptional({
    description: 'Whether the cron job is active',
    example: true,
    default: false
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Timezone for cron execution',
    example: 'Asia/Bangkok',
    default: 'UTC'
  })
  timezone?: string;
}
