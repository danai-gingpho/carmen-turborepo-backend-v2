import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import {
  IStockInCreate,
  IStockInUpdate,
  Result,
  MicroserviceResponse,
  StockInDetailCreateDto,
  StockInDetailUpdateDto,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { ErrorCode } from 'src/common/result/error';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class StockInService {
  private readonly logger: BackendLogger = new BackendLogger(StockInService.name);

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  /**
   * Find a stock-in record by ID via microservice.
   * ค้นหารายการรับสินค้าเข้าคลังเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Stock-in record or error / รายการรับสินค้าเข้าคลังหรือข้อผิดพลาด
   */
  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in.findOne', service: 'stock-in' },
      { id, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Find all stock-in records with pagination via microservice.
   * ค้นหารายการรับสินค้าเข้าคลังทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated stock-in records or error / รายการรับสินค้าเข้าคลังพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in.findAll', service: 'stock-in' },
      { user_id, tenant_id, paginate, version, ...getGatewayRequestContext() },
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
   * Create a new stock-in record via microservice.
   * สร้างรายการรับสินค้าเข้าคลังใหม่ผ่านไมโครเซอร์วิส
   * @param data - Stock in creation data / ข้อมูลสำหรับสร้างรายการรับสินค้าเข้าคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Created stock-in record or error / รายการรับสินค้าเข้าคลังที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    data: IStockInCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in.create', service: 'stock-in' },
      { data, user_id, tenant_id, version, ...getGatewayRequestContext() },
    );

    let response: MicroserviceResponse;
    try {
      response = await firstValueFrom(res);
    } catch (err) {
      this.logger.error({ function: 'create', error: JSON.stringify(err) }, 'stock-in.create threw');
      let errMsg: string;
      if (typeof err === 'string') {
        errMsg = err;
      } else if (err instanceof Error) {
        errMsg = err.message;
      } else if (typeof err === 'object' && err !== null) {
        errMsg = JSON.stringify(err);
      } else {
        errMsg = String(err);
      }
      // If errMsg is still [object Object], force stringify
      if (errMsg === '[object Object]') {
        try { errMsg = JSON.stringify(err, Object.getOwnPropertyNames(err as object)); } catch { errMsg = 'Unknown error in stock-in.create'; }
      }
      return Result.error(errMsg, ErrorCode.INTERNAL);
    }

    if (response.response.status !== HttpStatus.CREATED) {
      const msg = typeof response.response.message === 'string'
        ? response.response.message
        : JSON.stringify(response.response.message);
      return Result.error(
        msg,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }

  /**
   * Update an existing stock-in record via microservice.
   * อัปเดตรายการรับสินค้าเข้าคลังที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param data - Stock in update data / ข้อมูลสำหรับอัปเดตรายการรับสินค้าเข้าคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Updated stock-in record or error / รายการรับสินค้าเข้าคลังที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    data: IStockInUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in.update', service: 'stock-in' },
      { data, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Delete a stock-in record via microservice.
   * ลบรายการรับสินค้าเข้าคลังผ่านไมโครเซอร์วิส
   * @param id - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลลัพธ์การลบหรือข้อผิดพลาด
   */
  async delete(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'delete', id, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in.delete', service: 'stock-in' },
      { id, user_id, tenant_id, version, ...getGatewayRequestContext() },
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

  async voidStockIn(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'voidStockIn', id, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in.void', service: 'stock-in' },
      { id, data, user_id, tenant_id, version, ...getGatewayRequestContext() },
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

  // ==================== Stock In Detail CRUD ====================

  /**
   * Find a stock-in detail by ID via microservice.
   * ค้นหารายการย่อยรับสินค้าเข้าคลังเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param detailId - Stock in detail ID / รหัสรายการย่อยรับสินค้าเข้าคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Stock-in detail or error / รายการย่อยรับสินค้าเข้าคลังหรือข้อผิดพลาด
   */
  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in-detail.find-by-id', service: 'stock-in' },
      { detail_id: detailId, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Find all details for a stock-in record via microservice.
   * ค้นหารายการย่อยทั้งหมดของรายการรับสินค้าเข้าคลังผ่านไมโครเซอร์วิส
   * @param stockInId - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns List of stock-in details or error / รายการย่อยรับสินค้าเข้าคลังหรือข้อผิดพลาด
   */
  async findDetailsByStockInId(
    stockInId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailsByStockInId', stockInId, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in-detail.find-all', service: 'stock-in' },
      { stock_in_id: stockInId, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Create a new stock-in detail via microservice.
   * สร้างรายการย่อยรับสินค้าเข้าคลังใหม่ผ่านไมโครเซอร์วิส
   * @param stockInId - Stock in record ID / รหัสรายการรับสินค้าเข้าคลัง
   * @param data - Detail creation data / ข้อมูลสำหรับสร้างรายการย่อย
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Created stock-in detail or error / รายการย่อยรับสินค้าเข้าคลังที่สร้างแล้วหรือข้อผิดพลาด
   */
  async createDetail(
    stockInId: string,
    data: StockInDetailCreateDto,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'createDetail', stockInId, data, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in-detail.create', service: 'stock-in' },
      { stock_in_id: stockInId, data, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Update an existing stock-in detail via microservice.
   * อัปเดตรายการย่อยรับสินค้าเข้าคลังที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param detailId - Stock in detail ID / รหัสรายการย่อยรับสินค้าเข้าคลัง
   * @param data - Detail update data / ข้อมูลสำหรับอัปเดตรายการย่อย
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Updated stock-in detail or error / รายการย่อยรับสินค้าเข้าคลังที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async updateDetail(
    detailId: string,
    data: StockInDetailUpdateDto,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'updateDetail', detailId, data, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in-detail.update', service: 'stock-in' },
      { detail_id: detailId, data, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Delete a stock-in detail via microservice.
   * ลบรายการย่อยรับสินค้าเข้าคลังผ่านไมโครเซอร์วิส
   * @param detailId - Stock in detail ID / รหัสรายการย่อยรับสินค้าเข้าคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลลัพธ์การลบหรือข้อผิดพลาด
   */
  async deleteDetail(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'deleteDetail', detailId, user_id, tenant_id, version },
      StockInService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-in-detail.delete', service: 'stock-in' },
      { detail_id: detailId, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
