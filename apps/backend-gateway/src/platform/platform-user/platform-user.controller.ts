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
import { PlatformUserService } from './platform-user.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreatePlatformUserRequestDto,
  UpdatePlatformUserRequestDto,
} from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController } from '@/common';

@Controller('api-system')
@ApiTags('Platform: Users')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class PlatformUserController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    PlatformUserController.name,
  );

  constructor(
    private readonly platformUserService: PlatformUserService,
  ) {
    super();
  }

  /**
   * Sync users from Keycloak into the platform
   * ซิงค์ข้อมูลผู้ใช้จาก Keycloak เข้าสู่ระบบแพลตฟอร์ม
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param version - API version / เวอร์ชัน API
   * @returns Sync result / ผลลัพธ์การซิงค์
   */
  @Post('fetch-user')
  @UseGuards(new AppIdGuard('platform-user.fetch'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Fetch users from Keycloak realm',
    description: 'Synchronizes user accounts from the Keycloak identity provider into the Carmen platform database. This ensures that all hotel staff and administrators provisioned in Keycloak are available for assignment to clusters, business units, and roles within the ERP system.',
    'x-description-th': 'ซิงค์ข้อมูลผู้ใช้จาก Keycloak เข้าสู่ระบบแพลตฟอร์ม',
    operationId: 'platformUser_fetchFromKeycloak',
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
        description: 'Users fetched and synced successfully',
      },
      400: {
        description: 'Bad request',
      },
      401: {
        description: 'Unauthorized',
      },
      500: {
        description: 'Internal server error',
      },
    },
  } as any)
  async fetchUsers(
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'fetchUsers',
        version,
      },
      PlatformUserController.name,
    );

    const result = await this.platformUserService.fetchUsers(version);
    this.respond(res, result);
  }

  /**
   * List all platform users with pagination
   * ค้นหารายการผู้ใช้ระบบทั้งหมดพร้อมการแบ่งหน้า
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated user list / รายการผู้ใช้แบบแบ่งหน้า
   */
  @Get('user')
  @UseGuards(new AppIdGuard('platform-user.list'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get list of platform users',
    description: 'Lists all system-wide user accounts across all tenants with pagination support. Used by platform administrators to manage hotel staff, procurement officers, and other ERP users across the entire organization.',
    'x-description-th': 'แสดงรายการผู้ใช้ทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'platformUser_findAll',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Users retrieved successfully' },
      401: { description: 'Unauthorized' },
    },
  } as any)
  async getUserList(
    @Req() req: Request,
    @Res() res: Response,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getUserList',
        query,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.platformUserService.getUserList(
      user_id,
      tenant_id,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get a platform user by ID
   * ค้นหารายการผู้ใช้ระบบเดียวตาม ID
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns User details / รายละเอียดผู้ใช้
   */
  @Get('user/:id')
  @UseGuards(new AppIdGuard('platform-user.get'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiOperation({
    summary: 'Get platform user by ID',
    description: 'Retrieves detailed information about a specific platform user, including their profile, role assignments, and associated business units. Used to review or audit individual user access across the ERP system.',
    'x-description-th': 'ดึงข้อมูลผู้ใช้รายการเดียวตาม ID',
    operationId: 'platformUser_findOne',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'User retrieved successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'User not found' },
    },
  } as any)
  async getUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getUser',
        id,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.getUser(
      user_id,
      tenant_id,
      id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new platform user
   * สร้างผู้ใช้ระบบใหม่ในแพลตฟอร์ม
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param data - User creation data / ข้อมูลสำหรับสร้างผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Created user / ผู้ใช้ที่ถูกสร้าง
   */
  @Post('user')
  @UseGuards(new AppIdGuard('platform-user.create'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiBody({ type: CreatePlatformUserRequestDto, description: 'Create platform user data' })
  @ApiOperation({
    summary: 'Create a new platform user',
    description: 'Provisions a new system-wide user account in the Carmen ERP platform. The user can subsequently be assigned to clusters and business units to grant them access to specific hotel properties and procurement workflows.',
    'x-description-th': 'สร้างผู้ใช้ใหม่',
    operationId: 'platformUser_create',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'User created successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
    },
  } as any)
  async createUser(
    @Req() req: Request,
    @Res() res: Response,
    @Body() data: Record<string, unknown>,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'createUser',
        data,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.createUser(
      user_id,
      tenant_id,
      data,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Update an existing platform user
   * อัปเดตข้อมูลผู้ใช้ระบบที่มีอยู่
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - User ID / รหัสผู้ใช้
   * @param data - User update data / ข้อมูลสำหรับอัปเดตผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Updated user / ผู้ใช้ที่ถูกอัปเดต
   */
  @Put('user/:id')
  @UseGuards(new AppIdGuard('platform-user.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiBody({ type: UpdatePlatformUserRequestDto, description: 'Update platform user data' })
  @ApiOperation({
    summary: 'Update a platform user',
    description: 'Updates the profile or account details of an existing platform user, such as name, contact information, or status. Used by administrators to maintain accurate user records across the hotel management system.',
    'x-description-th': 'อัปเดตข้อมูลผู้ใช้ที่มีอยู่',
    operationId: 'platformUser_update',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'User updated successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
      404: { description: 'User not found' },
    },
  } as any)
  async updateUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: Record<string, unknown>,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updateUser',
        id,
        data,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.updateUser(
      user_id,
      tenant_id,
      id,
      data,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Reset a platform user's password (admin)
   * รีเซ็ตรหัสผ่านผู้ใช้โดยผู้ดูแลระบบ
   */
  @Put('user/:id/reset-password')
  @UseGuards(new AppIdGuard('platform-user.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiOperation({
    summary: 'Reset platform user password',
    description: 'Admin-only password reset for a platform user via Keycloak. Body: { newPassword: string, temporary?: boolean }.',
    'x-description-th': 'รีเซ็ตรหัสผ่านผู้ใช้โดยผู้ดูแลระบบผ่าน Keycloak',
    operationId: 'platformUser_resetPassword',
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'Password reset successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
      404: { description: 'User not found' },
    },
  } as any)
  async resetUserPassword(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: { newPassword: string; temporary?: boolean },
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'resetUserPassword', id, version },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.resetUserPassword(
      user_id,
      tenant_id,
      id,
      data?.newPassword,
      data?.temporary ?? false,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a platform user
   * ลบผู้ใช้ระบบออกจากแพลตฟอร์ม
   * @param req - Request object / ออบเจกต์คำขอ
   * @param res - Response object / ออบเจกต์การตอบกลับ
   * @param id - User ID / รหัสผู้ใช้
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete('user/:id')
  @UseGuards(new AppIdGuard('platform-user.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiOperation({
    summary: 'Delete a platform user',
    description: 'Deactivates or removes a user account from the Carmen platform. This revokes the user\'s access to all business units and clusters, effectively removing them from all hotel properties and procurement workflows.',
    'x-description-th': 'ลบผู้ใช้ตาม ID',
    operationId: 'platformUser_delete',
    deprecated: false,
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'User deleted successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'User not found' },
    },
  } as any)
  async deleteUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deleteUser',
        id,
        version,
      },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.deleteUser(
      user_id,
      tenant_id,
      id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Hard delete a platform user (permanently removes from DB and Keycloak)
   * ลบผู้ใช้แบบถาวร (ลบออกจากฐานข้อมูลและ Keycloak)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Target user ID / รหัสผู้ใช้เป้าหมาย
   * @param version - API version / เวอร์ชัน API
   * @returns Deletion result / ผลลัพธ์การลบ
   */
  @Delete('user/:id/hard')
  @UseGuards(new AppIdGuard('platform-user.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiOperation({
    summary: 'Hard delete a platform user',
    description: 'Permanently removes a user from tb_user, tb_user_profile, and Keycloak. This action cannot be undone.',
    'x-description-th': 'ลบผู้ใช้อย่างถาวร (ลบออกจากฐานข้อมูลและ Keycloak)',
    operationId: 'platformUser_hardDelete',
    security: [{ bearerAuth: [] }],
    responses: {
      200: { description: 'User permanently deleted' },
      401: { description: 'Unauthorized' },
      404: { description: 'User not found' },
    },
  } as any)
  async hardDeleteUser(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'hardDeleteUser', id, version },
      PlatformUserController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.platformUserService.hardDeleteUser(
      user_id,
      tenant_id,
      id,
      version,
    );
    this.respond(res, result);
  }
}
