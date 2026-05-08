import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import {
  IStockOutCreate,
  IStockOutUpdate,
  Result,
  MicroserviceResponse,
  StockOutDetailCreateDto,
  StockOutDetailUpdateDto,
} from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class StockOutService {
  private readonly logger: BackendLogger = new BackendLogger(StockOutService.name);

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly inventoryService: ClientProxy,
  ) {}

  /**
   * Find a stock-out record by ID via microservice.
   * ค้นหารายการจ่ายสินค้าออกคลังเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Stock out record ID / รหัสรายการจ่ายสินค้าออกคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Stock-out record or error / รายการจ่ายสินค้าออกคลังหรือข้อผิดพลาด
   */
  async findOne(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findOne', id, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out.findOne', service: 'stock-out' },
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
   * Find all stock-out records with pagination via microservice.
   * ค้นหารายการจ่ายสินค้าออกคลังทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated stock-out records or error / รายการจ่ายสินค้าออกคลังพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(
    user_id: string,
    tenant_id: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findAll', user_id, tenant_id, paginate, version },
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out.findAll', service: 'stock-out' },
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
   * Create a new stock-out record via microservice.
   * สร้างรายการจ่ายสินค้าออกคลังใหม่ผ่านไมโครเซอร์วิส
   * @param data - Stock out creation data / ข้อมูลสำหรับสร้างรายการจ่ายสินค้าออกคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Created stock-out record or error / รายการจ่ายสินค้าออกคลังที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    data: IStockOutCreate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'create', data, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out.create', service: 'stock-out' },
      { data, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Update an existing stock-out record via microservice.
   * อัปเดตรายการจ่ายสินค้าออกคลังที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param data - Stock out update data / ข้อมูลสำหรับอัปเดตรายการจ่ายสินค้าออกคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Updated stock-out record or error / รายการจ่ายสินค้าออกคลังที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    data: IStockOutUpdate,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'update', data, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out.update', service: 'stock-out' },
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
   * Delete a stock-out record via microservice.
   * ลบรายการจ่ายสินค้าออกคลังผ่านไมโครเซอร์วิส
   * @param id - Stock out record ID / รหัสรายการจ่ายสินค้าออกคลัง
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
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out.delete', service: 'stock-out' },
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

  async voidStockOut(
    id: string,
    data: Record<string, unknown>,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'voidStockOut', id, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out.void', service: 'stock-out' },
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

  // ==================== Stock Out Detail CRUD ====================

  /**
   * Find a stock-out detail by ID via microservice.
   * ค้นหารายการย่อยจ่ายสินค้าออกคลังเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param detailId - Stock out detail ID / รหัสรายการย่อยจ่ายสินค้าออกคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Stock-out detail or error / รายการย่อยจ่ายสินค้าออกคลังหรือข้อผิดพลาด
   */
  async findDetailById(
    detailId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailById', detailId, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out-detail.find-by-id', service: 'stock-out' },
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
   * Find all details for a stock-out record via microservice.
   * ค้นหารายการย่อยทั้งหมดของรายการจ่ายสินค้าออกคลังผ่านไมโครเซอร์วิส
   * @param stockOutId - Stock out record ID / รหัสรายการจ่ายสินค้าออกคลัง
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns List of stock-out details or error / รายการย่อยจ่ายสินค้าออกคลังหรือข้อผิดพลาด
   */
  async findDetailsByStockOutId(
    stockOutId: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'findDetailsByStockOutId', stockOutId, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out-detail.find-all', service: 'stock-out' },
      { stock_out_id: stockOutId, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Create a new stock-out detail via microservice.
   * สร้างรายการย่อยจ่ายสินค้าออกคลังใหม่ผ่านไมโครเซอร์วิส
   * @param stockOutId - Stock out record ID / รหัสรายการจ่ายสินค้าออกคลัง
   * @param data - Detail creation data / ข้อมูลสำหรับสร้างรายการย่อย
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Created stock-out detail or error / รายการย่อยจ่ายสินค้าออกคลังที่สร้างแล้วหรือข้อผิดพลาด
   */
  async createDetail(
    stockOutId: string,
    data: StockOutDetailCreateDto,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'createDetail', stockOutId, data, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out-detail.create', service: 'stock-out' },
      { stock_out_id: stockOutId, data, user_id, tenant_id, version, ...getGatewayRequestContext() },
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
   * Update an existing stock-out detail via microservice.
   * อัปเดตรายการย่อยจ่ายสินค้าออกคลังที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param detailId - Stock out detail ID / รหัสรายการย่อยจ่ายสินค้าออกคลัง
   * @param data - Detail update data / ข้อมูลสำหรับอัปเดตรายการย่อย
   * @param user_id - Current user ID / รหัสผู้ใช้ปัจจุบัน
   * @param tenant_id - Tenant ID (business unit code) / รหัสผู้เช่า (รหัสหน่วยธุรกิจ)
   * @param version - API version / เวอร์ชัน API
   * @returns Updated stock-out detail or error / รายการย่อยจ่ายสินค้าออกคลังที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async updateDetail(
    detailId: string,
    data: StockOutDetailUpdateDto,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'updateDetail', detailId, data, user_id, tenant_id, version },
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out-detail.update', service: 'stock-out' },
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
   * Delete a stock-out detail via microservice.
   * ลบรายการย่อยจ่ายสินค้าออกคลังผ่านไมโครเซอร์วิส
   * @param detailId - Stock out detail ID / รหัสรายการย่อยจ่ายสินค้าออกคลัง
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
      StockOutService.name,
    );

    const res: Observable<MicroserviceResponse> = this.inventoryService.send(
      { cmd: 'stock-out-detail.delete', service: 'stock-out' },
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
