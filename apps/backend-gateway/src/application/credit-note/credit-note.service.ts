import { HttpStatus, Injectable } from '@nestjs/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { CreateCreditNoteDto, UpdateCreditNoteDto, Result, MicroserviceResponse } from '@/common';
import { httpStatusToErrorCode } from 'src/common/helpers/http-status-to-error-code';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class CreditNoteService {
  private readonly logger: BackendLogger = new BackendLogger(
    CreditNoteService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly procurementService: ClientProxy,
  ) {}

  /**
   * Find a credit note by ID via microservice
   * ค้นหาใบลดหนี้เดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Credit note ID / รหัสใบลดหนี้
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Credit note details / รายละเอียดใบลดหนี้
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        user_id,
        bu_code,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'credit-note.find-one', service: 'credit-note' },
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
   * Find all credit notes with pagination via microservice
   * ค้นหาใบลดหนี้ทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated credit note list / รายการใบลดหนี้แบบแบ่งหน้า
   */
  async findAll(
    user_id: string,
    bu_code: string,
    query: IPaginate,
    version: string = 'latest',
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        query,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'credit-note.find-all', service: 'credit-note' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: query,
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
   * Create a new credit note via microservice
   * สร้างใบลดหนี้ใหม่ผ่านไมโครเซอร์วิส
   * @param createDto - Credit note creation data / ข้อมูลสำหรับสร้างใบลดหนี้
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created credit note / ใบลดหนี้ที่สร้างขึ้น
   */
  async create(
    createDto: CreateCreditNoteDto,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        user_id,
        bu_code,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'credit-note.create', service: 'credit-note' },
      {
        data: createDto,
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
   * Update a credit note via microservice
   * อัปเดตใบลดหนี้ผ่านไมโครเซอร์วิส
   * @param updateDto - Fields to update / ข้อมูลที่ต้องการอัปเดต
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated credit note / ใบลดหนี้ที่อัปเดตแล้ว
   */
  async update(
    updateDto: UpdateCreditNoteDto,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        updateDto,
        user_id,
        bu_code,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'credit-note.update', service: 'credit-note' },
      {
        data: updateDto,
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
   * Delete a credit note by ID via microservice
   * ลบใบลดหนี้ตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Credit note ID / รหัสใบลดหนี้
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  async delete(
    id: string,
    user_id: string,
    bu_code: string,
    version: string = 'latest',
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        user_id,
        bu_code,
        version,
      },
      CreditNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'credit-note.delete', service: 'credit-note' },
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

  async submit(
    id: string,
    user_id: string,
    tenant_id: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      { function: 'submit', id, user_id, tenant_id, version },
      CreditNoteService.name,
    );

    const res: Observable<MicroserviceResponse> = this.procurementService.send(
      { cmd: 'credit-note.submit', service: 'credit-note' },
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
   * Print a credit note via FastReport viewer (micro-report)
   * พิมพ์ใบลดหนี้ผ่าน FastReport viewer (micro-report)
   */
  async printToReport(
    id: string,
    user_id: string,
    bu_code: string,
  ): Promise<Result<{ viewer_url: string }>> {
    this.logger.debug(
      { function: 'printToReport', id },
      CreditNoteService.name,
    );

    const response = await firstValueFrom(
      this.procurementService.send(
        { cmd: 'credit-note.printToReport', service: 'credit-note' },
        { id, user_id, bu_code, ...getGatewayRequestContext() },
      ),
    );

    if (response.response.status !== HttpStatus.OK) {
      return Result.error(
        response.response.message,
        httpStatusToErrorCode(response.response.status),
      );
    }

    return Result.ok(response.data);
  }
}
