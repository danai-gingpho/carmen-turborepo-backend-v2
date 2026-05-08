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
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportService } from './report.service';
import { BaseHttpController } from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { GenerateReportRequestDto, ViewerRequestDto, ReportDataRequestDto, CreateScheduleRequestDto } from './swagger/request';
import { ReportTypeResponseDto, ReportTemplateResponseDto, ViewerResponseDto, AsyncResponseDto, JobStatusResponseDto, ScheduleResponseDto } from './swagger/response';

@Controller('api/:bu_code/report')
@ApiTags('Reports: Reports')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class ReportController extends BaseHttpController {
  private readonly logger = new BackendLogger(ReportController.name);

  constructor(private readonly reportService: ReportService) {
    super();
  }

  /**
   * Generate a report synchronously
   * สร้างรายงานแบบ synchronous
   */
  @Post('generate')
  @ApiOperation({
    summary: 'Generate report',
    description:
      'Generates a report synchronously. Returns file bytes for PDF/Excel/CSV or JSON data.',
    'x-description-th': 'สร้างรายงาน',
    operationId: 'generateReport',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiBody({ type: GenerateReportRequestDto, description: 'Report generation parameters' })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully. Returns JSON data or file download depending on format.',
    content: {
      'application/json': {
        example: {
          data: [],
          message: 'Success',
          status: 200,
        },
      },
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { schema: { type: 'string', format: 'binary' } },
      'text/csv': { schema: { type: 'string', format: 'binary' } },
    },
  } as any)
  @HttpCode(HttpStatus.OK)
  async generate(
    @Param('bu_code') bu_code: string,
    @Body() body: GenerateReportRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);

    this.logger.debug(
      { function: 'generate', report_type: body.report_type, bu_code },
      ReportController.name,
    );

    const format = body.format || 'json';
    const result = await this.reportService.generate(
      user_id,
      bu_code,
      body.report_type,
      format,
      body.filters as any,
      body.options as any,
      body.template_id,
    );

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.status(HttpStatus.OK).send(result.file_content);
      return;
    }

    // File download
    res.setHeader('Content-Type', result.content_type);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.file_name}"`,
    );
    res.setHeader('X-Row-Count', String(result.row_count));
    res.status(HttpStatus.OK).send(Buffer.from(result.file_content));
  }

  /**
   * List available report types
   * ดึงรายการประเภทรายงานที่มี
   */
  @Get('types')
  @ApiOperation({
    summary: 'List report types',
    description: 'Returns all available report types with metadata including supported formats and category.',
    'x-description-th': 'แสดงรายการประเภทรายงานที่มีทั้งหมด',
    operationId: 'listReportTypes',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by report category', example: 'inventory' })
  @ApiResponse({
    status: 200,
    description: 'Report types retrieved successfully',
    type: [ReportTypeResponseDto],
  } as any)
  @HttpCode(HttpStatus.OK)
  async listTypes(
    @Query('category') category: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.reportService.listTypes(category || undefined);
    this.respond(res, { data: result.types });
  }

  /**
   * List report templates
   * ดึงรายการเทมเพลตรายงาน
   */
  @Get('templates')
  @ApiOperation({
    summary: 'List report templates',
    description: 'Returns all active report templates, optionally filtered by report_group.',
    'x-description-th': 'แสดงรายการแม่แบบรายงานทั้งหมด',
    operationId: 'listReportTemplates',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiQuery({ name: 'report_group', required: false, description: 'Filter by report group', example: 'inventory' })
  @ApiResponse({
    status: 200,
    description: 'Report templates retrieved successfully',
    type: [ReportTemplateResponseDto],
  } as any)
  @HttpCode(HttpStatus.OK)
  async listTemplates(
    @Query('report_group') report_group: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.reportService.listTemplates(
      report_group || undefined,
    );
    this.respond(res, { data: result.templates });
  }

  /**
   * Get a specific template by ID
   * ดึงเทมเพลตรายงานตาม ID
   */
  @Get('templates/:id')
  @ApiOperation({
    summary: 'Get report template',
    description: 'Returns a single report template by ID with full configuration including dialog and content.',
    'x-description-th': 'ดึงข้อมูลแม่แบบรายงานรายการเดียวตาม ID',
    operationId: 'getReportTemplate',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiParam({ name: 'id', description: 'Report template ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({
    status: 200,
    description: 'Report template retrieved successfully',
    type: ReportTemplateResponseDto,
  } as any)
  @ApiResponse({ status: 404, description: 'Report template not found' })
  @HttpCode(HttpStatus.OK)
  async getTemplate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.reportService.getTemplate(id);
    this.respond(res, { data: result });
  }

  /**
   * View report via external FastReport viewer
   * ส่งข้อมูลไป external viewer แล้วได้ URL กลับมา
   */
  @Post('viewer')
  @ApiOperation({
    summary: 'View report in external viewer',
    description: 'Sends template + data to external FastReport viewer and returns a viewer URL.',
    'x-description-th': 'ดูรายงานผ่าน external viewer',
    operationId: 'viewReport',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiBody({ type: ViewerRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Viewer URL returned successfully',
    type: ViewerResponseDto,
  } as any)
  @HttpCode(HttpStatus.OK)
  async viewReport(
    @Param('bu_code') bu_code: string,
    @Body() body: ViewerRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      { function: 'viewReport', bu_code, template_id: body.template_id },
      ReportController.name,
    );

    const result = await this.reportService.viewReport(
      bu_code,
      body.template_id,
      body.filters,
    );
    this.respond(res, { data: result });
  }

  /**
   * Get report data as JSON (no PDF render)
   * ดึงข้อมูลรายงานเป็น JSON สำหรับ WebReport viewer
   */
  @Post('data')
  @ApiOperation({
    summary: 'Get report data',
    description: 'Returns JSON data rows for a template without rendering PDF. Used by WebReport viewer.',
    'x-description-th': 'ดึงข้อมูลรายงานเป็น JSON',
    operationId: 'getReportData',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiBody({ type: ReportDataRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Report data returned successfully',
  } as any)
  @HttpCode(HttpStatus.OK)
  async reportData(
    @Param('bu_code') bu_code: string,
    @Body() body: ReportDataRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      { function: 'reportData', bu_code, template_id: body.template_id },
      ReportController.name,
    );

    const result = await this.reportService.reportData(
      bu_code,
      body.template_id,
      body.filters,
    );
    this.respond(res, { data: result });
  }

  /**
   * Get lookup data for report filters
   * ดึงข้อมูล lookup สำหรับ filter (vendor, location, product, etc.)
   */
  /**
   * Resolve the print template for a document type within this BU.
   * ใช้ตัดสินว่า document_type นี้ของ BU นี้ ใช้ template ไหนพิมพ์
   */
  @Get('print-template')
  @ApiOperation({
    summary: 'Resolve print template for a document type',
    description:
      'Returns the active print-template mapping for the given document_type within this BU. Used by the tenant UI Print button to discover which template to render.',
    operationId: 'resolvePrintTemplate',
    tags: ['Tenant Report', 'Print'],
    'x-description-th': 'หาตัว print template ที่จะใช้พิมพ์เอกสารชนิดนี้ใน BU นี้',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiQuery({ name: 'document_type', required: true, description: 'PR / PO / GRN / CN / SR / IA / PC / SC / RFQ / INV', example: 'PR' })
  @HttpCode(HttpStatus.OK)
  async resolvePrintTemplate(
    @Param('bu_code') bu_code: string,
    @Query('document_type') document_type: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!document_type) {
      this.respond(res, { kind: 'error', message: 'document_type query param is required', code: 'BAD_REQUEST' } as any);
      return;
    }
    const result = await this.reportService.resolvePrintTemplate(bu_code, document_type);
    this.respond(res, { data: result });
  }

  @Get('lookups')
  @ApiOperation({
    summary: 'Get report lookups',
    description: 'Returns lookup data (vendor, location, product, category, etc.) for populating report filter dropdowns.',
    'x-description-th': 'ดึงข้อมูล lookup สำหรับตัวกรองรายงาน',
    operationId: 'getReportLookups',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiQuery({ name: 'types', required: false, description: 'Comma-separated lookup types', example: 'vendor,location,product,category' })
  @ApiResponse({
    status: 200,
    description: 'Lookup data returned successfully',
  } as any)
  @HttpCode(HttpStatus.OK)
  async lookups(
    @Param('bu_code') bu_code: string,
    @Query('types') types: string,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      { function: 'lookups', bu_code, types },
      ReportController.name,
    );

    const result = await this.reportService.lookups(bu_code, types);
    this.respond(res, { data: result });
  }

  // ============================================================
  // Async Job Endpoints
  // ============================================================

  /**
   * Generate a report asynchronously
   * สร้างรายงานแบบ async (queue job)
   */
  @Post('generate-async')
  @ApiOperation({
    summary: 'Generate report (async)',
    description: 'Queues a report generation job and returns a job ID for tracking.',
    'x-description-th': 'สร้างรายงานแบบ async',
    operationId: 'generateReportAsync',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiBody({ type: GenerateReportRequestDto })
  @ApiResponse({ status: 200, description: 'Job queued successfully', type: AsyncResponseDto } as any)
  @HttpCode(HttpStatus.OK)
  async generateAsync(
    @Param('bu_code') bu_code: string,
    @Body() body: GenerateReportRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.reportService.generateAsync(
      user_id,
      bu_code,
      body.report_type,
      body.format || 'pdf',
      body.filters as any,
      body.options as any,
    );
    this.respond(res, { data: result });
  }

  /**
   * Get async job status
   * ดึงสถานะ job
   */
  @Get('jobs/:job_id')
  @ApiOperation({
    summary: 'Get job status',
    description: 'Returns the current status of an async report job.',
    'x-description-th': 'ดึงสถานะงานรายงาน',
    operationId: 'getJobStatus',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiParam({ name: 'job_id', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job status', type: JobStatusResponseDto } as any)
  @HttpCode(HttpStatus.OK)
  async getJobStatus(
    @Param('bu_code') bu_code: string,
    @Param('job_id') job_id: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.reportService.getJobStatus(user_id, bu_code, job_id);
    this.respond(res, { data: result });
  }

  /**
   * Get report generation history
   * ดึงประวัติการสร้างรายงาน
   */
  @Get('history')
  @ApiOperation({
    summary: 'Get report history',
    description: 'Returns report generation history with pagination.',
    'x-description-th': 'ดึงประวัติการสร้างรายงาน',
    operationId: 'getReportHistory',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'report_type', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Report history' } as any)
  @HttpCode(HttpStatus.OK)
  async getHistory(
    @Param('bu_code') bu_code: string,
    @Query('page') page: number,
    @Query('per_page') per_page: number,
    @Query('report_type') report_type: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.reportService.getHistory(
      user_id,
      bu_code,
      page ? Number(page) : undefined,
      per_page ? Number(per_page) : undefined,
      report_type || undefined,
    );
    this.respond(res, { data: result });
  }

  // ============================================================
  // Schedule Endpoints
  // ============================================================

  /**
   * Create a report schedule
   * สร้างกำหนดการรายงานอัตโนมัติ
   */
  @Post('schedules')
  @ApiOperation({
    summary: 'Create report schedule',
    description: 'Creates a recurring report schedule using a cron expression.',
    'x-description-th': 'สร้างกำหนดการรายงานอัตโนมัติ',
    operationId: 'createReportSchedule',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiBody({ type: CreateScheduleRequestDto })
  @ApiResponse({ status: 200, description: 'Schedule created', type: ScheduleResponseDto } as any)
  @HttpCode(HttpStatus.OK)
  async createSchedule(
    @Param('bu_code') bu_code: string,
    @Body() body: CreateScheduleRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.reportService.createSchedule(
      user_id,
      bu_code,
      body.name,
      body.report_type,
      body.format || 'viewer_url',
      body.cron_expression,
      body.filters as any,
      body.options as any,
      body.recipients,
      body.report_template_id,
      body.schedule_config as any,
      body.delivery as any,
      body.notifications as any,
    );
    this.respond(res, { data: result });
  }

  /**
   * List report schedules
   * ดึงรายการกำหนดการรายงาน
   */
  @Get('schedules')
  @ApiOperation({
    summary: 'List report schedules',
    description: 'Returns all report schedules for this business unit.',
    'x-description-th': 'ดึงรายการกำหนดการรายงาน',
    operationId: 'listReportSchedules',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiResponse({ status: 200, description: 'Schedules list', type: [ScheduleResponseDto] } as any)
  @HttpCode(HttpStatus.OK)
  async listSchedules(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.reportService.listSchedules(user_id, bu_code);
    this.respond(res, { data: result.schedules });
  }

  /**
   * Delete a report schedule
   * ลบกำหนดการรายงาน
   */
  @Delete('schedules/:id')
  @ApiOperation({
    summary: 'Delete report schedule',
    description: 'Soft-deletes a report schedule.',
    'x-description-th': 'ลบกำหนดการรายงาน',
    operationId: 'deleteReportSchedule',
  } as any)
  @ApiParam({ name: 'bu_code', description: 'Business unit code', example: 'BU001' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule deleted' } as any)
  @HttpCode(HttpStatus.OK)
  async deleteSchedule(
    @Param('bu_code') bu_code: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.reportService.deleteSchedule(user_id, bu_code, id);
    this.respond(res, { data: result });
  }
}
