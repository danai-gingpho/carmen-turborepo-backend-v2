import {
  Body,
  Controller,
  Delete,
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
import { ActivityLogService, IActivityLogFilter } from './activity-log.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { BaseHttpController, EnrichAuditUsers } from '@/common';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { ApiUserFilterQueries } from 'src/common/decorator/userfilter.decorator';
import { BatchDeleteDto } from './swagger/request';

@Controller('api/:bu_code/activity-log')
@ApiTags('Reports: Activity Log')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class ActivityLogController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ActivityLogController.name,
  );

  constructor(private readonly activityLogService: ActivityLogService) {
    super();
  }

  /**
   * List all activity logs with optional filters
   * ค้นหารายการบันทึกกิจกรรมทั้งหมดพร้อมตัวกรอง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @param entity_type - Filter by entity type / กรองตามประเภทเอกสาร
   * @param entity_id - Filter by entity ID / กรองตามรหัสเอกสาร
   * @param actor_id - Filter by actor ID / กรองตามรหัสผู้กระทำ
   * @param action - Filter by action / กรองตามการกระทำ
   * @param start_date - Filter from date / กรองจากวันที่
   * @param end_date - Filter to date / กรองถึงวันที่
   * @returns Paginated activity logs / รายการบันทึกกิจกรรมแบบแบ่งหน้า
   */
  @Get()
  @UseGuards(new AppIdGuard('activityLog.findAll'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all activity logs',
    description: 'Lists all user activity records for the business unit with filtering by entity type, user, action, and date range. Used for audit trail review, compliance reporting, and investigating who performed what actions on procurement and inventory documents.',
    'x-description-th': 'แสดงรายการบันทึกกิจกรรมทั้งหมดพร้อมการแบ่งหน้าและค้นหา',
    operationId: 'findAllActivityLogs',
    responses: {
      200: { description: 'Activity logs retrieved successfully' },
    },
  })
  @ApiUserFilterQueries()
  @ApiQuery({ name: 'entity_type', required: false, type: String, description: 'Filter by entity type' })
  @ApiQuery({ name: 'entity_id', required: false, type: String, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'actor_id', required: false, type: String, description: 'Filter by actor (user) ID' })
  @ApiQuery({ name: 'action', required: false, type: String, description: 'Filter by action (create, update, delete, etc.)' })
  @ApiQuery({ name: 'start_date', required: false, type: String, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'end_date', required: false, type: String, description: 'Filter to date (ISO 8601)' })
  async findAll(
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
    @Query('entity_type') entity_type?: string,
    @Query('entity_id') entity_id?: string,
    @Query('actor_id') actor_id?: string,
    @Query('action') action?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findAll',
        query,
      },
      ActivityLogController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    const filters: IActivityLogFilter = {};
    if (entity_type) filters.entity_type = entity_type;
    if (entity_id) filters.entity_id = entity_id;
    if (actor_id) filters.actor_id = actor_id;
    if (action) filters.action = action;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const result = await this.activityLogService.findAll(user_id, bu_code, paginate, filters);
    this.respond(res, result);
  }

  /**
   * List activity logs filtered by entity type
   * ค้นหารายการบันทึกกิจกรรมตามประเภทเอกสาร
   * @param entity_type - Entity type to filter / ประเภทเอกสารที่จะกรอง
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @param query - Pagination query / คำค้นหาการแบ่งหน้า
   * @returns Paginated activity logs by entity / รายการบันทึกกิจกรรมตามประเภทเอกสารแบบแบ่งหน้า
   */
  @Get('entity/:entity_type')
  @UseGuards(new AppIdGuard('activityLog.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiUserFilterQueries()
  @ApiOperation({
    summary: 'Get activity logs by entity type',
    description: 'Retrieves all activity records for a specific document type (e.g., purchase_request, purchase_order, good_received_note). Used to review the complete history of actions taken on a particular category of business documents.',
    'x-description-th': 'ดึงรายการบันทึกกิจกรรมตามประเภทเอกสาร',
    operationId: 'findActivityLogsByEntity',
    responses: {
      200: { description: 'Activity logs retrieved successfully' },
    },
  } as any)
  async findByEntity(
    @Param('entity_type') entity_type: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query() query: IPaginateQuery,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findByEntity',
        entity_type,
        query,
      },
      ActivityLogController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const paginate = PaginateQuery(query);

    const result = await this.activityLogService.findByEntity(entity_type, user_id, bu_code, paginate);
    this.respond(res, result);
  }

  /**
   * Find an activity log entry by ID
   * ค้นหารายการบันทึกกิจกรรมรายการเดียวตาม ID
   * @param id - Activity log ID / รหัสบันทึกกิจกรรม
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Activity log details / รายละเอียดบันทึกกิจกรรม
   */
  @Get(':id')
  @UseGuards(new AppIdGuard('activityLog.findOne'))
  @EnrichAuditUsers()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get an activity log by ID',
    description: 'Retrieves the full details of a single audit log entry including the user who performed the action, timestamp, affected entity, and the before/after data changes. Used for detailed investigation of specific user actions.',
    'x-description-th': 'ดึงข้อมูลบันทึกกิจกรรมรายการเดียวตาม ID',
    operationId: 'findOneActivityLog',
    responses: {
      200: { description: 'Activity log retrieved successfully' },
      404: { description: 'Activity log not found' },
    },
  } as any)
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'findOne',
        id,
      },
      ActivityLogController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.activityLogService.findOne(id, user_id, bu_code);
    this.respond(res, result);
  }

  /**
   * Soft-delete an activity log entry
   * ลบบันทึกกิจกรรมแบบ soft delete
   * @param id - Activity log ID / รหัสบันทึกกิจกรรม
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Delete result / ผลลัพธ์การลบ
   */
  @Delete(':id')
  @UseGuards(new AppIdGuard('activityLog.delete'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete an activity log',
    description: 'Marks an activity log entry as deleted without permanently removing it, preserving the audit trail for compliance. The entry can be restored if needed.',
    'x-description-th': 'ลบบันทึกกิจกรรมตาม ID',
    operationId: 'deleteActivityLog',
    responses: {
      200: { description: 'Activity log deleted successfully' },
      404: { description: 'Activity log not found' },
    },
  } as any)
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'delete',
        id,
      },
      ActivityLogController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.activityLogService.delete(id, user_id, bu_code);
    this.respond(res, result);
  }

  /**
   * Batch soft-delete multiple activity log entries
   * ลบบันทึกกิจกรรมหลายรายการแบบ soft delete เป็นชุด
   * @param body - IDs of logs to delete / รหัสบันทึกที่จะลบ
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Batch delete result / ผลลัพธ์การลบเป็นชุด
   */
  @Delete('batch/soft')
  @UseGuards(new AppIdGuard('activityLog.deleteMany'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch soft delete activity logs',
    description: 'Marks multiple activity log entries as deleted in a single operation without permanently removing them. Used for bulk cleanup of audit records while preserving recoverability.',
    'x-description-th': 'ลบบันทึกกิจกรรมหลายรายการพร้อมกัน',
    operationId: 'deleteManyActivityLogs',
    responses: {
      200: { description: 'Activity logs deleted successfully' },
    },
  })
  @ApiBody({ type: BatchDeleteDto, description: 'IDs of activity logs to delete' })
  async deleteMany(
    @Body() body: BatchDeleteDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'deleteMany',
        ids: body.ids,
      },
      ActivityLogController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.activityLogService.deleteMany(body.ids, user_id, bu_code);
    this.respond(res, result);
  }

  /**
   * Permanently delete an activity log entry (hard delete)
   * ลบบันทึกกิจกรรมอย่างถาวร (hard delete)
   * @param id - Activity log ID / รหัสบันทึกกิจกรรม
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Hard delete result / ผลลัพธ์การลบถาวร
   */
  @Delete(':id/hard')
  @UseGuards(new AppIdGuard('activityLog.hardDelete'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hard delete an activity log',
    description: 'Permanently and irreversibly removes an activity log entry from the database. Use with caution as this cannot be undone and may affect audit compliance.',
    'x-description-th': 'ลบบันทึกกิจกรรมอย่างถาวรตาม ID',
    operationId: 'hardDeleteActivityLog',
    responses: {
      200: { description: 'Activity log permanently deleted' },
      404: { description: 'Activity log not found' },
    },
  } as any)
  async hardDelete(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'hardDelete',
        id,
      },
      ActivityLogController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.activityLogService.hardDelete(id, user_id, bu_code);
    this.respond(res, result);
  }

  /**
   * Batch permanently delete multiple activity log entries (hard delete)
   * ลบบันทึกกิจกรรมหลายรายการอย่างถาวร (hard delete) เป็นชุด
   * @param body - IDs of logs to permanently delete / รหัสบันทึกที่จะลบถาวร
   * @param bu_code - Business unit code / รหัสหน่วยธุรกิจ
   * @param req - HTTP request / คำขอ HTTP
   * @param res - HTTP response / การตอบกลับ HTTP
   * @returns Batch hard delete result / ผลลัพธ์การลบถาวรเป็นชุด
   */
  @Delete('batch/hard')
  @UseGuards(new AppIdGuard('activityLog.hardDeleteMany'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch hard delete activity logs',
    description: 'Permanently and irreversibly removes multiple activity log entries from the database in a single operation. Use with caution as this cannot be undone and may affect audit compliance.',
    'x-description-th': 'ลบบันทึกกิจกรรมหลายรายการอย่างถาวรพร้อมกัน',
    operationId: 'hardDeleteManyActivityLogs',
    responses: {
      200: { description: 'Activity logs permanently deleted' },
    },
  })
  @ApiBody({ type: BatchDeleteDto, description: 'IDs of activity logs to permanently delete' })
  async hardDeleteMany(
    @Body() body: BatchDeleteDto,
    @Param('bu_code') bu_code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.debug(
      {
        function: 'hardDeleteMany',
        ids: body.ids,
      },
      ActivityLogController.name,
    );

    const { user_id } = ExtractRequestHeader(req);
    const result = await this.activityLogService.hardDeleteMany(body.ids, user_id, bu_code);
    this.respond(res, result);
  }
}
