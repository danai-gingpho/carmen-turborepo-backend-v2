import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
  Res,
  Query,
  HttpCode,
  HttpStatus,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { ActivityLogService, IActivityLogFilter } from './activity-log.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  BaseHttpController,
  ZodSerializerInterceptor,
} from '@/common';
import { TenantHeaderGuard } from 'src/common/guard/tenant-header.guard';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { IPaginateQuery, PaginateQuery } from 'src/shared-dto/paginate.dto';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { AppIdGuard } from 'src/common/guard/app-id.guard';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';

@Controller('api/:bu_code/activity-log')
@ApiTags('Application - Activity Log')
@ApiHeaderRequiredXAppId()
@UseGuards(KeycloakGuard, TenantHeaderGuard)
@ApiBearerAuth()
export class ActivityLogController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    ActivityLogController.name,
  );

  constructor(private readonly activityLogService: ActivityLogService) {
    super();
  }

  @Get()
  @UseGuards(new AppIdGuard('activityLog.findAll'))
  @HttpCode(HttpStatus.OK)
  @ApiQuery({ name: 'entity_type', required: false, type: String })
  @ApiQuery({ name: 'entity_id', required: false, type: String })
  @ApiQuery({ name: 'actor_id', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
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

  @Get(':id')
  @UseGuards(new AppIdGuard('activityLog.findOne'))
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id') id: string,
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

  @Delete(':id')
  @UseGuards(new AppIdGuard('activityLog.delete'))
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('id') id: string,
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

  @Delete('batch/soft')
  @UseGuards(new AppIdGuard('activityLog.deleteMany'))
  @HttpCode(HttpStatus.OK)
  async deleteMany(
    @Body() body: { ids: string[] },
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

  @Delete(':id/hard')
  @UseGuards(new AppIdGuard('activityLog.hardDelete'))
  @HttpCode(HttpStatus.OK)
  async hardDelete(
    @Param('id') id: string,
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

  @Delete('batch/hard')
  @UseGuards(new AppIdGuard('activityLog.hardDeleteMany'))
  @HttpCode(HttpStatus.OK)
  async hardDeleteMany(
    @Body() body: { ids: string[] },
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
