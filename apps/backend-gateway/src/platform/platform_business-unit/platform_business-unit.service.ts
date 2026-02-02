import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  IBusinessUnitConfig,
  IBusinessUnitCreate,
  IBusinessUnitUpdate,
} from './dto/business-unit.dto';
import { firstValueFrom, Observable } from 'rxjs';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class Platform_BusinessUnitService {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_BusinessUnitService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE')
    private readonly businessUnitService: ClientProxy,
  ) { }

  async createBusinessUnit(
    data: IBusinessUnitCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'createBusinessUnit',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.create', service: 'business-unit' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version },
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

  async updateBusinessUnit(
    data: IBusinessUnitUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'updateBusinessUnit',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.update', service: 'business-unit' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version },
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

  async deleteBusinessUnit(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'deleteBusinessUnit',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.delete', service: 'business-unit' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
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

  async getBusinessUnitList(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitList',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.list', service: 'business-unit' },
      {
        data: null,
        user_id: user_id,
        tenant_id: tenant_id,
        paginate: paginate,
        version: version,
      },
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

  async getBusinessUnitById(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitById',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.get-by-id', service: 'business-unit' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version },
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

  async patchBusinessUnitConfigs(
    bu_code: string,
    data: IBusinessUnitConfig,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'patchBusinessUnitConfigs',
        bu_code,
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.patch-configs', service: 'business-unit' },
      {
        bu_code: bu_code,
        data: data,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
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

  async getBusinessUnitConfigByKey(
    bu_code: string,
    key: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitConfigByKey',
        bu_code,
        key,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.get-config-by-key', service: 'business-unit' },
      {
        bu_code: bu_code,
        key: key,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
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

  async getBusinessUnitConfigs(
    bu_code: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitConfigs',
        bu_code,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.get-configs', service: 'business-unit' },
      { bu_code: bu_code, user_id: user_id, tenant_id: tenant_id, version: version },
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

  async getBusinessUnitSystemConfigs(
    bu_code: string,
    user_id: string,
    // tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitSystemConfigs',
        bu_code,
        user_id,
        // tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.get-system-configs', service: 'business-unit' },
      { user_id: user_id, bu_code: bu_code, version: version },
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

  async putBusinessUnitConfigs(
    bu_code: string,
    data: IBusinessUnitConfig[],
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'putBusinessUnitConfigs',
        bu_code,
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.put-configs', service: 'business-unit' },
      {
        bu_code: bu_code,
        data: data,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
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

  async deleteBusinessUnitConfigByKey(
    bu_code: string,
    key: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'deleteBusinessUnitConfigByKey',
        bu_code,
        key,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      { cmd: 'business-unit.delete-config-by-key', service: 'business-unit' },
      {
        bu_code: bu_code,
        key: key,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
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

  async getBusinessUnitConfigByKeyExists(
    bu_code: string,
    key: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getBusinessUnitConfigByKeyExists',
        bu_code,
        key,
        user_id,
        tenant_id,
        version,
      },
      Platform_BusinessUnitService.name,
    );
    const res: Observable<any> = this.businessUnitService.send(
      {
        cmd: 'business-unit.get-config-by-key-exists',
        service: 'business-unit',
      },
      {
        bu_code: bu_code,
        key: key,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version,
      },
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
