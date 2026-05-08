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
import { Platform_UserBusinessUnitService } from './platform_user-business-unit.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  IUserBusinessUnitUpdate,
  UserBusinessUnitDto,
  UserBusinessUnitUpdateDto,
} from './dto/platform_user-business-unit.dto';
import { ApiVersionMinRequest, ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';

import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController, EnrichAuditUsers } from '@/common';

@Controller('api-system/user/business-unit')
@ApiTags('Platform: User ↔ Business Unit')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Platform_UserBusinessUnitController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_UserBusinessUnitController.name,
  );

  constructor(
    private readonly platform_userBusinessUnitService: Platform_UserBusinessUnitService,
  ) {
    super();
  }

  /**
   * Get a user-business unit mapping by ID
   * ค้นหาการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจเดียวตาม ID
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Mapping ID / รหัสการเชื่อมโยง
   * @param version - API version / เวอร์ชัน API
   * @returns User-business unit mapping details / รายละเอียดการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจ
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('userBusinessUnit.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'User-Business Unit mapping ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Get user-business unit mapping by ID',
    description:
      'Retrieves the details of a specific user-to-property access assignment, showing which user has access to which hotel property and with what role.',
    'x-description-th': 'ดึงข้อมูลหน่วยธุรกิจของผู้ใช้รายการเดียวตาม ID',
    operationId: 'platformUserBusinessUnit_findOne',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'User-business unit mapping retrieved successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'Mapping not found' },
    },
  } as any)
  async findOne(
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
      Platform_UserBusinessUnitController.name,
    );
    const { user_id, tenant_id: _tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_userBusinessUnitService.findOne(
      id,
      user_id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List all user-business unit mappings with pagination
   * ค้นหารายการการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจทั้งหมดพร้อมการแบ่งหน้า
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated mapping list / รายการการเชื่อมโยงแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('userBusinessUnit.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all user-business unit mappings',
    description:
      'Lists all user-to-property access assignments across the platform, showing which users have been granted access to which hotel properties. Used for multi-tenant access management and auditing.',
    'x-description-th': 'แสดงรายการหน่วยธุรกิจของผู้ใช้ทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'platformUserBusinessUnit_findAll',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'User-business unit mappings retrieved successfully',
      },
      401: { description: 'Unauthorized' },
    },
  } as any)
  async findAll(
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
      Platform_UserBusinessUnitController.name,
    );
    const { user_id, tenant_id: _tenant_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.platform_userBusinessUnitService.findAll(
      user_id,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a user-business unit mapping
   * สร้างการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจ
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param body - Mapping creation data / ข้อมูลสำหรับสร้างการเชื่อมโยง
   * @param version - API version / เวอร์ชัน API
   * @returns Created mapping / การเชื่อมโยงที่ถูกสร้าง
   */
  @Post()
  @UseGuards(new AppIdGuard('userBusinessUnit.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiBody({
    type: UserBusinessUnitDto,
    description: 'Create user-business unit mapping data',
  })
  @ApiOperation({
    summary: 'Create a user-business unit mapping',
    description:
      "Grants a user access to a specific hotel property or operational unit, enabling them to perform procurement, inventory, and other ERP operations within that business unit's tenant context.",
    'x-description-th': 'สร้างหน่วยธุรกิจของผู้ใช้ใหม่',
    operationId: 'platformUserBusinessUnit_create',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      201: { description: 'User-business unit mapping created successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
    },
  } as any)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: UserBusinessUnitDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        body,
        version,
      },
      Platform_UserBusinessUnitController.name,
    );
    const { user_id, tenant_id: _tenant_id } = ExtractRequestHeader(req);
    const result = await this.platform_userBusinessUnitService.create(
      body,
      user_id,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update a user-business unit mapping
   * อัปเดตการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจ
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Mapping ID / รหัสการเชื่อมโยง
   * @param body - Mapping update data / ข้อมูลสำหรับอัปเดตการเชื่อมโยง
   * @param version - API version / เวอร์ชัน API
   * @returns Updated mapping / การเชื่อมโยงที่ถูกอัปเดต
   */
  @Patch(':id')
  @UseGuards(new AppIdGuard('userBusinessUnit.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'User-Business Unit mapping ID',
    type: 'string',
  })
  @ApiBody({
    type: UserBusinessUnitUpdateDto,
    description: 'Update user-business unit mapping data',
  })
  @ApiOperation({
    summary: 'Update a user-business unit mapping',
    description:
      "Modifies an existing user-to-property access assignment, such as changing the user's role or permissions within a specific hotel property.",
    'x-description-th': 'อัปเดตข้อมูลหน่วยธุรกิจของผู้ใช้ที่มีอยู่',
    operationId: 'platformUserBusinessUnit_update',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'User-business unit mapping updated successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
      404: { description: 'Mapping not found' },
    },
  } as any)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UserBusinessUnitUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        body,
        version,
      },
      Platform_UserBusinessUnitController.name,
    );
    const { user_id, tenant_id: _tenant_id } = ExtractRequestHeader(req);
    const data: IUserBusinessUnitUpdate = {
      ...body,
      id,
    };
    const result = await this.platform_userBusinessUnitService.update(
      data,
      user_id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a user-business unit mapping
   * ลบการเชื่อมโยงผู้ใช้กับหน่วยธุรกิจ
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - Mapping ID / รหัสการเชื่อมโยง
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('userBusinessUnit.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({
    name: 'id',
    description: 'User-Business Unit mapping ID',
    type: 'string',
  })
  @ApiOperation({
    summary: 'Delete a user-business unit mapping',
    description:
      "Revokes a user's access to a specific hotel property or operational unit. The user will no longer be able to perform any ERP operations within that business unit's tenant context.",
    'x-description-th': 'ลบหน่วยธุรกิจของผู้ใช้ตาม ID',
    operationId: 'platformUserBusinessUnit_delete',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'User-business unit mapping deleted successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'Mapping not found' },
    },
  } as any)
  async delete(
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
      Platform_UserBusinessUnitController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.platform_userBusinessUnitService.delete(
      id,
      user_id,
      version,
    );
    this.respond(res, result);
  }
}
