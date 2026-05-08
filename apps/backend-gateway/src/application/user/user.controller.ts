import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { UserService } from './user.service';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { UpdateUserProfileDto } from 'src/auth/dto/auth.dto';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import {
  BaseHttpController,
  Serialize,
  UserProfileResponseSchema,
  UserListItemResponseSchema,
} from '@/common';
import { UpdateUserProfileRequestDto } from './swagger/request';
import { UserProfileResponseDto } from './swagger/response';

@Controller()
@ApiTags('User: Profile')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class UserController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    UserController.name,
  );

  constructor(private readonly userService: UserService) {
    super();
  }

  /**
   * Retrieve the authenticated user's profile
   * ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่เข้าสู่ระบบ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns User profile data / ข้อมูลโปรไฟล์ผู้ใช้
   */
  @Get('/api/user/profile')
  @UseGuards(new AppIdGuard('user.getProfile'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(KeycloakGuard)
  @Serialize(UserProfileResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieves the authenticated user\'s profile information including name, contact details, assigned business units, and role within the hotel ERP system.',
    'x-description-th': 'ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่เข้าสู่ระบบ',
    operationId: 'getUserProfile',
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
        description: 'User profile retrieved successfully',
      },
    },
  } as any)
  async profile(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'profile',
        version,
      },
      UserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.userService.getUserProfile(user_id, version);
    this.respond(res, result);
  }

  /**
   * Update the authenticated user's profile
   * อัปเดตข้อมูลโปรไฟล์ของผู้ใช้ที่เข้าสู่ระบบ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param updateData - Profile data to update / ข้อมูลโปรไฟล์ที่จะอัปเดต
   * @param version - API version / เวอร์ชัน API
   * @returns Updated user profile / ข้อมูลโปรไฟล์ผู้ใช้ที่อัปเดตแล้ว
   */
  @Patch('/api/user/profile')
  @UseGuards(new AppIdGuard('user.updateProfile'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Serialize(UserProfileResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      "Updates the authenticated user's profile information (name, contact details) in both the identity provider and the ERP database.",
    'x-description-th': 'อัปเดตข้อมูลโปรไฟล์ของผู้ใช้ที่เข้าสู่ระบบ',
    operationId: 'updateCurrentUserProfile',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      200: {
        description: 'User profile updated successfully',
        type: UserProfileResponseDto,
      },
    },
  })
  @ApiBody({ type: UpdateUserProfileRequestDto })
  async updateProfile(
    @Req() req: Request,
    @Res() res: Response,
    @Body() updateData: UpdateUserProfileDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);

    this.logger.debug(
      {
        function: 'updateProfile',
        user_id,
        updateData,
        version,
      },
      UserController.name,
    );

    const result = await this.userService.updateUserById(
      user_id,
      updateData,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Retrieve the authenticated user's permissions
   * ดึงข้อมูลสิทธิ์การใช้งานของผู้ใช้ที่เข้าสู่ระบบ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns User permission set / ชุดสิทธิ์การใช้งานของผู้ใช้
   */
  @Get('/api/user/permission')
  @UseGuards(KeycloakGuard)
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get user permissions',
    description: 'Retrieves the authenticated user\'s permission set, defining which procurement modules, inventory operations, and approval actions the user is authorized to perform within the ERP system.',
    'x-description-th': 'ดึงข้อมูลสิทธิ์การใช้งานของผู้ใช้ที่เข้าสู่ระบบ',
    operationId: 'getUserPermission',
    deprecated: false,
    security: [{}],
    parameters: [
      {
        name: 'version',
        in: 'query',
        required: false,
      },
    ],
    responses: {
      200: {
        description: 'User permissions retrieved successfully',
      },
      401: {
        description: 'Unauthorized',
      },
    },
  } as any)
  async getPermission(
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ) {
    const { user_id } = ExtractRequestHeader(req);

    this.logger.debug(
      {
        function: 'getPermission',
        user_id,
        version,
      },
      UserController.name,
    );

    const result = await this.userService.getPermission(user_id, version);

    this.respond(res, result);
  }

  /**
   * List all users in the current business unit
   * ค้นหารายการผู้ใช้ทั้งหมดในหน่วยธุรกิจปัจจุบัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of users / รายการผู้ใช้แบบแบ่งหน้า
   */
  // get all user in tenant
  @Get('api/:bu_code/users')
  @UseGuards(new AppIdGuard('user.getAllUserInTenant'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(KeycloakGuard)
  @Serialize(UserListItemResponseSchema)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all users in tenant',
    description: 'Lists all users assigned to the current business unit (tenant), used for administrative purposes such as managing staff access, assigning roles, and configuring approval workflows.',
    'x-description-th': 'แสดงรายการผู้ใช้ทั้งหมดในหน่วยธุรกิจปัจจุบัน',
    operationId: 'getAllUserInTenant',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      200: {
        description: 'Users list retrieved successfully',
      },
    },
  } as any)
  async getAllUserInTenant(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query?: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getAllUserInTenant',
        query,
        version,
      },
      UserController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.userService.getAllUserInTenant(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Update a user's profile by ID
   * อัปเดตข้อมูลโปรไฟล์ผู้ใช้ตาม ID
   * @param targetUserId - Target user ID / รหัสผู้ใช้เป้าหมาย
   * @param updateData - Profile data to update / ข้อมูลโปรไฟล์ที่จะอัปเดต
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param version - API version / เวอร์ชัน API
   * @returns Updated user profile / ข้อมูลโปรไฟล์ผู้ใช้ที่อัปเดตแล้ว
   */
  @Put('/api/user/:user_id')
  @UseGuards(new AppIdGuard('user.updateUserById'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Serialize(UserProfileResponseSchema)
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Update user profile by ID',
    description:
      'Updates a user\'s profile information (name, contact details) in both the identity provider and the ERP database, ensuring consistent user data across the hotel procurement system.',
    'x-description-th': 'อัปเดตข้อมูลผู้ใช้ที่มีอยู่',
    operationId: 'updateUserById',
    deprecated: false,
    security: [
      {
        bearerAuth: [],
      },
    ],
    responses: {
      200: {
        description: 'User profile updated successfully',
      },
      404: {
        description: 'User not found',
      },
    },
  })
  @ApiBody({ type: UpdateUserProfileRequestDto })
  async updateUserById(
    @Param('user_id', new ParseUUIDPipe({ version: '4' })) targetUserId: string,
    @Body() updateData: UpdateUserProfileDto,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'updateUserById',
        targetUserId,
        updateData,
        version,
      },
      UserController.name,
    );

    const result = await this.userService.updateUserById(
      targetUserId,
      updateData,
      version,
    );
    this.respond(res, result);
  }
}
