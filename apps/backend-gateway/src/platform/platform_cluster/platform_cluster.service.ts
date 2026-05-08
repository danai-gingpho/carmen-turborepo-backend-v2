import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { IClusterCreate, IClusterUpdate } from './dto/cluster.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Platform_ClusterService {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_ClusterService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) {}

  /**
   * Create a new cluster via microservice
   * สร้างคลัสเตอร์ใหม่ผ่านไมโครเซอร์วิส
   * @param data - Cluster creation data / ข้อมูลสำหรับสร้างคลัสเตอร์
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Created cluster / คลัสเตอร์ที่ถูกสร้าง
   */
  async createCluster(
    data: IClusterCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'createCluster',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'cluster.create', service: 'cluster' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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

  /**
   * Update an existing cluster via microservice
   * อัปเดตข้อมูลคลัสเตอร์ที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param data - Cluster update data / ข้อมูลสำหรับอัปเดตคลัสเตอร์
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Updated cluster / คลัสเตอร์ที่ถูกอัปเดต
   */
  async updateCluster(
    data: IClusterUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'updateCluster',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'cluster.update', service: 'cluster' },
      { data: data, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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

  /**
   * Delete a cluster via microservice
   * ลบคลัสเตอร์ผ่านไมโครเซอร์วิส
   * @param id - Cluster ID / รหัสคลัสเตอร์
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async deleteCluster(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'deleteCluster',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'cluster.delete', service: 'cluster' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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

  /**
   * Retrieve all clusters with pagination
   * ค้นหารายการคลัสเตอร์ทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated cluster list / รายการคลัสเตอร์แบบแบ่งหน้า
   */
  async getlistCluster(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getlistCluster',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'cluster.list', service: 'cluster' },
      {
        user_id: user_id,
        tenant_id: tenant_id,
        paginate: paginate,
        version: version, ...getGatewayRequestContext() },
    );

    const response = await firstValueFrom(res);

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok({
      data: response.data,
      paginate: response.paginate,
    });
  }

  /**
   * Retrieve a single cluster by ID
   * ค้นหาคลัสเตอร์เดียวตาม ID
   * @param id - Cluster ID / รหัสคลัสเตอร์
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Cluster details / รายละเอียดคลัสเตอร์
   */
  async getClusterById(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getClusterById',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_ClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'cluster.get-by-id', service: 'cluster' },
      { id: id, user_id: user_id, tenant_id: tenant_id, version: version, ...getGatewayRequestContext() },
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
