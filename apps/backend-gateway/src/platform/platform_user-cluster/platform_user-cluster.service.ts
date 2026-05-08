import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { IUserCluster, IUserClusterUpdate } from './dto/user-cluster.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Platform_UserClusterService {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_UserClusterService.name,
  );

  constructor(
    @Inject('CLUSTER_SERVICE') private readonly clusterService: ClientProxy,
  ) { }

  /**
   * Retrieve a single user-cluster mapping by ID
   * ค้นหาการเชื่อมโยงผู้ใช้กับคลัสเตอร์เดียวตาม ID
   * @param cluster_id - Cluster ID / รหัสคลัสเตอร์
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Mapping details / รายละเอียดการเชื่อมโยง
   */
  async getUserCluster(
    cluster_id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getUserCluster',
        cluster_id,
        user_id,
        tenant_id,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'cluster.get-user-by-id', service: 'cluster' },
      {
        cluster_id: cluster_id,
        user_id: user_id,
        tenant_id: tenant_id,
        version: version, ...getGatewayRequestContext() },
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
   * Retrieve all user-cluster mappings with pagination
   * ค้นหารายการการเชื่อมโยงผู้ใช้กับคลัสเตอร์ทั้งหมดพร้อมการแบ่งหน้า
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated mapping list / รายการการเชื่อมโยงแบบแบ่งหน้า
   */
  async getUserClusterAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getUserClusterAll',
        user_id,
        tenant_id,
        paginate,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'cluster.get-all-user', service: 'cluster' },
      {
        data: null,
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

    return Result.ok({ data: response.data, paginate: response.paginate });
  }

  /**
   * Create a new user-cluster mapping via microservice
   * สร้างการเชื่อมโยงผู้ใช้กับคลัสเตอร์ใหม่ผ่านไมโครเซอร์วิส
   * @param data - Mapping creation data / ข้อมูลสำหรับสร้างการเชื่อมโยง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Created mapping / การเชื่อมโยงที่ถูกสร้าง
   */
  async createUserCluster(
    data: IUserCluster,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'createUserCluster',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'cluster.create-user', service: 'cluster' },
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
   * Update an existing user-cluster mapping via microservice
   * อัปเดตการเชื่อมโยงผู้ใช้กับคลัสเตอร์ที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param data - Mapping update data / ข้อมูลสำหรับอัปเดตการเชื่อมโยง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Updated mapping / การเชื่อมโยงที่ถูกอัปเดต
   */
  async updateUserCluster(
    data: IUserClusterUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'updateUserCluster',
        data,
        user_id,
        tenant_id,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      {
        cmd: 'cluster.update-user',
        service: 'cluster',
      },
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
   * Delete a user-cluster mapping via microservice
   * ลบการเชื่อมโยงผู้ใช้กับคลัสเตอร์ผ่านไมโครเซอร์วิส
   * @param id - Mapping ID / รหัสการเชื่อมโยง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param tenant_id - Tenant ID / รหัสผู้เช่า
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async deleteUserCluster(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'deleteUserCluster',
        id,
        user_id,
        tenant_id,
        version,
      },
      Platform_UserClusterService.name,
    );
    const res: Observable<MicroserviceResponse> = this.clusterService.send(
      { cmd: 'cluster.delete-user', service: 'cluster' },
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
