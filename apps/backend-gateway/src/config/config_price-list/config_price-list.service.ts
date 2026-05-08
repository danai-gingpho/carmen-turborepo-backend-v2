import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  PriceListCreateDto,
  PriceListUpdateDto,
  MicroserviceResponse,
} from '@/common';
import { IPaginate } from 'src/shared-dto/paginate.dto';
import { firstValueFrom } from 'rxjs';
import { Observable } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { ResponseLib } from 'src/libs/response.lib';
import { BackendLogger } from 'src/common/helpers/backend.logger';

import { getGatewayRequestContext } from '@/common/context/gateway-request-context';
@Injectable()
export class Config_PriceListService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_PriceListService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE') private readonly masterService: ClientProxy,
  ) {}

  /**
   * Find a price list by ID via microservice
   * ค้นหารายการราคาเดียวตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Price list ID / รหัสรายการราคา
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Price list data or error / ข้อมูลรายการราคาหรือข้อผิดพลาด
   */
  async findOne(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.findOne', service: 'price-list' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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

  /**
   * Find all price lists with pagination via microservice
   * ค้นหารายการราคาทั้งหมดพร้อมการแบ่งหน้าผ่านไมโครเซอร์วิส
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param paginate - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated price list data or error / ข้อมูลรายการราคาพร้อมการแบ่งหน้าหรือข้อผิดพลาด
   */
  async findAll(
    user_id: string,
    bu_code: string,
    paginate: IPaginate,
    version: string,
  ): Promise<unknown> {
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

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.findAll', service: 'price-list' },
      {
        user_id: user_id,
        bu_code: bu_code,
        paginate: paginate,
        version: version, ...getGatewayRequestContext() },
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

  /**
   * Update an existing price list via microservice
   * อัปเดตรายการราคาที่มีอยู่ผ่านไมโครเซอร์วิส
   * @param id - Price list ID / รหัสรายการราคา
   * @param updateConfigPriceListDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated price list or error / รายการราคาที่อัปเดตแล้วหรือข้อผิดพลาด
   */
  async update(
    id: string,
    updateConfigPriceListDto: PriceListUpdateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateConfigPriceListDto,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.update', service: 'price-list' },
      {
        id: id,
        data: updateConfigPriceListDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
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

  /**
   * Create a new price list via microservice
   * สร้างรายการราคาใหม่ผ่านไมโครเซอร์วิส
   * @param createConfigPriceListDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created price list or error / รายการราคาที่สร้างแล้วหรือข้อผิดพลาด
   */
  async create(
    createConfigPriceListDto: PriceListCreateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'create',
        createConfigPriceListDto,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.create', service: 'price-list' },
      {
        data: createConfigPriceListDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
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

  /**
   * Remove a price list by ID via microservice
   * ลบรายการราคาตาม ID ผ่านไมโครเซอร์วิส
   * @param id - Price list ID / รหัสรายการราคา
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result or error / ผลการลบหรือข้อผิดพลาด
   */
  async remove(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'remove',
        id,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.remove', service: 'price-list' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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

  /**
   * Upload price list data from Excel via microservice
   * อัปโหลดข้อมูลรายการราคาจาก Excel ผ่านไมโครเซอร์วิส
   * @param createConfigPriceListDto - Excel upload data / ข้อมูลอัปโหลดจาก Excel
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Upload result or error / ผลการอัปโหลดหรือข้อผิดพลาด
   */
  async uploadExcel(
    createConfigPriceListDto: PriceListCreateDto,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'uploadExcel',
        createConfigPriceListDto,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.uploadExcel', service: 'price-list' },
      {
        data: createConfigPriceListDto,
        user_id: user_id,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
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

  /**
   * Download price list as Excel via microservice
   * ดาวน์โหลดรายการราคาเป็นไฟล์ Excel ผ่านไมโครเซอร์วิส
   * @param id - Price list ID / รหัสรายการราคา
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Excel file data or error / ข้อมูลไฟล์ Excel หรือข้อผิดพลาด
   */
  async downloadExcel(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'downloadExcel',
        id,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.downloadExcel', service: 'price-list' },
      { id: id, user_id: user_id, bu_code: bu_code, version: version, ...getGatewayRequestContext() },
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

  /**
   * Import price list data from CSV via microservice
   * นำเข้าข้อมูลรายการราคาจากไฟล์ CSV ผ่านไมโครเซอร์วิส
   * @param csvContent - CSV file content as string / เนื้อหาไฟล์ CSV เป็นข้อความ
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Import result or error / ผลการนำเข้าหรือข้อผิดพลาด
   */
  async importCsv(
    csvContent: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'importCsv',
        csvContentLength: csvContent?.length,
        version,
      },
      Config_PriceListService.name,
    );

    const res: Observable<MicroserviceResponse> = this.masterService.send(
      { cmd: 'price-list.importCsv', service: 'price-list' },
      {
        csvContent: csvContent,
        user_id: user_id,
        bu_code: bu_code,
        version: version, ...getGatewayRequestContext() },
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
