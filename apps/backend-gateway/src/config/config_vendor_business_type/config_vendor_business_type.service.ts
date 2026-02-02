import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ICreateVendorBusinessType,
  IUpdateVendorBusinessType,
} from './dto/vendor_business_type.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';

@Injectable()
export class Config_VendorBusinessTypeService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_VendorBusinessTypeService.name,
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
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendor-business-type.findOne', service: 'vendor-business-type' },
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
    query: IPaginate,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        query,
        version,
      },
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendor-business-type.findAll', service: 'vendor-business-type' },
      {
        user_id: user_id,
        paginate: query,
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

    return ResponseLib.successWithPaginate(response.data, response.paginate);
  }

  async create(
    createDto: ICreateVendorBusinessType,
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
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendor-business-type.create', service: 'vendor-business-type' },
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
    updateDto: IUpdateVendorBusinessType,
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
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendor-business-type.update', service: 'vendor-business-type' },
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
      Config_VendorBusinessTypeService.name,
    );
    const res: Observable<any> = this.masterService.send(
      { cmd: 'vendor-business-type.delete', service: 'vendor-business-type' },
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
