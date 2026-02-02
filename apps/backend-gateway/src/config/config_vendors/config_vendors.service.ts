import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { ICreateVendor, IUpdateVendor } from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';

@Injectable()
export class Config_VendorsService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_VendorsService.name,
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
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_VendorsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendors.findOne', service: 'vendors' },
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
      Config_VendorsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendors.findAll', service: 'vendors' },
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
    createDto: ICreateVendor,
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
      Config_VendorsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendors.create', service: 'vendors' },
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
    updateDto: IUpdateVendor,
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
      Config_VendorsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendors.update', service: 'vendors' },
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
      Config_VendorsService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendors.delete', service: 'vendors' },
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
}
