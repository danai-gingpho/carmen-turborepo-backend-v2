import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCronjobDto {
  @ApiPropertyOptional({
    description: 'Name of the cron job',
    example: 'Daily Backup Job - Updated'
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the cron job',
    example: 'Updated description for backup job'
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Cron expression defining the schedule',
    example: '0 2 * * *',
    pattern: '^(\\*|([0-5]?\\d)|\\*/([0-5]?\\d)|([0-5]?\\d)-([0-5]?\\d)|([0-5]?\\d),([0-5]?\\d))\\s+(\\*|([01]?\\d|2[0-3])|\\*/([01]?\\d|2[0-3])|([01]?\\d|2[0-3])-([01]?\\d|2[0-3])|([01]?\\d|2[0-3]),([01]?\\d|2[0-3]))\\s+(\\*|([12]?\\d|3[01])|\\*/([12]?\\d|3[01])|([12]?\\d|3[01])-([12]?\\d|3[01])|([12]?\\d|3[01]),([12]?\\d|3[01]))\\s+(\\*|([1-9]|1[0-2])|\\*/([1-9]|1[0-2])|([1-9]|1[0-2])-([1-9]|1[0-2])|([1-9]|1[0-2]),([1-9]|1[0-2]))\\s+(\\*|[0-6]|\\*/[0-6]|[0-6]-[0-6]|[0-6],[0-6])$'
  })
  cronExpression?: string;

  @ApiPropertyOptional({
    description: 'Type of job to execute',
    example: 'notification_check',
    enum: ['notification_check', 'database_backup', 'data_cleanup', 'report_generation']
  })
  jobType?: string;

  @ApiPropertyOptional({
    description: 'JSON string containing job-specific data',
    example: '{"title":"Updated Check","message":"Updated message","type":"warning"}'
  })
  jobData?: string;

  @ApiPropertyOptional({
    description: 'Whether the cron job is active',
    example: true
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Timezone for cron execution',
    example: 'Asia/Bangkok'
  })
  timezone?: string;
}
