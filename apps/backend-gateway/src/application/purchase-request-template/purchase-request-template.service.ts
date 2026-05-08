import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { CreatePurchaseRequestTemplateDto } from './dto/purchase-requesr-template.dto';
import { UpdatePurchaseRequestTemplateDto } from './dto/update-purchase-request-template.dto';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class PurchaseRequestTemplateService {
  private readonly logger: BackendLogger = new BackendLogger(
    PurchaseRequestTemplateService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  /**
   * Find all purchase request templates with pagination via microservice
   * ค้นหารายการทั้งหมดของเทมเพลตใบขอซื้อพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated template list / รายการเทมเพลตแบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        paginate,
        version,
      },
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.find-all',
        service: 'purchase-request-template',
      },
      {
        user_id: user_id,
        bu_code: bu_code,
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
   * Find a purchase request template by ID via microservice
   * ค้นหารายการเดียวตาม ID ของเทมเพลตใบขอซื้อผ่านไมโครเซอร์วิส
   * @param id - Template ID / รหัสเทมเพลต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Template data / ข้อมูลเทมเพลต
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.find-one',
        service: 'purchase-request-template',
      },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
   * Create a new purchase request template via microservice
   * สร้างเทมเพลตใบขอซื้อใหม่ผ่านไมโครเซอร์วิส
   * @param createPurchaseRequestTemplateDto - Template creation data / ข้อมูลสำหรับสร้างเทมเพลต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created template / เทมเพลตที่สร้างแล้ว
   */
  async create(
    createPurchaseRequestTemplateDto: CreatePurchaseRequestTemplateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        createPurchaseRequestTemplateDto,
        version,
      },
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.create',
        service: 'purchase-request-template',
      },
      {
        data: createPurchaseRequestTemplateDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
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
   * Update a purchase request template via microservice
   * อัปเดตเทมเพลตใบขอซื้อผ่านไมโครเซอร์วิส
   * @param id - Template ID / รหัสเทมเพลต
   * @param updatePurchaseRequestTemplateDto - Updated template data / ข้อมูลเทมเพลตที่อัปเดต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated template / เทมเพลตที่อัปเดตแล้ว
   */
  async update(
    id: string,
    updatePurchaseRequestTemplateDto: UpdatePurchaseRequestTemplateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updatePurchaseRequestTemplateDto,
        version,
      },
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.update',
        service: 'purchase-request-template',
      },
      {
        data: { id, ...updatePurchaseRequestTemplateDto },
        user_id: user_id,
        bu_code: bu_code,
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
   * Delete a purchase request template via microservice
   * ลบเทมเพลตใบขอซื้อผ่านไมโครเซอร์วิส
   * @param id - Template ID / รหัสเทมเพลต
   * @param user_id - User ID / รหัสผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      PurchaseRequestTemplateService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      {
        cmd: 'purchase-request-template.delete',
        service: 'purchase-request-template',
      },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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
