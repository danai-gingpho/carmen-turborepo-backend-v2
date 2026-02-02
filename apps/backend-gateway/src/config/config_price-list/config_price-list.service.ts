import { ConsoleLogger, HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  PriceListCreateDto,
  PriceListUpdateDto,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { ResponseLib } from 'src/libs/response.lib';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class Config_PriceListService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_PriceListService.name,
  );

  constructor(
    @Inject('MASTER_SERVICE') private readonly masterService: ClientProxy,
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
      Config_PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.findOne', service: 'price-list' },
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
      Config_PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.findAll', service: 'price-list' },
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

  async update(
    id: string,
    updateConfigPriceListDto: PriceListUpdateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateConfigPriceListDto,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.update', service: 'price-list' },
      {
        id: id,
        data: updateConfigPriceListDto,
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

  async create(
    createConfigPriceListDto: PriceListCreateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        createConfigPriceListDto,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.create', service: 'price-list' },
      {
        data: createConfigPriceListDto,
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

    return ResponseLib.success(response.data);
  }

  async remove(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'remove',
        id,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.remove', service: 'price-list' },
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

  async uploadExcel(
    createConfigPriceListDto: PriceListCreateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'uploadExcel',
        createConfigPriceListDto,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.uploadExcel', service: 'price-list' },
      {
        data: createConfigPriceListDto,
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

    return ResponseLib.success(response.data);
  }

  async downloadExcel(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'downloadExcel',
        id,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.downloadExcel', service: 'price-list' },
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

  async importCsv(
    csvContent: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'importCsv',
        csvContentLength: csvContent?.length,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<any> = this.masterService.send(
      { cmd: 'price-list.importCsv', service: 'price-list' },
      {
        csvContent: csvContent,
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

    return ResponseLib.success(response.data);
  }
}
