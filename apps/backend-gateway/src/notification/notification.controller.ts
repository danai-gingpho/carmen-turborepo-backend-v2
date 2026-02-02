import { Controller, Get, Req, Res, All } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { BackendLogger } from '../common/helpers/backend.logger';
import { envConfig } from 'src/libs/config.env';
import { Request, Response } from 'express';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Notification')
@ApiHeaderRequiredXAppId()
@Controller('api/notifications')
export class NotificationController {
  private readonly logger = new BackendLogger(NotificationController.name);
  private readonly notificationServiceUrl = `http://${envConfig.NOTIFICATION_SERVICE_HOST}:${envConfig.NOTIFICATION_SERVICE_PORT}`;

  // Proxy /api/notifications (exact match)
  @All('/')
  async proxyNotificationsBase(@Req() req: Request, @Res() res: Response) {
    const path = req.path;
    const method = req.method;
    const url = `${this.notificationServiceUrl}${path}`;

    this.logger.log(`Proxying ${method} ${path} to ${url}`);
    this.logger.log(`Headers: ${JSON.stringify(req.headers)}`);
    this.logger.log(`Body: ${JSON.stringify(req.body)}`);

    try {
      // Filter headers to only include string values
      const headers: Record<string, string> = {};
      Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value.join(', ');
        }
      });
      headers['Content-Type'] = 'application/json';

      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      });

      this.logger.log(`Response status: ${response.status}`);
      this.logger.log(`Response headers: ${JSON.stringify(response.headers)}`);
      // this.logger.log(`Response body: ${await response.text()}`);

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error proxying request: ${errorMessage}`);
      res.status(500).json({ error: 'Failed to proxy request to notification service' });
    }
  }

  // Proxy all /api/notifications/* requests (with path)
  @All('/*path')
  async proxyNotifications(@Req() req: Request, @Res() res: Response) {
    const path = req.path;
    const method = req.method;
    const url = `${this.notificationServiceUrl}${path}`;

    this.logger.log(`Proxying ${method} ${path} to ${url}`);

    try {
      // Filter headers to only include string values
      const headers: Record<string, string> = {};
      Object.entries(req.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value.join(', ');
        }
      });
      headers['Content-Type'] = 'application/json';

      const response = await fetch(url, {
        method,
        headers,
        body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error proxying request: ${errorMessage}`);
      res.status(500).json({ error: 'Failed to proxy request to notification service' });
    }
  }

  // Proxy root endpoint for user list
  @Get('/')
  async proxyRoot(@Res() res: Response) {
    const url = `${this.notificationServiceUrl}/`;

    this.logger.log(`Proxying GET / to ${url}`);

    try {
      const response = await fetch(url);
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error proxying request: ${errorMessage}`);
      res.status(500).json({ error: 'Failed to proxy request to notification service' });
    }
  }
}
