import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import {
  IRunningCodeCreate,
  IRunningCodeUpdate,
} from './dto/config_running-code.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';

@Injectable()
export class Config_RunningCodeService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_RunningCodeService.name,
  );
  constructor(
    @Inject('MASTER_SERVICE')
    private readonly masterService: ClientProxy,
  ) {}

  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.findOne', service: 'running-codes' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.success(response.data);
  }

  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      Config_RunningCodeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.findAll', service: 'running-codes' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
        version: version,
      },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.successWithPaginate(response.data, response.paginate);
  }

  async create(
    createDto: IRunningCodeCreate,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_RunningCodeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.create', service: 'running-codes' },
      {
        data: createDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version,
      },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.CREATED) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.created(response.data);
  }

  async update(
    updateDto: IRunningCodeUpdate,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        version,
      },
      Config_RunningCodeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.update', service: 'running-codes' },
      {
        data: updateDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version,
      },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.success(response.data);
  }

  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_RunningCodeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.delete', service: 'running-codes' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.success(response.data);
  }

  async findByType(
    type: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findByType',
        type,
        version,
      },
      Config_RunningCodeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'running-code.findByType', service: 'running-codes' },
      { type: type, user_id: user_id, bu_code: bu_code, version: version },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return ResponseLib.error(
        response.response.status,
        response.response.message,
      );
    }

    return ResponseLib.success(response.data);
  }
}
