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
import { Config_WorkflowsService } from './config_workflows.service';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { WorkflowCreateRequestDto, WorkflowUpdateRequestDto } from './swagger/request';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import {
  BaseHttpController,
  IUpdateWorkflow,
  WorkflowCreateDto,
  WorkflowUpdateDto,
  Serialize,
  WorkflowDetailResponseSchema,
  WorkflowListItemResponseSchema,
  WorkflowMutationResponseSchema,
  EnrichAuditUsers,
} from '@/common';
import {
  ApiUserFilterQueries,
  ApiVersionMinRequest,
} from 'src/common/decorator/userfilter.decorator';
import { PaginateQuery } from 'src/shared-dto/paginate.dto';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/config/:bu_code/workflows')
@ApiTags('Config: Workflows')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_WorkflowsController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_WorkflowsController.name,
  );
  constructor(
    private readonly config_workflowsService: Config_WorkflowsService,
  ) {
    super();
  }

  /**
   * Retrieves a specific approval workflow template with its stages and routing rules
   * ค้นหาขั้นตอนการทำงานเดียวตาม ID รวมถึงขั้นตอนการอนุมัติและบทบาทผู้อนุมัติ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Workflow ID / รหัสขั้นตอนการทำงาน
   * @param version - API version / เวอร์ชัน API
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('workflow.findOne'))
  @Serialize(WorkflowDetailResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a workflow by ID',
    description: 'Retrieves a specific approval workflow template including its stages, approver roles, and routing rules. Workflows define the approval chain for procurement documents like purchase requests and purchase orders.',
    operationId: 'configWorkflows_findOne',
    responses: { 200: { description: 'Workflow retrieved successfully' } },
    'x-description-th': 'ดึงข้อมูลขั้นตอนการทำงานเดียวตาม ID รวมถึงขั้นตอนการอนุมัติและบทบาทผู้อนุมัติ',
  } as any)
  async findOne(
    @Param('bu_code') bu_code: string,
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
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_workflowsService.findOne(
      id,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Lists all configured approval workflow templates
   * ค้นหาขั้นตอนการทำงานทั้งหมดสำหรับการจัดการห่วงโซ่การอนุมัติเอกสาร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination parameters / พารามิเตอร์การแบ่งหน้า
   * @param version - API version / เวอร์ชัน API
   */
  @Get()
  @UseGuards(new AppIdGuard('workflow.findAll'))
  @Serialize(WorkflowListItemResponseSchema)
  @EnrichAuditUsers()
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get all workflows',
    description: 'Returns all configured approval workflow templates for the business unit. Administrators use these to manage document approval chains for purchase requests, purchase orders, and other procurement documents.',
    operationId: 'configWorkflows_findAll',
    responses: { 200: { description: 'Workflows retrieved successfully' } },
    'x-description-th': 'ดึงรายการขั้นตอนการทำงานทั้งหมดสำหรับการจัดการห่วงโซ่การอนุมัติเอกสาร',
  } as any)
  async findAll(
    @Param('bu_code') bu_code: string,
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
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);
    const result = await this.config_workflowsService.findAll(
      user_id,
      bu_code,
      paginate,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Creates a new approval workflow template with stages and approver roles
   * สร้างขั้นตอนการทำงานใหม่สำหรับการอนุมัติเอกสารจัดซื้อ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param createDto - Creation data / ข้อมูลสำหรับสร้าง
   * @param version - API version / เวอร์ชัน API
   */
  @Post()
  @UseGuards(new AppIdGuard('workflow.create'))
  @Serialize(WorkflowMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new workflow',
    description: 'Creates a new approval workflow template defining the stages, approver roles (e.g., HOD, Purchaser, FC, GM), and routing rules for document approvals in the procurement process.',
    operationId: 'configWorkflows_create',
    responses: { 201: { description: 'Workflow created successfully' } },
    'x-description-th': 'สร้างขั้นตอนการทำงานใหม่สำหรับการอนุมัติเอกสารจัดซื้อ',
  } as any)
  @ApiBody({ type: WorkflowCreateRequestDto })
  async create(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Body() createDto: WorkflowCreateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'create',
        createDto,
        version,
      },
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_workflowsService.create(
      createDto,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result, HttpStatus.CREATED);
  }

  /**
   * Modifies an existing approval workflow template
   * อัปเดตขั้นตอนการทำงานที่มีอยู่ เช่น เพิ่ม/ลบขั้นตอนหรือเปลี่ยนบทบาทผู้อนุมัติ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Workflow ID / รหัสขั้นตอนการทำงาน
   * @param updateDto - Update data / ข้อมูลสำหรับอัปเดต
   * @param version - API version / เวอร์ชัน API
   */
  @Put(':id')
  @UseGuards(new AppIdGuard('workflow.update'))
  @Serialize(WorkflowMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a workflow',
    description: 'Modifies an existing approval workflow template, such as adding/removing approval stages or changing approver role assignments. Changes affect all future documents using this workflow.',
    operationId: 'configWorkflows_update',
    responses: { 200: { description: 'Workflow updated successfully' } },
    'x-description-th': 'อัปเดตขั้นตอนการทำงานที่มีอยู่ เช่น เพิ่ม/ลบขั้นตอนหรือเปลี่ยนบทบาทผู้อนุมัติ',
  } as any)
  @ApiBody({ type: WorkflowUpdateRequestDto })
  async update(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateDto: WorkflowUpdateDto,
    @Query('version') version: string = 'latest',
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'update',
        id,
        updateDto,
        version,
      },
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const data: IUpdateWorkflow = {
      ...updateDto,
      id,
    };
    const result = await this.config_workflowsService.update(
      data,
      user_id,
      bu_code,
      version,
    );
    this.respond(res, result);
  }

  /**
   * Removes an approval workflow template from active use
   * ลบขั้นตอนการทำงานออกจากการใช้งาน เอกสารที่กำลังดำเนินการไม่ได้รับผลกระทบ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param id - Workflow ID / รหัสขั้นตอนการทำงาน
   * @param version - API version / เวอร์ชัน API
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('workflow.delete'))
  @Serialize(WorkflowMutationResponseSchema)
  @ApiVersionMinRequest()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a workflow',
    description: 'Removes an approval workflow template from active use. Documents currently in progress using this workflow are not affected, but no new documents will use this workflow.',
    operationId: 'configWorkflows_delete',
    responses: { 200: { description: 'Workflow deleted successfully' } },
    'x-description-th': 'ลบขั้นตอนการทำงานออกจากการใช้งาน เอกสารที่กำลังดำเนินการไม่ได้รับผลกระทบ',
  } as any)
  async delete(
    @Param('bu_code') bu_code: string,
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
      Config_WorkflowsController.name,
    );
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.config_workflowsService.delete(id, user_id, bu_code, version);
    this.respond(res, result);
  }
}
