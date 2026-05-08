import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { KeycloakGuard } from 'src/auth/guards/keycloak.guard';
import { BaseHttpController } from '@/common';
import { ExtractRequestHeader } from 'src/common/helpers/extract_header';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { ApiHeaderRequiredXAppId } from 'src/common/decorator/x-app-id.decorator';
import { Config_SqlQueryService } from './config_sql_query.service';

interface SaveDdlBody {
  name?: string;
  sql_text: string;
  query_type: string;
}

@ApiTags('Config: System')
@ApiHeaderRequiredXAppId()
@Controller('api/config/:bu_code/sql-query')
@UseGuards(KeycloakGuard)
@ApiBearerAuth()
export class Config_SqlQueryController extends BaseHttpController {
  private readonly logger: BackendLogger = new BackendLogger(
    Config_SqlQueryController.name,
  );

  constructor(private readonly service: Config_SqlQueryService) {
    super();
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute a read-only SQL statement',
    description: 'Runs a SELECT/WITH/SHOW/EXPLAIN statement against the tenant DB and returns rows + columns.',
    operationId: 'sqlQuery_execute',
    'x-description-th': 'รัน SQL แบบ read-only แล้วคืนผลลัพธ์',
  } as any)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sql_text: { type: 'string', example: 'SELECT * FROM tb_purchase_request LIMIT 10' },
      },
      required: ['sql_text'],
    },
  })
  async execute(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() body: { sql_text: string },
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.service.execute(bu_code, user_id, body?.sql_text);
    this.respond(res, result);
  }

  @Post('save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or replace a view / stored procedure / function',
    description: 'Executes the provided DDL against the tenant schema. For type=view, a bare SELECT will be auto-wrapped with CREATE OR REPLACE VIEW.',
    operationId: 'sqlQuery_save',
    'x-description-th': 'สร้าง / อัปเดต view / stored procedure / function ลง schema ของ tenant',
  } as any)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'v_pr_summary' },
        sql_text: { type: 'string' },
        query_type: { type: 'string', enum: ['view', 'stored_procedure', 'function'] },
      },
      required: ['sql_text', 'query_type'],
    },
  })
  async save(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Body() body: SaveDdlBody,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.service.saveDdl(bu_code, user_id, body);
    this.respond(res, result);
  }

  @Get('db-objects')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List database tables, views, and stored procedures/functions',
    description: 'Returns user-defined tables, views, procedures, functions and their columns from the tenant schema.',
    operationId: 'sqlQuery_listDbObjects',
    'x-description-th': 'แสดงรายการ table / view / stored procedure / function ของ tenant schema',
  } as any)
  async dbObjects(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.service.listDbObjects(bu_code, user_id);
    this.respond(res, result);
  }

  @Get('db-objects/definition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get DDL definition for a view or stored procedure/function',
    description: 'Returns the CREATE OR REPLACE statement for the given object.',
    operationId: 'sqlQuery_getDbObjectDefinition',
    'x-description-th': 'ดู DDL ของ view / stored procedure / function',
  } as any)
  @ApiQuery({ name: 'type', enum: ['view', 'procedure', 'function'] })
  @ApiQuery({ name: 'schema', type: 'string', example: 'public' })
  @ApiQuery({ name: 'name', type: 'string' })
  async dbObjectDefinition(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('type') type: string,
    @Query('schema') schema: string,
    @Query('name') name: string,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.service.getDbObjectDefinition(
      bu_code,
      user_id,
      type,
      schema,
      name,
    );
    this.respond(res, result);
  }

  @Delete('db-objects')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Drop a view or stored procedure/function',
    description: 'Drops the given object from the tenant schema using DROP IF EXISTS.',
    operationId: 'sqlQuery_dropDbObject',
    'x-description-th': 'ลบ view / stored procedure / function',
  } as any)
  @ApiQuery({ name: 'type', enum: ['view', 'procedure', 'function'] })
  @ApiQuery({ name: 'schema', type: 'string' })
  @ApiQuery({ name: 'name', type: 'string' })
  async dropDbObject(
    @Req() req: Request,
    @Res() res: Response,
    @Param('bu_code') bu_code: string,
    @Query('type') type: string,
    @Query('schema') schema: string,
    @Query('name') name: string,
  ): Promise<void> {
    const { user_id } = ExtractRequestHeader(req);
    const result = await this.service.dropDbObject(bu_code, user_id, type, schema, name);
    this.respond(res, result);
  }
}
