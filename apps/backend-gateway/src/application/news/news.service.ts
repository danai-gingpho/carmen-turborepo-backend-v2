import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ResponseLib } from 'src/libs/response.lib';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

@Injectable()
export class NewsService {
  private readonly logger: BackendLogger = new BackendLogger(NewsService.name);

  constructor(
    @Inject('CLUSTER_SERVICE')
    private readonly clusterService: ClientProxy,
  ) {}

  async findAll(
    user_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        paginate,
        version,
      },
      NewsService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'news.findAll', service: 'news' },
      { user_id, paginate, version },
    );
    const response = await firstValueFrom(res);
    // if (response.response.status !== HttpStatus.OK) {
    //   return ResponseLib.error(
    //     response.response.status,
    //     response.response.message,
    //   );
    // }
    // return ResponseLib.successWithPaginate(
    //   response.data.data,
    //   response.data.paginate,
    // );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async findOne(id: string, user_id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        version,
      },
      NewsService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'news.findOne', service: 'news' },
      { id, user_id, version },
    );
    const response = await firstValueFrom(res);
    // if (response.response.status !== HttpStatus.OK) {
    //   return ResponseLib.error(
    //     response.response.status,
    //     response.response.message,
    //   );
    // }
    // return ResponseLib.success(response.data);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async create(
    createNewsDto: any,
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'create',
        createNewsDto,
        user_id,
        version,
      },
      NewsService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'news.create', service: 'news' },
      { data: createNewsDto, user_id, version },
    );
    const response = await firstValueFrom(res);

    // if (response.response.status !== HttpStatus.CREATED) {
    //   return ResponseLib.error(
    //     response.response.status,
    //     response.response.message,
    //   );
    // }
    // return ResponseLib.success(response.data);

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
    updateNewsDto: any,
    user_id: string,
    version: string,
  ): Promise<any> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateNewsDto,
        user_id,
        version,
      },
      NewsService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'news.update', service: 'news' },
      { id, data: updateNewsDto, user_id, version },
    );
    const response = await firstValueFrom(res);

    // if (response.response.status !== HttpStatus.OK) {
    //   return ResponseLib.error(
    //     response.response.status,
    //     response.response.message,
    //   );
    // }
    // return ResponseLib.success(response.data);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  async delete(id: string, user_id: string, version: string): Promise<any> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        version,
      },
      NewsService.name,
    );

    const res: Observable<any> = this.clusterService.send(
      { cmd: 'news.delete', service: 'news' },
      { id, user_id, version },
    );
    const response = await firstValueFrom(res);

    // if (response.response.status !== HttpStatus.OK) {
    //   return ResponseLib.error(
    //     response.response.status,
    //     response.response.message,
    //   );
    // }
    // return ResponseLib.success(response.data);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
