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
import { Platform_BusinessUnitService as Platform_BusinessUnitService } from './platform_business-unit.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  BusinessUnitCreateDto,
  BusinessUnitUpdateDto,
} from './dto/business-unit.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController, EnrichAuditUsers } from '@/common';

@Controller('api-system/business-unit')
@ApiTags('Platform: Business Units')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Platform_BusinessUnitController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_BusinessUnitController.name,
  );
  constructor(
    private readonly platform_businessUnitService: Platform_BusinessUnitService,
  ) {
    super();
  }

  /**
   * List all business units with pagination
   * ค้นหารายการหน่วยธุรกิจทั้งหมดพร้อมการแบ่งหน้า
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated business unit list / รายการหน่วยธุรกิจแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('businessUnit.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all business units',
    description: 'Lists all hotel properties and operational units within the organization, with filtering and pagination. Each business unit represents a distinct tenant (e.g., a hotel, resort, or property) that operates its own inventory and procurement workflows.',
    'x-description-th': 'แสดงรายการหน่วยธุรกิจทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'platformBusinessUnit_findAll',
    responses: {
      200: { description: 'Business units retrieved successfully' },
      401: { description: 'Unauthorized' },
    },
  } as any)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  async getBusinessUnitList(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getBusinessUnitList',
        query,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.platform_businessUnitService.getBusinessUnitList(
      user_id,
      tenant_id,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get a business unit by ID
   * ค้นหาหน่วยธุรกิจเดียวตาม ID
   * @param id - Business unit ID / รหัสหน่วยธุรกิจ
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param version - API version / เวอร์ชัน API
   * @returns Business unit details / รายละเอียดหน่วยธุรกิจ
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('businessUnit.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Business unit ID', type: 'string' })
  @ApiOperation({
    summary: 'Get a business unit by ID',
    description: 'Retrieves the full details of a specific hotel property or operational unit, including its configuration, cluster membership, and tenant settings.',
    'x-description-th': 'ดึงข้อมูลหน่วยธุรกิจรายการเดียวตาม ID',
    operationId: 'platformBusinessUnit_findOne',
    responses: {
      200: { description: 'Business unit retrieved successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'Business unit not found' },
    },
  } as any)
  @ApiVersionMinRequest()
  async getBusinessUnitById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getBusinessUnitById',
        id,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.getBusinessUnitById(
      id,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new business unit
   * สร้างหน่วยธุรกิจใหม่ในแพลตฟอร์ม
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param createBusinessUnitDto - Business unit creation data / ข้อมูลสำหรับสร้างหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Created business unit / หน่วยธุรกิจที่ถูกสร้าง
   */
  @Post()
  @UseGuards(new AppIdGuard('businessUnit.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a business unit',
    description: 'Registers a new hotel property or operational unit in the platform. This creates a new tenant context with its own isolated inventory, procurement, and recipe data, and associates it with a cluster (hotel chain or company).',
    'x-description-th': 'สร้างหน่วยธุรกิจใหม่',
    operationId: 'platformBusinessUnit_create',
    responses: {
      201: { description: 'Business unit created successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
    },
  } as any)
  @ApiBody({ type: BusinessUnitCreateDto, description: 'Business unit data' })
  @ApiVersionMinRequest()
  async createBusinessUnit(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createBusinessUnitDto: BusinessUnitCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'createBusinessUnit',
        createBusinessUnitDto,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.createBusinessUnit(
      createBusinessUnitDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing business unit
   * อัปเดตข้อมูลหน่วยธุรกิจที่มีอยู่
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Business unit ID / รหัสหน่วยธุรกิจ
   * @param updateBusinessUnitDto - Business unit update data / ข้อมูลสำหรับอัปเดตหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Updated business unit / หน่วยธุรกิจที่ถูกอัปเดต
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('businessUnit.update'))
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Business unit ID', type: 'string' })
  @ApiOperation({
    summary: 'Update a business unit',
    description: 'Modifies the configuration or details of an existing hotel property or operational unit, such as its name, address, or cluster association.',
    'x-description-th': 'อัปเดตข้อมูลหน่วยธุรกิจที่มีอยู่',
    operationId: 'platformBusinessUnit_update',
    responses: {
      200: { description: 'Business unit updated successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
      404: { description: 'Business unit not found' },
    },
  } as any)
  @ApiBody({ type: BusinessUnitUpdateDto, description: 'Business unit update data' })
  @ApiVersionMinRequest()
  async updateBusinessUnit(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateBusinessUnitDto: BusinessUnitUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updateBusinessUnit',
        id,
        updateBusinessUnitDto,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    updateBusinessUnitDto.id = id;
    const result = await this.platform_businessUnitService.updateBusinessUnit(
      updateBusinessUnitDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a business unit
   * ลบหน่วยธุรกิจออกจากแพลตฟอร์ม
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Business unit ID / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('businessUnit.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Business unit ID', type: 'string' })
  @ApiOperation({
    summary: 'Delete a business unit',
    description: 'Soft-deletes a hotel property or operational unit from the platform. The business unit and its associated tenant data are retained for audit purposes but become inactive, preventing further operations.',
    'x-description-th': 'ลบหน่วยธุรกิจตาม ID',
    operationId: 'platformBusinessUnit_delete',
    responses: {
      200: { description: 'Business unit deleted successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'Business unit not found' },
    },
  } as any)
  @ApiVersionMinRequest()
  async deleteBusinessUnit(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deleteBusinessUnit',
        id,
        version,
      },
      Platform_BusinessUnitController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_businessUnitService.deleteBusinessUnit(
      id,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

}
