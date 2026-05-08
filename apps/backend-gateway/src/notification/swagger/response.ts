import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationProxyResponseDto {
  @ApiPropertyOptional({ description: 'Response data from the notification service', example: {} })
  data?: unknown;

  @ApiPropertyOptional({ description: 'HTTP status code', example: 200 })
  status?: number;

  @ApiPropertyOptional({ description: 'Whether the request was successful', example: true })
  success?: boolean;

  @ApiPropertyOptional({ description: 'Response message', example: 'Operation successful' })
  message?: string;

  @ApiPropertyOptional({ description: 'Response timestamp', example: '2026-03-10T00:00:00.000Z' })
  timestamp?: string;
}

export class NotificationProxyErrorResponseDto {
  @ApiProperty({ description: 'Error message', example: 'Failed to proxy request to notification service' })
  error: string;
}
