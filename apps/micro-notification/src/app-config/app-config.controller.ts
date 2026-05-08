import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppConfigService } from './app-config.service';

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

@Controller()
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @MessagePattern({ cmd: 'appConfig.list', service: 'notification' })
  async list(data: { bu_code: string }) {
    try {
      const items = await this.appConfigService.list(data.bu_code);
      return { status: 200, data: { items, count: items.length } };
    } catch (error) {
      return { status: 500, error: 'Failed to list app config', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'appConfig.get', service: 'notification' })
  async get(data: { bu_code: string; key: string }) {
    try {
      const item = await this.appConfigService.get(data.bu_code, data.key);
      if (!item) return { status: 404, error: 'Config key not found' };
      return { status: 200, data: item };
    } catch (error) {
      return { status: 500, error: 'Failed to get app config', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'appConfig.upsert', service: 'notification' })
  async upsert(data: { bu_code: string; key: string; value: unknown; user_id: string }) {
    try {
      const item = await this.appConfigService.upsert(
        data.bu_code,
        data.key,
        data.value,
        data.user_id,
      );
      return { status: 200, data: item };
    } catch (error) {
      return { status: 400, error: 'Failed to upsert app config', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'appConfig.delete', service: 'notification' })
  async delete(data: { bu_code: string; key: string; user_id: string }) {
    try {
      const result = await this.appConfigService.delete(data.bu_code, data.key, data.user_id);
      return { status: 200, data: result };
    } catch (error) {
      return { status: 400, error: 'Failed to delete app config', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'appConfig.testEmail', service: 'notification' })
  async testEmail(data: { bu_code: string }) {
    try {
      const result = await this.appConfigService.testEmail(data.bu_code);
      return { status: 200, data: result };
    } catch (error) {
      return { status: 500, error: 'Test email failed', details: errMsg(error) };
    }
  }
}
