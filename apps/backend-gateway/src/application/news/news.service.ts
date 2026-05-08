import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class NewsService {
  private readonly logger: BackendLogger = new BackendLogger(NewsService.name);

  constructor(
    @Inject('CLUSTER_SERVICE')
    private readonly clusterService: ClientProxy,
  ) {}

  /**
   * List all news articles with pagination
   * ค้นหารายการข่าวสารทั้งหมดแบบแบ่งหน้า
   * @param user_id - User ID / รหัสผู้ใช้
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of news / รายการข่าวสารแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        paginate,
        version,
      },
      NewsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'news.findAll', service: 'news' },
      { user_id, paginate, version, ...getGatewayRequestContext() },
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

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Find a news article by ID
   * ค้นหาข่าวสารรายการเดียวตาม ID
   * @param id - News article ID / รหัสข่าวสาร
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns News article details / รายละเอียดข่าวสาร
   */
  async findOne(id: string, user_id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        version,
      },
      NewsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'news.findOne', service: 'news' },
      { id, user_id, version, ...getGatewayRequestContext() },
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

  /**
   * Create a new news article
   * สร้างข่าวสารใหม่
   * @param createNewsDto - News data to create / ข้อมูลข่าวสารที่จะสร้าง
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Created news article / ข่าวสารที่สร้างแล้ว
   */
  async create(
    createNewsDto: Record<string, unknown>,
    user_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'create',
        createNewsDto,
        user_id,
        version,
      },
      NewsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'news.create', service: 'news' },
      { data: createNewsDto, user_id, version, ...getGatewayRequestContext() },
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

  /**
   * Update a news article by ID
   * อัปเดตข่าวสารตาม ID
   * @param id - News article ID / รหัสข่าวสาร
   * @param updateNewsDto - News data to update / ข้อมูลข่าวสารที่จะอัปเดต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Updated news article / ข่าวสารที่อัปเดตแล้ว
   */
  async update(
    id: string,
    updateNewsDto: Record<string, unknown>,
    user_id: string,
    version: string,
  ): Promise<unknown> {
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

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'news.update', service: 'news' },
      { id, data: updateNewsDto, user_id, version, ...getGatewayRequestContext() },
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

  /**
   * Delete a news article by ID
   * ลบข่าวสารตาม ID
   * @param id - News article ID / รหัสข่าวสาร
   * @param user_id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Delete result / ผลลัพธ์การลบ
   */
  async delete(id: string, user_id: string, version: string): Promise<unknown> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        version,
      },
      NewsService.name,
    );

    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'news.delete', service: 'news' },
      { id, user_id, version, ...getGatewayRequestContext() },
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
