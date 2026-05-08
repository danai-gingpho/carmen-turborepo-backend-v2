import { Controller, Logger } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { SqlQueryService } from './sql-query.service';

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

@Controller()
export class SqlQueryController {
  private readonly logger = new Logger(SqlQueryController.name);

  constructor(private readonly sqlQueryService: SqlQueryService) {}

  @MessagePattern({ cmd: 'sqlQuery.execute', service: 'business' })
  async execute(data: { bu_code: string; user_id: string; sql_text: string }) {
    try {
      const result = await this.sqlQueryService.execute(
        data.bu_code,
        data.user_id,
        data.sql_text,
      );
      return { status: 200, data: result };
    } catch (error) {
      return { status: 400, error: 'Failed to execute sql', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'sqlQuery.saveDdl', service: 'business' })
  async saveDdl(data: {
    bu_code: string;
    user_id: string;
    name?: string;
    sql_text: string;
    query_type: string;
  }) {
    try {
      const result = await this.sqlQueryService.saveDdl(
        data.bu_code,
        data.user_id,
        data,
      );
      return { status: 200, data: result };
    } catch (error) {
      return { status: 400, error: 'Failed to save ddl', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'sqlQuery.dbObjects', service: 'business' })
  async dbObjects(data: { bu_code: string; user_id: string }) {
    try {
      const result = await this.sqlQueryService.listDbObjects(
        data.bu_code,
        data.user_id,
      );
      return { status: 200, data: result };
    } catch (error) {
      return { status: 500, error: 'Failed to list db objects', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'sqlQuery.dbObjectDefinition', service: 'business' })
  async dbObjectDefinition(data: {
    bu_code: string;
    user_id: string;
    type: string;
    schema: string;
    name: string;
  }) {
    try {
      const result = await this.sqlQueryService.getDbObjectDefinition(
        data.bu_code,
        data.user_id,
        data.type,
        data.schema,
        data.name,
      );
      return { status: 200, data: result };
    } catch (error) {
      return { status: 400, error: 'Failed to get object definition', details: errMsg(error) };
    }
  }

  @MessagePattern({ cmd: 'sqlQuery.dropDbObject', service: 'business' })
  async dropDbObject(data: {
    bu_code: string;
    user_id: string;
    type: string;
    schema: string;
    name: string;
  }) {
    try {
      const result = await this.sqlQueryService.dropDbObject(
        data.bu_code,
        data.user_id,
        data.type,
        data.schema,
        data.name,
      );
      return { status: 200, data: result };
    } catch (error) {
      return { status: 400, error: 'Failed to drop object', details: errMsg(error) };
    }
  }
}
