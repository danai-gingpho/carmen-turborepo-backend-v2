import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Platform_ReportTemplateService {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_ReportTemplateService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE')
    private readonly clusterService: ClientProxy,
    @Inject('BUSINESS_SERVICE')
    private readonly businessService: ClientProxy,
  ) {}

  /**
   * Forward to micro-business sqlQuery.dbObjects to introspect the tenant
   * schema for views / functions / procedures available as a report source.
   */
  async listDbObjects(user_id: string, bu_code: string): Promise<unknown> {
    interface DbObjectsResp {
      status: number;
      data?: {
        views?: { name: string }[];
        procedures?: { name: string; kind?: string }[];
      };
      error?: string;
      details?: string;
    }
    const obs: Observable<DbObjectsResp> = this.businessService.send(
      { cmd: 'sqlQuery.dbObjects', service: 'business' },
      { bu_code, user_id, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(obs);
    if (response.status !== HttpStatus.OK) {
      const message = response.details
        ? `${response.error || 'Request failed'}: ${response.details}`
        : response.error || 'Request failed';
      return Result.error(message, httpStatusToErrorCode(response.status));
    }
    const data = response.data ?? {};
    const procs = data.procedures ?? [];
    return Result.ok({
      views: (data.views ?? []).map((v) => ({ name: v.name, kind: 'view' })),
      functions: procs
        .filter((p) => p.kind === 'function')
        .map((p) => ({ name: p.name, kind: 'function' })),
      procedures: procs
        .filter((p) => p.kind === 'procedure')
        .map((p) => ({ name: p.name, kind: 'procedure' })),
    });
  }

  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, version },
      Platform_ReportTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'report-template.findAll', service: 'report-template' },
      { user_id, tenant_id, paginate, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id, version },
      Platform_ReportTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'report-template.findOne', service: 'report-template' },
      { id, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async create(
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id, version },
      Platform_ReportTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'report-template.create', service: 'report-template' },
      { data, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async update(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      { function: 'update', id, data, user_id, tenant_id, version },
      Platform_ReportTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'report-template.update', service: 'report-template' },
      { id, data, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      { function: 'delete', id, user_id, tenant_id, version },
      Platform_ReportTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'report-template.delete', service: 'report-template' },
      { id, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
