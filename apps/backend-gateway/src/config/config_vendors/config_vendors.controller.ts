import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { Config_VendorsService } from './config_vendors.service';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { VendorCreateRequestDto, VendorUpdateRequestDto } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  IUpdateVendor,
  VendorCreateDto,
  VendorUpdateDto,
  Serialize,
  VendorDetailResponseSchema,
  VendorListItemResponseSchema,
  VendorMutationResponseSchema,
  BaseHttpController,
  EnrichAuditUsers,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/vendors')
@ApiTags('Config: Vendors')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_VendorsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_VendorsController.name,
  );

  constructor(private readonly config_vendorsService: Config_VendorsService) {
    super();
  }

  /**
   * Get a vendor by ID
   * ค้นหาผู้ขายเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Vendor ID / รหัสผู้ขาย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Vendor detail / รายละเอียดผู้ขาย
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('vendor.findOne'))
  @Serialize(VendorDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a vendor by ID',
    description: 'Retrieves complete vendor/supplier master data including company details, contact information, and payment terms. Used to view a specific supplier profile for procurement operations.',
    operationId: 'configVendors_findOne',
    responses: { 200: { description: 'Vendor retrieved successfully' } },
    'x-description-th': 'ดึงข้อมูลผู้ขายรายการเดียวตาม ID',
  } as any)
  async findOne(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_vendorsService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Get all vendors with pagination
   * ค้นหารายการผู้ขายทั้งหมดพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of vendors / รายการผู้ขายพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('vendor.findAll'))
  @Serialize(VendorListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all vendors',
    description: 'Returns a paginated list of all registered vendors/suppliers. Used by procurement staff and administrators to browse the approved vendor directory for sourcing and purchase order creation.',
    operationId: 'configVendors_findAll',
    responses: { 200: { description: 'Vendors retrieved successfully' } },
    'x-description-th': 'แสดงรายการผู้ขายทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_vendorsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new vendor
   * สร้างผู้ขายใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Vendor creation data / ข้อมูลสำหรับสร้างผู้ขาย
   * @param version - API version / เวอร์ชัน API
   * @returns Created vendor / ผู้ขายที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('vendor.create'))
  @Serialize(VendorMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new vendor',
    description: 'Registers a new vendor/supplier in the system with their company details, contact information, and payment terms. Once created, the vendor becomes available for selection in purchase orders and price lists.',
    operationId: 'configVendors_create',
    responses: { 201: { description: 'Vendor created successfully' } },
    'x-description-th': 'สร้างผู้ขายใหม่',
  } as any)
  @ApiBody({ type: VendorCreateRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: VendorCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_vendorsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a vendor
   * อัปเดตผู้ขาย
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Vendor ID / รหัสผู้ขาย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Vendor update data / ข้อมูลสำหรับอัปเดตผู้ขาย
   * @param version - API version / เวอร์ชัน API
   * @returns Updated vendor / ผู้ขายที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('vendor.update'))
  @Serialize(VendorMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a vendor',
    description: 'Updates an existing vendor/supplier record, such as modifying contact details, payment terms, or business classification. Changes apply to all future procurement transactions with this vendor.',
    operationId: 'configVendors_update',
    responses: { 200: { description: 'Vendor updated successfully' } },
    'x-description-th': 'อัปเดตข้อมูลผู้ขายที่มีอยู่',
  } as any)
  @ApiBody({ type: VendorUpdateRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: VendorUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateVendor = {
      ...updateDto,
      id,
    };
    const result = await this.config_vendorsService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a vendor
   * ลบผู้ขาย
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Vendor ID / รหัสผู้ขาย
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('vendor.delete'))
  @Serialize(VendorMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a vendor',
    description: 'Removes a vendor/supplier from the active directory. The vendor will no longer be available for new purchase orders, but historical procurement records are preserved.',
    operationId: 'configVendors_delete',
    responses: { 200: { description: 'Vendor deleted successfully' } },
    'x-description-th': 'ลบผู้ขายตาม ID',
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
        version,
      },
      Config_VendorsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_vendorsService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
