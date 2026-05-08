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
import { Config_DepartmentUserService } from './config_department-user.service';
import {
  BaseHttpController,
  EnrichAuditUsers,
} from '@/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiVersionMinRequest,
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { DepartmentUserCreateRequest, DepartmentUserUpdateRequest } from './swagger/request';
import { DepartmentUserByUserResponseDto } from './swagger/response';


@Controller('api/config/:bu_code/department-user')
@ApiTags('Config: Departments')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_DepartmentUserController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_DepartmentUserController.name,
  );

  constructor(
    private readonly config_departmentUserService: Config_DepartmentUserService,
  ) {
    super();
  }

  /**
   * Find a user's member department and HOD departments by user_id
   * ค้นหาแผนกที่ user เป็นสมาชิก และแผนกที่ user เป็น HOD ตาม user_id
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param target_user_id - Target user ID to look up / รหัสผู้ใช้ที่ต้องการค้นหา
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Member department + HOD departments / แผนกสมาชิก + รายการแผนก HOD
   */
  @Get('user/:user_id')
  @UseGuards(new AppIdGuard('departmentUser.findByUser'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: "Get a user's department and HOD assignments",
    description:
      'Returns the single department where the user is a member (is_hod=false, may be null) and the list of departments where the user is HOD (is_hod=true, may be empty).',
    operationId: 'configDepartmentUser_findByUser',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    parameters: [
      { name: 'user_id', in: 'path', required: true },
    ],
    responses: {
      200: { description: 'User department assignments retrieved successfully' },
    },
    'x-description-th': 'ดึงข้อมูลแผนกสมาชิก และรายการแผนกที่ user เป็น HOD ตาม user_id',
  } as any)
  @ApiOkResponse({ type: DepartmentUserByUserResponseDto })
  async findByUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('user_id', new ParseUUIDPipe({ version: '4' })) target_user_id: string,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findByUser', target_user_id, version },
      Config_DepartmentUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_departmentUserService.findByUserId(
      target_user_id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Retrieve a department-user assignment by ID
   * ค้นหารายการเดียวตาม ID ของการกำหนดแผนก-ผู้ใช้
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Department-user assignment ID / รหัสการกำหนดแผนก-ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Department-user assignment detail / รายละเอียดการกำหนดแผนก-ผู้ใช้
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('departmentUser.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a department-user assignment by ID',
    description: 'Retrieves a specific department-user assignment record, showing which users are assigned to a particular hotel department for requisition and approval permissions.',
    operationId: 'configDepartmentUser_findOne',
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
        description: 'Department-user assignment retrieved successfully',
      },
    },
    'x-description-th': 'ดึงข้อมูลผู้ใช้ประจำแผนกรายการเดียวตาม ID',
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
      Config_DepartmentUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_departmentUserService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all department-user assignments with pagination
   * ค้นหารายการทั้งหมดของการกำหนดแผนก-ผู้ใช้พร้อมการแบ่งหน้า
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of department-user assignments / รายการการกำหนดแผนก-ผู้ใช้แบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('departmentUser.findAll'))
  // TODO: when findAll is implemented, add @Serialize(DepartmentUserListItemResponseSchema) and confirm default root-only paths match the wrapper shape.
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all department-user assignments',
    description: 'Returns all department-user assignments for the business unit. Used by administrators to manage which staff members belong to each hotel department for requisition routing.',
    operationId: 'configDepartmentUser_findAll',
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
        description: 'Department-user assignments retrieved successfully',
      },
    },
    'x-description-th': 'แสดงรายการผู้ใช้ประจำแผนกทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
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
      Config_DepartmentUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_departmentUserService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new department-user assignment
   * สร้างการกำหนดแผนก-ผู้ใช้ใหม่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createDto - Department-user assignment creation data / ข้อมูลสำหรับสร้างการกำหนดแผนก-ผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Created department-user assignment / การกำหนดแผนก-ผู้ใช้ที่สร้างแล้ว
   */
  @Post()
  @UseGuards(new AppIdGuard('departmentUser.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Create a new department-user assignment',
    description: 'Creates a new department-user assignment, linking a user to a hotel department. This determines which department the user can create requisitions for and participate in approval workflows.',
    operationId: 'configDepartmentUser_create',
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
        description: 'Department-user assignment created successfully',
      },
    },
    'x-description-th': 'สร้างผู้ใช้ประจำแผนกใหม่',
  } as any)
  @ApiBody({ type: DepartmentUserCreateRequest })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createDto: Record<string, unknown>,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_DepartmentUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_departmentUserService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing department-user assignment
   * อัปเดตการกำหนดแผนก-ผู้ใช้ที่มีอยู่
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Department-user assignment ID / รหัสการกำหนดแผนก-ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateDto - Department-user assignment update data / ข้อมูลสำหรับอัปเดตการกำหนดแผนก-ผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Updated department-user assignment / การกำหนดแผนก-ผู้ใช้ที่อัปเดตแล้ว
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('departmentUser.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update a department-user assignment',
    description: 'Modifies an existing department-user assignment, such as changing the user role within the department or updating assignment details.',
    operationId: 'configDepartmentUser_update',
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
        description: 'Department-user assignment updated successfully',
      },
    },
    'x-description-th': 'อัปเดตข้อมูลผู้ใช้ประจำแผนกที่มีอยู่',
  } as any)
  @ApiBody({ type: DepartmentUserUpdateRequest })
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Body() updateDto: Record<string, unknown>,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_DepartmentUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_departmentUserService.update(
      id,
      updateDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a department-user assignment by ID
   * ลบการกำหนดแผนก-ผู้ใช้ตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Department-user assignment ID / รหัสการกำหนดแผนก-ผู้ใช้
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('departmentUser.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Delete a department-user assignment',
    description: 'Removes a department-user assignment, unlinking a user from a hotel department. The user will no longer be able to create requisitions for or approve documents in that department.',
    operationId: 'configDepartmentUser_delete',
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
        description: 'Department-user assignment deleted successfully',
      },
    },
    'x-description-th': 'ลบผู้ใช้ประจำแผนกตาม ID',
  } as any)
  async remove(
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
      Config_DepartmentUserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_departmentUserService.delete(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
