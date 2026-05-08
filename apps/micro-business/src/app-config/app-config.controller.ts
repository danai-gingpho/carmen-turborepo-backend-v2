import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppConfigService } from './app-config.service';

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

@Controller()
export class AppConfigController {
  private readonly logger = new Logger(AppConfigController.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  @MessagePattern({ cmd: 'appConfig.list', service: 'business' })
  async list(data: { bu_code: string; user_id: string }) {
    try {
      const items = await this.appConfigService.list(data.bu_code, data.user_id);
      return { status: 200, data: { items, count: items.length } };
    } catch (error) {
      return { status: 500, error: 'Failed to list app config', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'appConfig.get', service: 'business' })
  async get(data: { bu_code: string; user_id: string; key: string }) {
    try {
      const item = await this.appConfigService.get(data.bu_code, data.user_id, data.key);
      if (!item) return { status: 404, error: 'Config key not found' };
      return { status: 200, data: item };
    } catch (error) {
      return { status: 500, error: 'Failed to get app config', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'appConfig.upsert', service: 'business' })
  async upsert(data: {
    bu_code: string;
    user_id: string;
    key: string;
    value: unknown;
  }) {
    try {
      const item = await this.appConfigService.upsert(
        data.bu_code,
        data.user_id,
        data.key,
        data.value,
      );
      return { status: 200, data: item };
    } catch (error) {
      this.logger.error(
        `appConfig.upsert failed for bu=${data.bu_code} key=${data.key} user=${data.user_id}: ${errMsg(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      return { status: 400, error: 'Failed to upsert app config', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'appConfig.delete', service: 'business' })
  async delete(data: { bu_code: string; user_id: string; key: string }) {
    try {
      const result = await this.appConfigService.delete(
        data.bu_code,
        data.user_id,
        data.key,
      );
      return { status: 200, data: result };
    } catch (error) {
      return { status: 400, error: 'Failed to delete app config', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'appConfig.getReportEmailForSend', service: 'business' })
  async getReportEmailForSend(data: { bu_code: string }) {
    try {
      const config = await this.appConfigService.getReportEmailForSend(data.bu_code);
      if (!config) return { status: 404, error: 'report_email not configured for BU' };
      return { status: 200, data: config };
    } catch (error) {
      return {
        status: 500,
        error: 'Failed to load report_email config',
        details: errMsg(error),
      };
    }
  }

  @MessagePattern({ cmd: 'appConfig.testEmail', service: 'business' })
  async testEmail(data: { bu_code: string; user_id: string }) {
    try {
      const result = await this.appConfigService.testEmail(data.bu_code, data.user_id);
      return { status: 200, data: result };
    } catch (error) {
      return { status: 500, error: 'Test email failed', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'appConfig.signatureCandidates', service: 'business' })
  async signatureCandidates(data: {
    bu_code: string;
    user_id: string;
    doc_type: string;
  }) {
    try {
      const result = await this.appConfigService.getSignatureCandidates(
        data.bu_code,
        data.user_id,
        data.doc_type,
      );
      return { status: 200, data: result };
    } catch (error) {
      return {
        status: 500,
        error: 'Failed to load signature candidates',
        details: errMsg(error),
      };
    }
  }
}
