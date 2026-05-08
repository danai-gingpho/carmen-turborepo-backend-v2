import {
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { Result } from '@/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';

@Injectable()
export class VendorProductService {
  private readonly logger: BackendLogger = new BackendLogger(
    VendorProductService.name,
  );

  /**
   * Find a specific vendor-product mapping by ID (not implemented)
   * ค้นหารายการสินค้าผู้ขายเดียวตาม ID (ยังไม่ได้พัฒนา)
   * @param id - Vendor product ID / รหัสสินค้าผู้ขาย
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Vendor product details / รายละเอียดสินค้าผู้ขาย
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
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  /**
   * Find all vendor-product mappings for a business unit (not implemented)
   * ค้นหารายการสินค้าผู้ขายทั้งหมดของหน่วยธุรกิจ (ยังไม่ได้พัฒนา)
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns List of vendor products / รายการสินค้าผู้ขาย
   */
  async findAll(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id,
        bu_code,
        version,
      },
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  /**
   * Create a new vendor-product mapping (not implemented)
   * สร้างการผูกสินค้ากับผู้ขายใหม่ (ยังไม่ได้พัฒนา)
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created vendor product / สินค้าผู้ขายที่สร้างแล้ว
   */
  async create(
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'create',
        user_id,
        bu_code,
        version,
      },
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  /**
   * Update an existing vendor-product mapping (not implemented)
   * อัปเดตการผูกสินค้ากับผู้ขายที่มีอยู่ (ยังไม่ได้พัฒนา)
   * @param id - Vendor product ID / รหัสสินค้าผู้ขาย
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated vendor product / สินค้าผู้ขายที่อัปเดตแล้ว
   */
  async update(
    id: string,
    user_id: string,
    bu_code: string,
    version: string,
  ): Promise<Result<unknown>> {
    this.logger.debug(
      {
        function: 'update',
        id,
        user_id,
        bu_code,
        version,
      },
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }

  /**
   * Delete a vendor-product mapping by ID (not implemented)
   * ลบการผูกสินค้ากับผู้ขายตาม ID (ยังไม่ได้พัฒนา)
   * @param id - Vendor product ID / รหัสสินค้าผู้ขาย
   * @param user_id - Authenticated user ID / รหัสผู้ใช้ที่ยืนยันตัวตนแล้ว
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
        user_id,
        bu_code,
        version,
      },
      VendorProductService.name,
    );

    throw new NotImplementedException('Not implemented');
  }
}
