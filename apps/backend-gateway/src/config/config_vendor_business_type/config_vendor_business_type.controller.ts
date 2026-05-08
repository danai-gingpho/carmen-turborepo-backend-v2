import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_VendorBusinessTypeService } from './config_vendor_business_type.service';
import { BaseHttpController, EnrichAuditUsers } from '@/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { VendorBusinessTypeCreateRequest, VendorBusinessTypeUpdateRequest } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  VendorBusinessTypeCreateDto,
  VendorBusinessTypeUpdateDto,
  IUpdateVendorBusinessType,
} from './dto/vendor_business_type.dto';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/vendor-business-type')
@ApiTags('Config: Vendors')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_VendorBusinessTypeController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_VendorBusinessTypeController.name,
  );
  constructor(
    private readonly configVendorBusinessTypeService: Config_VendorBusinessTypeService,
  ) {
    super();
  }

  /**
   * Retrieves a specific vendor business type classification
   * ค้นหาประเภทธุรกิจผู้ขายเดียวตาม ID (เช่น ผู้จัดหาอาหาร อุปกรณ์ทำความสะอาด)
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Vendor business type ID / รหัสประเภทธุรกิจผู้ขาย
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('vendorBusinessType.findOne'))
  @ApiVersionMinRequest()
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a vendor business type by ID', description: 'Retrieves a specific vendor business type classification (e.g., food supplier, cleaning supplies, equipment maintenance). Used to categorize vendors by their service or product specialty.', operationId: 'configVendorBusinessType_findOne', 'x-description-th': 'ดึงข้อมูลประเภทธุรกิจผู้ขายรายการเดียวตาม ID' } as any)
  async findOne(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configVendorBusinessTypeService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Lists all vendor business type classifications for the business unit
   * ค้นหาประเภทธุรกิจผู้ขายทั้งหมดที่กำหนดค่าสำหรับหน่วยธุรกิจ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('vendorBusinessType.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({ summary: 'Get all vendor business types', description: 'Returns all vendor business type classifications configured for the business unit. These types help categorize the vendor directory by industry or service specialty for procurement sourcing.', operationId: 'configVendorBusinessType_findAll', 'x-description-th': 'แสดงรายการประเภทธุรกิจผู้ขายทั้งหมดพร้อมการแบ่งหน้าและค้นหา' } as any)
  async findAll(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.configVendorBusinessTypeService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Defines a new vendor classification category
   * สร้างประเภทธุรกิจผู้ขายใหม่ (เช่น ผู้จัดหาอาหารสด ผู้จัดจำหน่ายเครื่องดื่ม)
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param createDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('vendorBusinessType.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Create a new vendor business type', description: 'Defines a new vendor classification category (e.g., fresh food supplier, beverage distributor, laundry service). Vendors can then be tagged with this type for organized sourcing and reporting.', operationId: 'configVendorBusinessType_create', 'x-description-th': 'สร้างประเภทธุรกิจผู้ขายใหม่' } as any)
  @ApiBody({ type: VendorBusinessTypeCreateRequest })
  async create(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: VendorBusinessTypeCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configVendorBusinessTypeService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Modifies an existing vendor business type classification
   * อัปเดตประเภทธุรกิจผู้ขายที่มีอยู่ เช่น เปลี่ยนชื่อหรือจัดหมวดหมู่ใหม่
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Vendor business type ID / รหัสประเภทธุรกิจผู้ขาย
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('vendorBusinessType.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Patch a vendor business type', description: 'Partially updates an existing vendor business type classification, such as renaming or reclassifying it. Changes affect how vendors tagged with this type are categorized.', operationId: 'configVendorBusinessType_patch', 'x-description-th': 'อัปเดตข้อมูลประเภทธุรกิจผู้ขายที่มีอยู่' } as any)
  @ApiBody({ type: VendorBusinessTypeUpdateRequest })
  async update(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateDto: VendorBusinessTypeUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateVendorBusinessType = {
      ...updateDto,
      id,
    };
    const result = await this.configVendorBusinessTypeService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Removes a vendor business type classification from the system
   * ลบประเภทธุรกิจผู้ขายออกจากระบบ ผู้ขายที่ติดแท็กนี้ควรจัดหมวดหมู่ใหม่ก่อนลบ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Vendor business type ID / รหัสประเภทธุรกิจผู้ขาย
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('vendorBusinessType.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({ summary: 'Delete a vendor business type', description: 'Removes a vendor business type classification from the system. Vendors currently tagged with this type should be reclassified before deletion.', operationId: 'configVendorBusinessType_delete', 'x-description-th': 'ลบประเภทธุรกิจผู้ขายตาม ID' } as any)
  async delete(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_VendorBusinessTypeController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.configVendorBusinessTypeService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
