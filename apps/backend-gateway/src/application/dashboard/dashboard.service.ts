import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { getGatewayRequestContext } from '@/common/context/gateway-request-context';

@Injectable()
export class DashboardService {
  private readonly logger: BackendLogger = new BackendLogger(
    DashboardService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly businessService: ClientProxy,
  ) {}

  async findAll(user_id: string, bu_code: string): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'dashboard.findAll', service: 'dashboard' },
      { user_id, bu_code, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async findOne(id: string, user_id: string, bu_code: string): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'dashboard.findOne', service: 'dashboard' },
      { id, user_id, bu_code, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async create(user_id: string, bu_code: string, data: unknown): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'dashboard.create', service: 'dashboard' },
      { user_id, bu_code, data, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async update(id: string, user_id: string, bu_code: string, data: unknown): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'dashboard.update', service: 'dashboard' },
      { user_id, bu_code, data: { id, ...(data as object) }, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async delete(id: string, user_id: string, bu_code: string): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'dashboard.delete', service: 'dashboard' },
      { id, user_id, bu_code, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async updateLayout(id: string, user_id: string, bu_code: string, data: unknown): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'dashboard.updateLayout', service: 'dashboard' },
      { id, user_id, bu_code, data, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async addWidget(dashboardId: string, user_id: string, bu_code: string, data: unknown): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'dashboard.addWidget', service: 'dashboard' },
      { id: dashboardId, user_id, bu_code, data, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.CREATED) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async updateWidget(
    dashboardId: string,
    widgetId: string,
    user_id: string,
    bu_code: string,
    data: unknown,
  ): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'dashboard.updateWidget', service: 'dashboard' },
      { id: dashboardId, widget_id: widgetId, user_id, bu_code, data, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }

  async deleteWidget(dashboardId: string, widgetId: string, user_id: string, bu_code: string): Promise<Result<unknown>> {
    const res: Observable<MicroserviceResponse> = this.businessService.send(
      { cmd: 'dashboard.deleteWidget', service: 'dashboard' },
      { id: dashboardId, widget_id: widgetId, user_id, bu_code, ...getGatewayRequestContext() },
    );
    const response = await firstValueFrom(res);
    if (response.response.status !== HttpStatus.OK) {
      return Result.error(response.response.message, httpStatusToErrorCode(response.response.status));
    }
    return Result.ok(response.data);
  }
}
