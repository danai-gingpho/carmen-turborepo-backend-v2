import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class Config_UserLocationService {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_UserLocationService.name,
  );

  constructor(
    @Inject('BUSINESS_SERVICE')
    private readonly _masterService: ClientProxy,
  ) {}

  /**
   * Get all users assigned to a location via microservice
   * ค้นหารายการผู้ใช้ทั้งหมดที่ผูกกับสถานที่ผ่านไมโครเซอร์วิส
   * @param locationId - Location ID / รหัสสถานที่
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of users for the location / รายการผู้ใช้ของสถานที่
   */
  async getUsersByLocationId(
    locationId: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'getUsersByLocationId',
        locationId,
        version,
      },
      Config_UserLocationService.name,
    );
    throw new NotImplementedException('Not implemented');
  }

  /**
   * Update user-location assignments via microservice
   * อัปเดตการกำหนดผู้ใช้-สถานที่ผ่านไมโครเซอร์วิส
   * @param locationId - Location ID / รหัสสถานที่
   * @param updateDto - User-location assignment update data / ข้อมูลสำหรับอัปเดตการกำหนดผู้ใช้-สถานที่
   * @param user_id - Requesting user ID / รหัสผู้ใช้ที่ร้องขอ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated assignment result / ผลลัพธ์การอัปเดตการกำหนด
   */
  async managerUserLocation(
    locationId: string,
    updateDto: Record<string, unknown>,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<unknown> {
    this.logger.debug(
      {
        function: 'managerUserLocation',
        locationId,
        updateDto,
        version,
      },
      Config_UserLocationService.name,
    );
    throw new NotImplementedException('Not implemented');
  }
}
