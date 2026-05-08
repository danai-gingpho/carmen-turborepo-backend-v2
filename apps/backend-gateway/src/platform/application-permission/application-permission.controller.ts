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
import { ApplicationPermissionService } from './application-permission.service';
import {
  CreateApplicationPermissionDto,
  UpdateApplicationPermissionDto,
} from './dto/application-permission.dto';
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

@Controller('api-system/permission')
@ApiTags('Platform: Application Permissions')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class ApplicationPermissionController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ApplicationPermissionController.name,
  );

  constructor(
    private readonly applicationPermissionService: ApplicationPermissionService,
  ) {
    super();
  }

  /**
   * List all application permissions
   * ค้นหารายการสิทธิ์การเข้าถึงทั้งหมด
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param version - API version / เวอร์ชัน API
   * @returns Permission list / รายการสิทธิ์การเข้าถึง
   */
  @Get()
  @UseGuards(new AppIdGuard('application-permission.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get all application permissions',
    description: 'Lists all granular feature permissions available in the ERP system, such as "can create purchase request" or "can approve purchase order". Used by platform administrators to review and manage the full permission catalog.',
    'x-description-th': 'แสดงรายการสิทธิ์การใช้งานทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'platformPermission_findAll',
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
        description: 'Application permissions retrieved successfully',
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
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.findAll(version);
    this.respond(res, result);
  }

  /**
   * Get an application permission by ID
   * ค้นหาสิทธิ์การเข้าถึงเดียวตาม ID
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Permission ID / รหัสสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Permission details / รายละเอียดสิทธิ์การเข้าถึง
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('application-permission.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application permission ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Get application permission by ID',
    description: 'Retrieves the details of a specific feature permission by its ID, including its name, code, and scope. Useful for inspecting individual permission definitions before assigning them to roles.',
    'x-description-th': 'ดึงข้อมูลสิทธิ์การใช้งานรายการเดียวตาม ID',
    operationId: 'platformPermission_findOne',
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
        description: 'Application permission ID',
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
        description: 'Application permission retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application permission not found',
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
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.findOne(id, version);
    this.respond(res, result);
  }

  /**
   * Create a new application permission
   * สร้างสิทธิ์การเข้าถึงใหม่
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param createApplicationPermissionDto - Permission creation data / ข้อมูลสำหรับสร้างสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Created permission / สิทธิ์การเข้าถึงที่ถูกสร้าง
   */
  @Post()
  @UseGuards(new AppIdGuard('application-permission.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiBody({
    type: CreateApplicationPermissionDto,
    description: 'Create application permission data',
  })
  @ApiOperation({
    summary: 'Create new application permission',
    description: 'Defines a new granular feature permission in the ERP platform, such as access to create, approve, or view specific procurement or inventory operations. Once created, this permission can be assigned to application roles.',
    'x-description-th': 'สร้างสิทธิ์การใช้งานใหม่',
    operationId: 'platformPermission_create',
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
        description: 'Application permission created successfully',
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
    @Body() createApplicationPermissionDto: CreateApplicationPermissionDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createApplicationPermissionDto,
        version,
      },
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.create(
      createApplicationPermissionDto,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing application permission
   * อัปเดตสิทธิ์การเข้าถึงที่มีอยู่
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Permission ID / รหัสสิทธิ์การเข้าถึง
   * @param updateApplicationPermissionDto - Permission update data / ข้อมูลสำหรับอัปเดตสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Updated permission / สิทธิ์การเข้าถึงที่ถูกอัปเดต
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('application-permission.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application permission ID',
    type: 'string',
  })
  @ApiBody({
    type: UpdateApplicationPermissionDto,
    description: 'Update application permission data',
  })
  @ApiOperation({
    summary: 'Update application permission',
    description: 'Modifies an existing feature permission definition, such as renaming it or changing its scope. Changes propagate to all roles that reference this permission across tenants.',
    'x-description-th': 'อัปเดตข้อมูลสิทธิ์การใช้งานที่มีอยู่',
    operationId: 'platformPermission_update',
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
        description: 'Application permission ID',
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
        description: 'Application permission updated successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application permission not found',
      },
    },
  } as any)
  async update(
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateApplicationPermissionDto: UpdateApplicationPermissionDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateApplicationPermissionDto,
        version,
      },
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.update(
      id,
      updateApplicationPermissionDto,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete an application permission
   * ลบสิทธิ์การเข้าถึงออกจากระบบ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Permission ID / รหัสสิทธิ์การเข้าถึง
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('application-permission.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'Application permission ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Delete application permission',
    description: 'Removes a feature permission from the ERP platform. This should be done with caution as it will affect all roles that currently include this permission, potentially revoking user access to the associated feature.',
    'x-description-th': 'ลบสิทธิ์การใช้งานตาม ID',
    operationId: 'platformPermission_delete',
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
        description: 'Application permission ID',
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
        description: 'Application permission deleted successfully',
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Application permission not found',
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
      ApplicationPermissionController.name,
    );

    const result = await this.applicationPermissionService.delete(id, version);
    this.respond(res, result);
  }
}
