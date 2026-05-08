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
import { Config_UnitsService } from './config_units.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UnitCreateRequestDto, UnitUpdateRequestDto } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  UnitsCreateDto,
  UnitsUpdateDto,
  IUpdateUnits,
  Serialize,
  EnrichAuditUsers,
  UnitDetailResponseSchema,
  UnitListItemResponseSchema,
  UnitMutationResponseSchema,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/units')
@ApiTags('Config: Units')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_UnitsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_UnitsController.name,
  );

  constructor(private readonly config_unitsService: Config_UnitsService) {
    super();
  }

  /**
   * Get a unit of measurement by ID
   * ค้นหาหน่วยวัดเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Unit ID / รหัสหน่วยวัด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Unit detail / รายละเอียดหน่วยวัด
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('unit.findOne'))
  @Serialize(UnitDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a unit by ID',
    description: 'Retrieves a specific unit of measurement definition (e.g., kg, litre, piece, case) used for product ordering, inventory counting, and recipe ingredient quantities.',
    operationId: 'configUnits_findOne',
    responses: { 200: { description: 'Unit retrieved successfully' } },
    'x-description-th': 'ดึงข้อมูลหน่วยนับรายการเดียวตาม ID',
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
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_unitsService.findOne(id, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Get all units of measurement with pagination
   * ค้นหารายการหน่วยวัดทั้งหมดพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of units / รายการหน่วยวัดพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('unit.findAll'))
  @Serialize(UnitListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all units',
    description: 'Returns all configured units of measurement available in the system. These units are referenced by products, recipes, and procurement documents to ensure consistent quantity tracking.',
    operationId: 'configUnits_findAll',
    responses: { 200: { description: 'Units retrieved successfully' } },
    'x-description-th': 'แสดงรายการหน่วยนับทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
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
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_unitsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new unit of measurement
   * สร้างหน่วยวัดใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Unit creation data / ข้อมูลสำหรับสร้างหน่วยวัด
   * @param version - API version / เวอร์ชัน API
   * @returns Created unit / หน่วยวัดที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('unit.create'))
  @Serialize(UnitMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new unit',
    description: 'Defines a new unit of measurement (e.g., kg, litre, dozen, case) in the system. The unit becomes available for assignment to products, recipe ingredients, and procurement documents.',
    operationId: 'configUnits_create',
    responses: { 201: { description: 'Unit created successfully' } },
    'x-description-th': 'สร้างหน่วยนับใหม่',
  } as any)
  @ApiBody({ type: UnitCreateRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: UnitsCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_unitsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a unit of measurement
   * อัปเดตหน่วยวัด
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Unit ID / รหัสหน่วยวัด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Unit update data / ข้อมูลสำหรับอัปเดตหน่วยวัด
   * @param version - API version / เวอร์ชัน API
   * @returns Updated unit / หน่วยวัดที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('unit.update'))
  @Serialize(UnitMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a unit',
    description: 'Modifies an existing unit of measurement definition, such as updating its name or conversion factors. Changes affect how quantities are displayed across procurement and inventory modules.',
    operationId: 'configUnits_update',
    responses: { 200: { description: 'Unit updated successfully' } },
    'x-description-th': 'อัปเดตข้อมูลหน่วยนับที่มีอยู่',
  } as any)
  @ApiBody({ type: UnitUpdateRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: UnitsUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateUnits = {
      ...updateDto,
      id,
    };
    const result = await this.config_unitsService.update(data, user_id, bu_code, version);
    this.respond(res, result);
  }

  /**
   * Delete a unit of measurement
   * ลบหน่วยวัด
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Unit ID / รหัสหน่วยวัด
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('unit.delete'))
  @Serialize(UnitMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a unit',
    description: 'Removes a unit of measurement from the system. The unit will no longer be available for new product or procurement configurations, but existing references in historical data are preserved.',
    operationId: 'configUnits_delete',
    responses: { 200: { description: 'Unit deleted successfully' } },
    'x-description-th': 'ลบหน่วยนับตาม ID',
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
      Config_UnitsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_unitsService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
