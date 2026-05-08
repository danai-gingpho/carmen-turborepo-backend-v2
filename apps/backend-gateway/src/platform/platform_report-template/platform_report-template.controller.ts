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
import { Platform_ReportTemplateService } from './platform_report-template.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiBody } from '@nestjs/swagger';
import { ReportTemplateCreateDto, ReportTemplateUpdateDto } from './dto/report-template.dto';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { BaseHttpController, EnrichAuditUsers } from '@/common';

@Controller('api-system/report-template')
@ApiTags('Platform: Report Templates')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Platform_ReportTemplateController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Platform_ReportTemplateController.name,
  );

  constructor(
    private readonly reportTemplateService: Platform_ReportTemplateService,
  ) {
    super();
  }

  /**
   * List all report templates with pagination
   * ค้นหารายการเทมเพลตรายงานทั้งหมดพร้อมการแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('report-template.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get list of report templates',
    description: 'Lists all report templates with pagination. Each template contains dialog (XML) for parameter configuration and content (XML converted from .frx) for report layout.',
    'x-description-th': 'แสดงรายการแม่แบบรายงานทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'platformReportTemplate_findAll',
    responses: {
      200: { description: 'Report templates retrieved successfully' },
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
      { function: 'findAll', query, version },
      Platform_ReportTemplateController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.reportTemplateService.findAll(
      user_id,
      tenant_id,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * List views, functions, and stored procedures present in a tenant schema.
   * Used by the report-template Edit form to populate the Source Name picker.
   */
  @Get('db-objects')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List tenant DB objects (views / functions / procedures)',
    description: 'Introspects the given tenant schema and returns user-defined views, functions, and procedures usable as a report source.',
    'x-description-th': 'แสดงรายการ view / function / procedure ของ tenant ที่เลือก สำหรับใช้เลือกเป็น source ของ report template',
    operationId: 'platformReportTemplate_listDbObjects',
    tags: ['Platform Admin', 'Report Template'],
  } as any)
  async listDbObjects(
    @Req() req: Request,
    @Res() res: Response,
    @Query('bu_code') bu_code: string,
  ): Promise<void> {
    if (!bu_code) {
      this.respond(res, { kind: 'error', message: 'bu_code query param is required', code: 'BAD_REQUEST' } as any);
      return;
    }
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.reportTemplateService.listDbObjects(user_id, bu_code);
    this.respond(res, result);
  }

  /**
   * Get a report template by ID
   * ค้นหาเทมเพลตรายงานตาม ID
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('report-template.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'Report Template ID', type: 'string' })
  @ApiOperation({
    summary: 'Get report template by ID',
    description: 'Retrieves a specific report template including its dialog (XML) and content (XML from .frx file).',
    'x-description-th': 'ดึงข้อมูลแม่แบบรายงานรายการเดียวตาม ID',
    operationId: 'platformReportTemplate_findOne',
    responses: {
      200: { description: 'Report template retrieved successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'Report template not found' },
    },
  } as any)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'findOne', id, version },
      Platform_ReportTemplateController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.reportTemplateService.findOne(
      id,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Create a new report template
   * สร้างเทมเพลตรายงานใหม่
   */
  @Post()
  @UseGuards(new AppIdGuard('report-template.create'))
  @HttpCode(HttpStatus.CREATED)
  @ApiVersionMinRequest()
  @ApiBody({ type: ReportTemplateCreateDto, description: 'Create report template data' })
  @ApiOperation({
    summary: 'Create a new report template',
    description: 'Creates a new report template. The dialog field stores XML for parameter dialog configuration. The content field stores XML converted from .frx report layout file.',
    'x-description-th': 'สร้างแม่แบบรายงานใหม่',
    operationId: 'platformReportTemplate_create',
    responses: {
      201: { description: 'Report template created successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
    },
  } as any)
  async create(
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: ReportTemplateCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'create', createDto, version },
      Platform_ReportTemplateController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.reportTemplateService.create(
      createDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Update an existing report template
   * อัปเดตเทมเพลตรายงาน
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('report-template.update'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'Report Template ID', type: 'string' })
  @ApiBody({ type: ReportTemplateUpdateDto, description: 'Update report template data' })
  @ApiOperation({
    summary: 'Update a report template',
    description: 'Updates an existing report template. Can update dialog (XML), content (XML from .frx), and other metadata.',
    'x-description-th': 'อัปเดตข้อมูลแม่แบบรายงานที่มีอยู่',
    operationId: 'platformReportTemplate_update',
    responses: {
      200: { description: 'Report template updated successfully' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
      404: { description: 'Report template not found' },
    },
  } as any)
  async update(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateDto: ReportTemplateUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'update', id, updateDto, version },
      Platform_ReportTemplateController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.reportTemplateService.update(
      id,
      updateDto,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Delete a report template
   * ลบเทมเพลตรายงาน
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('report-template.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiVersionMinRequest()
  @ApiParam({ name: 'id', description: 'Report Template ID', type: 'string' })
  @ApiOperation({
    summary: 'Delete a report template',
    description: 'Soft-deletes a report template by setting deleted_at timestamp.',
    'x-description-th': 'ลบแม่แบบรายงานตาม ID',
    operationId: 'platformReportTemplate_delete',
    responses: {
      200: { description: 'Report template deleted successfully' },
      401: { description: 'Unauthorized' },
      404: { description: 'Report template not found' },
    },
  } as any)
  async delete(
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      { function: 'delete', id, version },
      Platform_ReportTemplateController.name,
    );
    const { user_id, tenant_id } = ExtractRequestHeader(req);
    const result = await this.reportTemplateService.delete(
      id,
      user_id,
      tenant_id,
      version,
    );
    this.respond(res, result);
  }
}
