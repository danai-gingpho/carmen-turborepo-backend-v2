import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ApiBody, ApiExcludeController, ApiOperation } from '@nestjs/swagger';

import { BackendLogger } from '../common/helpers/backend.logger';

/**
 * Payload for the notification dispatcher. Mirrors CreateNotificationPayload
 * in micro-notification so the gateway only forwards.
 */
interface DispatchNotificationBody {
  category: 'system' | 'user-to-user' | 'business-unit';
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  scheduled_at?: string;
  userIds?: string[];
  to_user_id?: string;
  from_user_id?: string;
  bu_code?: string;
}

/**
 * Internal HTTP bridge for services that can't speak NestJS TCP natively
 * (e.g. micro-cronjob in Go). It accepts a JSON body over HTTP and forwards
 * it to micro-notification via the TCP ClientProxy using the same
 * `{ cmd: 'notification.create', service: 'notification' }` message pattern
 * that in-process callers use.
 */
@ApiExcludeController()
@Controller('api/internal/notifications')
export class InternalNotificationController {
  private readonly logger = new BackendLogger(InternalNotificationController.name);

  constructor(
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Internal: forward notification dispatch to micro-notification (TCP)' })
  @ApiBody({ description: 'CreateNotificationPayload (category, title, message, type, metadata, ...)', required: true })
  async dispatch(@Body() body: DispatchNotificationBody) {
    this.logger.debug(
      {
        function: 'dispatch',
        category: body.category,
        to_user_id: body.to_user_id,
        bu_code: body.bu_code,
      },
      InternalNotificationController.name,
    );

    const response$ = this.notificationClient
      .send({ cmd: 'notification.create', service: 'notification' }, body)
      .pipe(timeout(10_000));

    const result = await firstValueFrom(response$);
    return result;
  }
}
