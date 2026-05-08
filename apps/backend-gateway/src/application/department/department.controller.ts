import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { DepartmentService } from './department.service';
import {
  BaseHttpController,
  Serialize,
  EnrichAuditUsers,
  DepartmentDetailResponseSchema,
  DepartmentListItemResponseSchema,
} from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiVersionMinRequest,
  ApiUserFilterQueries,
} from 'src/common/decorator/userfilter.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/:bu_code/department')
@ApiTags('Config: Departments')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class DepartmentController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    DepartmentController.name,
  );

  constructor(private readonly departmentService: DepartmentService) {
    super();
  }

  /**
   * List all departments in the business unit
   * ค้นหารายการแผนกทั้งหมดในหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param query - Pagination query parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   * @returns Paginated list of departments / รายการแผนกแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('department.findAll'))
  @Serialize(DepartmentListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all departments',
    description: 'Lists all hotel departments (e.g., Kitchen, F&B, Housekeeping) within the business unit, used to assign requisitions, track departmental consumption, and allocate procurement costs.',
    operationId: 'findAllDepartments',
    'x-description-th': 'แสดงรายการแผนกทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
  } as any)
  @HttpCode(HttpStatus.OK)
  async getDepartments(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query() query: IPaginateQuery,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getDepartments',
        query,
        version,
      },
      DepartmentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    const result = await this.departmentService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Get a specific department by ID
   * ค้นหารายการแผนกเดียวตาม ID
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param id - Department ID / รหัสแผนก
   * @param version - API version / เวอร์ชัน API
   * @returns Department details / รายละเอียดแผนก
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('department.findOne'))
  @Serialize(DepartmentDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @ApiOperation({
    summary: 'Get a department by id',
    description: 'Retrieves the details of a specific hotel department, including its code, name, and active status, for use in procurement and inventory assignment workflows.',
    operationId: 'findOneDepartment',
    'x-description-th': 'ดึงข้อมูลแผนกรายการเดียวตาม ID',
  } as any)
  @HttpCode(HttpStatus.OK)
  async getDepartment(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'getDepartment',
        id,
        version,
      },
      DepartmentController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.departmentService.getDepartment(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }
}
