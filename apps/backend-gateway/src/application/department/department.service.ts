import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';

@Injectable()
export class DepartmentService {
  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentService.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  async getDepartment(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'getDepartment',
        id,
        user_id,
        bu_code,
        version,
      },
      DepartmentService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'departments.findOne', service: 'departments' },
      { id, user_id, bu_code, version },
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

  async findAll(
    user_id: string,
    bu_code: string,
    query: IPaginate,
    version: string,
  ): Promise<Result<any>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        query,
        version,
      },
      DepartmentService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'departments.findAll', service: 'departments' },
      {
        user_id: user_id,
        paginate: query,
        bu_code: bu_code,
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

    return Result.ok({ data: response.data, paginate: response.paginate });
  }
}
