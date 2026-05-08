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
} from '@nestjs/common'
import { Response } from 'express';
import { KeycloakGuard } from 'src/auth'
import { ConfigApplicationRoleService } from './config_application_role.service'
import {
  BaseHttpController,
  EnrichAuditUsers,
  Serialize,
  ApplicationRoleDetailResponseSchema,
  ApplicationRoleListItemResponseSchema,
} from '@/common'
import { CreateConfigApplicationRoleDto, UpdateConfigApplicationRoleDto } from './dto/application_role.dto'
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto'
import { ExtractRequestHeader } from 'src/common/helpers/extract_header'
import { BackendLogger } from 'src/common/helpers/backend.logger'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator'
import { ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator'
import { CreateApplicationRoleRequest, UpdateApplicationRoleRequest } from './swagger/request'

@Controller('api/config/:bu_code/application-roles')
@ApiTags('Config: Roles & Permissions')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class ConfigApplicationRoleController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ConfigApplicationRoleController.name,
  );
  constructor(
    private readonly configApplicationRoleService: ConfigApplicationRoleService,
  ) {
    super();
  }

  /**
   * Lists all defined application roles for access control
   * ค้นหาบทบาทแอปพลิเคชันทั้งหมด (เช่น Admin, Manager, Purchaser, Requestor)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @Serialize(ApplicationRoleListItemResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  @ApiOperation({ summary: 'Get all application roles', description: 'Returns all defined application roles (e.g., Admin, Manager, Purchaser, Requestor) used for access control. Roles determine which system features and data each user can access.', operationId: 'configApplicationRole_findAll', 'x-description-th': 'แสดงรายการบทบาทในระบบทั้งหมดพร้อมการแบ่งหน้าและค้นหา' } as any)
  async findAll(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        user_id: ExtractRequestHeader(req).user_id,
        bu_code,
        query,
        version,
      },
      ConfigApplicationRoleController.name,
    )
    const { user_id } = ExtractRequestHeader(req)
    const paginate = PaginateQuery(query)

    const result = await this.configApplicationRoleService.findAll(paginate, user_id, bu_code, version)
    this.respond(res, result);
  }

  /**
   * Retrieves a specific application role with its permissions
   * ค้นหาบทบาทแอปพลิเคชันเดียวตาม ID พร้อมสิทธิ์ที่เกี่ยวข้อง
   * @param id - Application role ID / รหัสบทบาทแอปพลิเคชัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @Serialize(ApplicationRoleDetailResponseSchema)
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get an application role by ID', description: 'Retrieves a specific application role definition with its associated permissions. Used to review what system capabilities are granted to users assigned this role.', operationId: 'configApplicationRole_findOne', 'x-description-th': 'ดึงข้อมูลบทบาทในระบบรายการเดียวตาม ID' } as any)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req)

    const result = await this.configApplicationRoleService.findOne(id, user_id, bu_code, version)
    this.respond(res, result);
  }

  /**
   * Defines a new application role for access control
   * สร้างบทบาทแอปพลิเคชันใหม่ (เช่น หัวหน้าแผนก ผู้ควบคุมการเงิน)
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param createConfigApplicationRoleDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new application role', description: 'Defines a new application role for access control (e.g., Department Head, Finance Controller). Once created, the role can be assigned permissions and then assigned to users.', operationId: 'configApplicationRole_create', 'x-description-th': 'สร้างบทบาทในระบบใหม่' } as any)
  @ApiBody({ type: CreateApplicationRoleRequest })
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() createConfigApplicationRoleDto: CreateConfigApplicationRoleDto,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);

    const result = await this.configApplicationRoleService.create(createConfigApplicationRoleDto, user_id, bu_code, version)
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Modifies an existing application role's name or permission set
   * อัปเดตบทบาทแอปพลิเคชันที่มีอยู่ การเปลี่ยนแปลงมีผลทันทีกับผู้ใช้ทั้งหมดที่มีบทบาทนี้
   * @param id - Application role ID / รหัสบทบาทแอปพลิเคชัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param updateConfigApplicationRoleDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an application role', description: 'Modifies an existing application role definition, such as updating its name or permission set. Changes immediately affect all users currently assigned this role.', operationId: 'configApplicationRole_update', 'x-description-th': 'อัปเดตข้อมูลบทบาทในระบบที่มีอยู่' } as any)
  @ApiBody({ type: UpdateApplicationRoleRequest })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() updateConfigApplicationRoleDto: UpdateConfigApplicationRoleDto,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);

    const result = await this.configApplicationRoleService.update({ id, ...updateConfigApplicationRoleDto }, user_id, bu_code, version)
    this.respond(res, result);
  }

  /**
   * Removes an application role from the system
   * ลบบทบาทแอปพลิเคชันออกจากระบบ ผู้ใช้ที่มีบทบาทนี้จะสูญเสียสิทธิ์
   * @param id - Application role ID / รหัสบทบาทแอปพลิเคชัน
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an application role', description: 'Removes an application role from the system. Users previously assigned this role will lose its associated permissions. Ensure users are reassigned to appropriate roles before deletion.', operationId: 'configApplicationRole_delete', 'x-description-th': 'ลบบทบาทในระบบตาม ID' } as any)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('version') version: string = 'latest'
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);

    const result = await this.configApplicationRoleService.remove(id, user_id, bu_code, version)
    this.respond(res, result);
  }


}
