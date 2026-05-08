import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result } from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { getGatewayRequestContext } from '@/common/context/gateway-request-context';

interface MicroResponse {
  status: number;
  data?: unknown;
  error?: string;
  details?: string;
}

@Injectable()
export class Config_SqlQueryService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_SqlQueryService.name,
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
    const obs: Observable<MicroResponse> = this.businessService.send(
      { cmd, service: 'business' },
      { ...payload, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(obs);

    if (response.status !== okStatus) {
      const message = response.details
        ? `${response.error || 'Request failed'}: ${response.details}`
        : response.error || 'Request failed';
      this.logger.warn(
        { function: 'call', cmd, status: response.status, error: response.error, details: response.details },
        Config_SqlQueryService.name,
      );
      return Result.error(message, httpStatusToErrorCode(response.status));
    }
    return Result.ok(response.data);
  }

  async execute(bu_code: string, user_id: string, sql_text: string) {
    return this.call('sqlQuery.execute', { bu_code, user_id, sql_text });
  }

  async saveDdl(
    bu_code: string,
    user_id: string,
    body: { name?: string; sql_text: string; query_type: string },
  ) {
    return this.call('sqlQuery.saveDdl', { bu_code, user_id, ...body });
  }

  async listDbObjects(bu_code: string, user_id: string) {
    return this.call('sqlQuery.dbObjects', { bu_code, user_id });
  }

  async getDbObjectDefinition(
    bu_code: string,
    user_id: string,
    type: string,
    schema: string,
    name: string,
  ) {
    return this.call('sqlQuery.dbObjectDefinition', {
      bu_code,
      user_id,
      type,
      schema,
      name,
    });
  }

  async dropDbObject(
    bu_code: string,
    user_id: string,
    type: string,
    schema: string,
    name: string,
  ) {
    return this.call('sqlQuery.dropDbObject', {
      bu_code,
      user_id,
      type,
      schema,
      name,
    });
  }
}
