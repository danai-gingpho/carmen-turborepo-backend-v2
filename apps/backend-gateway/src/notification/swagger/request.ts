import { ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationProxyRequestDto {
  @ApiPropertyOptional({ description: 'Request body payload forwarded to the notification service', example: {} })
  body?: unknown;
}
