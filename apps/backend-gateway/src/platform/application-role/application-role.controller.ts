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
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApplicationRoleService } from './application-role.service';
import {
  CreateApplicationRoleDto,
  UpdateApplicationRoleDto,
} from './dto/application-role.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiVersionMinRequest } from 'src/common/decorator/userfilter.decorator';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController, EnrichAuditUsers } from '@/common';

@Controller('api-system/role')
@ApiTags('Platform: Application Roles')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class ApplicationRoleController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationRoleController.name,
  );

  constructor(
    private readonly applicationRoleService: ApplicationRoleService,
  ) {
    super();
  }

  /**
   * List all application roles
   * ค้นหารายการบทบาทแอปพลิเคชันทั้งหมด
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param version - API version / เวอร์ชัน API
   * @returns Role list / รายการบทบาท
   */
  @Get()
  @UseGuards(new AppIdGuard('application-role.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all application roles',
    description: 'Lists all named role bundles defined in the ERP platform, such as Admin, Purchaser, HOD, or General Manager. These roles group permissions together to simplify user access management across hotel properties.',
    'x-description-th': 'แสดงรายการบทบาททั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'platformRole_findAll',
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
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Application roles retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  } as any)
  async findAll(
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        version,
      },
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.findAll(version);
    this.respond(res, result);
  }

  /**
   * Get an application role by ID
   * ค้นหาบทบาทแอปพลิเคชันเดียวตาม ID
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Role ID / รหัสบทบาท
   * @param version - API version / เวอร์ชัน API
   * @returns Role details / รายละเอียดบทบาท
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('application-role.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application role ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Get application role by ID',
    description: 'Retrieves the details of a specific application role, including its name and associated metadata. Used to inspect role configuration before assigning it to users or modifying its permissions.',
    'x-description-th': 'ดึงข้อมูลบทบาทรายการเดียวตาม ID',
    operationId: 'platformRole_findOne',
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
        description: 'Application role ID',
      },
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Application role retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application role not found',
      },
    },
  } as any)
  async findOne(
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
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.findOne(id, version);
    this.respond(res, result);
  }

  /**
   * Create a new application role
   * สร้างบทบาทแอปพลิเคชันใหม่
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param createApplicationRoleDto - Role creation data / ข้อมูลสำหรับสร้างบทบาท
   * @param version - API version / เวอร์ชัน API
   * @returns Created role / บทบาทที่ถูกสร้าง
   */
  @Post()
  @UseGuards(new AppIdGuard('application-role.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiBody({
    type: CreateApplicationRoleDto,
    description: 'Create application role data',
  })
  @ApiOperation({
    summary: 'Create new application role',
    description: 'Creates a new named role bundle in the ERP platform, such as a custom department head or property-specific role. After creation, permissions can be assigned to this role to define what actions users with this role can perform.',
    'x-description-th': 'สร้างบทบาทใหม่',
    operationId: 'platformRole_create',
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
        description: 'API version',
      },
    ],
    responses: {
      201: {
        description: 'Application role created successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  } as any)
  async create(
    @Res() res: Response,
    @Body() createApplicationRoleDto: CreateApplicationRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createApplicationRoleDto,
        version,
      },
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.create(
      createApplicationRoleDto,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing application role
   * อัปเดตบทบาทแอปพลิเคชันที่มีอยู่
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Role ID / รหัสบทบาท
   * @param updateApplicationRoleDto - Role update data / ข้อมูลสำหรับอัปเดตบทบาท
   * @param version - API version / เวอร์ชัน API
   * @returns Updated role / บทบาทที่ถูกอัปเดต
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('application-role.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application role ID',
    type: 'string',
  })
  @ApiBody({
    type: UpdateApplicationRoleDto,
    description: 'Update application role data',
  })
  @ApiOperation({
    summary: 'Update application role',
    description: 'Modifies an existing application role definition, such as renaming it or updating its metadata. This affects all users assigned to this role across the platform.',
    'x-description-th': 'อัปเดตข้อมูลบทบาทที่มีอยู่',
    operationId: 'platformRole_update',
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
        description: 'Application role ID',
      },
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Application role updated successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application role not found',
      },
    },
  } as any)
  async update(
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateApplicationRoleDto: UpdateApplicationRoleDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateApplicationRoleDto,
        version,
      },
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.update(
      id,
      updateApplicationRoleDto,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete an application role
   * ลบบทบาทแอปพลิเคชันออกจากระบบ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Role ID / รหัสบทบาท
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('application-role.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application role ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Delete application role',
    description: 'Removes an application role from the platform. Users previously assigned this role will lose the associated permissions, so ensure affected users are reassigned to appropriate roles beforehand.',
    'x-description-th': 'ลบบทบาทตาม ID',
    operationId: 'platformRole_delete',
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
        description: 'Application role ID',
      },
      {
        name: 'version',
        in: 'query',
        required: false,
        description: 'API version',
      },
    ],
    responses: {
      200: {
        description: 'Application role deleted successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application role not found',
      },
    },
  } as any)
  async delete(
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
      ApplicationRoleController.name,
    );

    const result = await this.applicationRoleService.delete(id, version);
    this.respond(res, result);
  }
}
