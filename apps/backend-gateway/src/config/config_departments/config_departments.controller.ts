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
import { Config_DepartmentsService } from './config_departments.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  DepartmentsCreateDto,
  DepartmentsUpdateDto,
  EnrichAuditUsers,
  IUpdateDepartments,
  Serialize,
  DepartmentDetailResponseSchema,
  DepartmentListItemResponseSchema,
  DepartmentMutationResponseSchema,
} from '@/common';
import {
  ApiVersionMinRequest,
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { DepartmentCreateRequestDto, DepartmentUpdateRequestDto } from './swagger/request';

@Controller('api/config/:bu_code/departments')
@ApiTags('Config: Departments')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_DepartmentsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_DepartmentsController.name,
  );

  constructor(
    private readonly config_departmentsService: Config_DepartmentsService,
  ) {
    super();
  }

  /**
   * Get a department by ID
   * ค้นหาแผนกเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Department ID / รหัสแผนก
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Department detail / รายละเอียดแผนก
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('department.findOne'))
  @Serialize(DepartmentDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a department by ID',
    description: 'Retrieves a specific hotel department record (e.g., Kitchen, F&B, Housekeeping, Engineering). Department details include cost center information used for budget allocation and purchase request routing.',
    operationId: 'configDepartments_findOne',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Department retrieved successfully',
      },
    },
    'x-description-th': 'ดึงข้อมูลแผนกรายการเดียวตาม ID',
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
      Config_DepartmentsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_departmentsService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get all departments with pagination
   * ค้นหารายการแผนกทั้งหมดพร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of departments / รายการแผนกพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('department.findAll'))
  @Serialize(DepartmentListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all departments',
    description: 'Returns all hotel departments configured in the business unit. Departments are used to organize purchase requests, assign users, and track costs by operational area.',
    operationId: 'configDepartments_findAll',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'Departments retrieved successfully',
      },
    },
    'x-description-th': 'แสดงรายการแผนกทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
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
      Config_DepartmentsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_departmentsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new department
   * สร้างแผนกใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Department creation data / ข้อมูลสำหรับสร้างแผนก
   * @param version - API version / เวอร์ชัน API
   * @returns Created department / แผนกที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('department.create'))
  @Serialize(DepartmentMutationResponseSchema)
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new department',
    description: 'Creates a new hotel department (e.g., Kitchen, Housekeeping, Spa). The department can then be assigned users and used as a cost center for procurement and inventory requisitions.',
    operationId: 'configDepartments_create',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      201: {
        description: 'Department created successfully',
      },
    },
    'x-description-th': 'สร้างแผนกใหม่',
  } as any)
  @ApiBody({ type: DepartmentCreateRequestDto })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: DepartmentsCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_DepartmentsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_departmentsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a department
   * อัปเดตแผนก
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Department ID / รหัสแผนก
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Department update data / ข้อมูลสำหรับอัปเดตแผนก
   * @param version - API version / เวอร์ชัน API
   * @returns Updated department / แผนกที่อัปเดตแล้ว
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('department.update'))
  @Serialize(DepartmentMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a department',
    description: 'Modifies an existing department configuration, such as its name or cost center settings. Changes affect how future purchase requests and inventory transactions are categorized.',
    operationId: 'configDepartments_update',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Department updated successfully',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลแผนกที่มีอยู่',
  } as any)
  @ApiBody({ type: DepartmentUpdateRequestDto })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: DepartmentsUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_DepartmentsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateDepartments = {
      ...updateDto,
      id,
    };
    const result = await this.config_departmentsService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a department
   * ลบแผนก
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Department ID / รหัสแผนก
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('department.delete'))
  @Serialize(DepartmentMutationResponseSchema)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a department',
    description: 'Removes a department from the active configuration. The department will no longer be available for new requisitions or user assignments, but historical records are retained.',
    operationId: 'configDepartments_delete',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
      },
    ],
    responses: {
      200: {
        description: 'Department deleted successfully',
      },
    },
    'x-description-th': 'ลบแผนกตาม ID',
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
      Config_DepartmentsController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_departmentsService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
