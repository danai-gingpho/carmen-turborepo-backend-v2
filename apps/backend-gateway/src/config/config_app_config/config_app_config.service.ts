import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { getGatewayRequestContext } from '@/common/context/gateway-request-context';

/**
 * Shape returned by AppConfigController in micro-business:
 *   { status: number; data?: unknown; error?: string; details?: string }
 * (Different from BaseMicroserviceController.handleResult shape — kept simple
 * because the underlying service returns plain objects, not Result.)
 */
interface AppConfigMicroResponse {
  status: number;
  data?: unknown;
  error?: string;
  details?: string;
}

@Injectable()
export class Config_AppConfigService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_AppConfigService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly businessService: ClientProxy,
  ) {}

  private async call(
    cmd: string,
    payload: Record<string, unknown>,
    okStatus: number = HttpStatus.OK,
  ): Promise<Result<unknown>> {
    const obs: Observable<AppConfigMicroResponse> = this.businessService.send(
      { cmd, service: 'business' },
      { ...payload, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(obs);

    if (response.status !== okStatus) {
      // Surface both the generic label and the underlying cause so the
      // frontend / caller can see *why* it failed (Zod message, Prisma error,
      // tenant lookup failure, etc.) instead of just "Request failed".
      const message = response.details
        ? `${response.error || 'Request failed'}: ${response.details}`
        : response.error || 'Request failed';
      if (response.status >= 500) {
        this.logger.warn(
          { function: 'call', cmd, status: response.status, error: response.error, details: response.details },
          Config_AppConfigService.name,
        );
      }
      return Result.error(message, httpStatusToErrorCode(response.status));
    }
    return Result.ok(response.data);
  }

  async list(bu_code: string, user_id: string) {
    this.logger.debug({ function: 'list', bu_code }, Config_AppConfigService.name);
    return this.call('appConfig.list', { bu_code, user_id });
  }

  async get(bu_code: string, user_id: string, key: string) {
    this.logger.debug({ function: 'get', bu_code, key }, Config_AppConfigService.name);
    return this.call('appConfig.get', { bu_code, user_id, key });
  }

  async upsert(bu_code: string, user_id: string, key: string, value: unknown) {
    this.logger.debug({ function: 'upsert', bu_code, key }, Config_AppConfigService.name);
    return this.call('appConfig.upsert', { bu_code, user_id, key, value });
  }

  async delete(bu_code: string, user_id: string, key: string) {
    this.logger.debug({ function: 'delete', bu_code, key }, Config_AppConfigService.name);
    return this.call('appConfig.delete', { bu_code, user_id, key });
  }

  async testEmail(bu_code: string, user_id: string) {
    this.logger.debug({ function: 'testEmail', bu_code }, Config_AppConfigService.name);
    return this.call('appConfig.testEmail', { bu_code, user_id });
  }

  async signatureCandidates(bu_code: string, user_id: string, doc_type: string) {
    this.logger.debug(
      { function: 'signatureCandidates', bu_code, doc_type },
      Config_AppConfigService.name,
    );
    return this.call('appConfig.signatureCandidates', { bu_code, user_id, doc_type });
  }
}
