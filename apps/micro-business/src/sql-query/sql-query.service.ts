import { Injectable, Logger } from '@nestjs/common';
import { TenantService } from '@/tenant/tenant.service';
import { validateSqlSafety } from './sql-validator';

@Injectable()
export class SqlQueryService {
  private readonly logger = new Logger(SqlQueryService.name);

  constructor(private readonly tenantService: TenantService) {}

  async execute(
    bu_code: string,
    user_id: string,
    sql_text: string,
  ): Promise<{
    columns: string[];
    rows: Record<string, unknown>[];
    rowCount: number;
    durationMs: number;
  }> {
    if (!sql_text?.trim()) throw new Error('sql_text is required');
    if (!user_id) throw new Error('user_id is required');

    validateSqlSafety(sql_text, {
      allowedLeading: ['SELECT', 'WITH', 'SHOW', 'EXPLAIN', 'DESCRIBE', 'DESC'],
      allowMultiple: false,
    });

    const trimmed = sql_text.trim().replace(/;\s*$/, '');

    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);

    const runOnce = async (): Promise<Record<string, unknown>[]> => {
      return prisma.$transaction(
        async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL statement_timeout = '30s'`);
          return (await tx.$queryRawUnsafe(trimmed)) as Record<string, unknown>[];
        },
        { timeout: 35000, maxWait: 8000 },
      );
    };

    const start = Date.now();
    let rows: Record<string, unknown>[];
    try {
      rows = await runOnce();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/connection pool|timed out fetching/i.test(msg)) {
        await new Promise((r) => setTimeout(r, 500));
        try {
          rows = await runOnce();
        } catch (err2) {
          const msg2 = err2 instanceof Error ? err2.message : String(err2);
          throw new Error(
            `Database is busy (connection pool exhausted). Please retry in a moment. (${msg2.split('\n')[0]})`,
          );
        }
      } else {
        throw err;
      }
    }
    const durationMs = Date.now() - start;

    const safeRows = rows.map((r) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) {
        out[k] = typeof v === 'bigint' ? v.toString() : v;
      }
      return out;
    });
    const columns = safeRows.length > 0 ? Object.keys(safeRows[0]) : [];

    return { columns, rows: safeRows, rowCount: safeRows.length, durationMs };
  }

  async saveDdl(
    bu_code: string,
    user_id: string,
    input: { name?: string; sql_text: string; query_type: string },
  ): Promise<{
    type: string;
    name: string;
    schema: string;
    executed_sql: string;
  }> {
    if (!user_id) throw new Error('user_id is required');
    if (!input.sql_text?.trim()) throw new Error('sql_text is required');
    if (!input.query_type) throw new Error('query_type is required');

    const queryType = input.query_type;
    if (!['view', 'stored_procedure', 'function'].includes(queryType)) {
      throw new Error(
        'query_type must be one of: view, stored_procedure, function',
      );
    }

    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);

    const stripped = input.sql_text
      .replace(/^\s*(--[^\n]*\n|\/\*[\s\S]*?\*\/)\s*/g, '')
      .trimStart();
    const startsWithCreate =
      /^create\s+(or\s+replace\s+)?(temp(orary)?\s+)?(materialized\s+)?(view|procedure|function)\b/i.test(
        stripped,
      );

    let ddlSql = input.sql_text;
    if (!startsWithCreate) {
      if (queryType === 'view') {
        // Bare SELECT for view — must be a single SELECT/WITH only, no DROP etc.
        validateSqlSafety(input.sql_text, {
          allowedLeading: ['SELECT', 'WITH'],
          allowMultiple: false,
        });
        const safeName = (input.name || '').trim().replace(/"/g, '""');
        if (!safeName) {
          throw new Error('name is required when sql_text is a bare SELECT');
        }
        const body = stripped.replace(/;\s*$/, '');
        ddlSql = `CREATE OR REPLACE VIEW "${safeName}" AS\n${body}`;
      } else {
        throw new Error(
          'Stored procedure/function SQL must start with CREATE OR REPLACE PROCEDURE/FUNCTION. Please write the full DDL.',
        );
      }
    } else {
      // Already CREATE — validate top-level only contains CREATE statements (no DROP injected)
      validateSqlSafety(input.sql_text, {
        allowedLeading: ['CREATE'],
        allowMultiple: true,
      });
    }

    const runDdl = async () => {
      await prisma.$executeRawUnsafe(ddlSql);
    };

    try {
      await runDdl();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/connection pool|timed out fetching/i.test(msg)) {
        await new Promise((r) => setTimeout(r, 500));
        try {
          await runDdl();
        } catch (err2) {
          const msg2 = err2 instanceof Error ? err2.message : String(err2);
          this.logger.error({ function: 'saveDdl', queryType, sql: ddlSql, err: msg2 });
          throw new Error(
            `Database is busy (connection pool exhausted). Please retry in a moment. (${msg2.split('\n')[0]})`,
          );
        }
      } else {
        this.logger.error({ function: 'saveDdl', queryType, sql: ddlSql, err: msg });
        throw new Error(`DDL execution failed: ${msg}`);
      }
    }

    const schemaRow = (await prisma.$queryRawUnsafe(
      `SELECT current_schema()::text AS schema`,
    )) as Array<{ schema: string }>;
    const schema = schemaRow[0]?.schema ?? 'public';

    return {
      type: queryType,
      name: input.name?.trim() || '',
      schema,
      executed_sql: ddlSql,
    };
  }

  async listDbObjects(
    bu_code: string,
    user_id: string,
  ): Promise<{
    tables: Array<{ schema: string; name: string }>;
    views: Array<{ schema: string; name: string }>;
    procedures: Array<{ schema: string; name: string; kind: string }>;
    columns: Array<{ table: string; column: string; data_type: string }>;
  }> {
    if (!user_id) throw new Error('user_id is required');
    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);

    const tables = (await prisma.$queryRawUnsafe(`
      SELECT n.nspname::text AS schema, c.relname::text AS name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r'
        AND n.nspname = current_schema()
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d
          WHERE d.objid = c.oid AND d.deptype = 'e'
        )
      ORDER BY c.relname
    `)) as Array<{ schema: string; name: string }>;

    const views = (await prisma.$queryRawUnsafe(`
      SELECT n.nspname::text AS schema, c.relname::text AS name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'v'
        AND n.nspname = current_schema()
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d
          WHERE d.objid = c.oid AND d.deptype = 'e'
        )
      ORDER BY c.relname
    `)) as Array<{ schema: string; name: string }>;

    const procedures = (await prisma.$queryRawUnsafe(`
      SELECT n.nspname::text AS schema,
             p.proname::text AS name,
             CASE p.prokind WHEN 'p' THEN 'procedure' ELSE 'function' END AS kind
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = current_schema()
        AND p.prokind IN ('p', 'f')
        AND NOT EXISTS (
          SELECT 1 FROM pg_depend d
          WHERE d.objid = p.oid AND d.deptype = 'e'
        )
      ORDER BY p.proname
    `)) as Array<{ schema: string; name: string; kind: string }>;

    const columns = (await prisma.$queryRawUnsafe(`
      SELECT c.relname::text AS "table",
             a.attname::text AS "column",
             format_type(a.atttypid, a.atttypmod)::text AS data_type
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid
      WHERE c.relkind IN ('r', 'v', 'm')
        AND n.nspname = current_schema()
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY c.relname, a.attnum
    `)) as Array<{ table: string; column: string; data_type: string }>;

    return { tables, views, procedures, columns };
  }

  async getDbObjectDefinition(
    bu_code: string,
    user_id: string,
    type: string,
    schema: string,
    name: string,
  ): Promise<{ type: string; schema: string; name: string; definition: string }> {
    if (!user_id) throw new Error('user_id is required');
    if (!schema || !name) throw new Error('schema and name are required');
    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);

    if (type === 'view') {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT pg_get_viewdef(c.oid, true) AS definition
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind = 'v'`,
        schema,
        name,
      )) as Array<{ definition: string }>;
      if (!rows.length) throw new Error('View not found');
      return {
        type,
        schema,
        name,
        definition: `CREATE OR REPLACE VIEW "${schema}"."${name}" AS\n${rows[0].definition}`,
      };
    }

    if (type === 'procedure' || type === 'function') {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT pg_get_functiondef(p.oid) AS definition
         FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
         WHERE n.nspname = $1 AND p.proname = $2
         LIMIT 1`,
        schema,
        name,
      )) as Array<{ definition: string }>;
      if (!rows.length) throw new Error('Procedure/function not found');
      return { type, schema, name, definition: rows[0].definition };
    }

    throw new Error('Unsupported object type');
  }

  async dropDbObject(
    bu_code: string,
    user_id: string,
    type: string,
    schema: string,
    name: string,
  ): Promise<{ dropped: boolean; type: string; schema: string; name: string }> {
    if (!user_id) throw new Error('user_id is required');
    if (!schema || !name) throw new Error('schema and name are required');

    const safeSchema = `"${schema.replace(/"/g, '""')}"`;
    const safeName = `"${name.replace(/"/g, '""')}"`;

    let stmt: string;
    if (type === 'view') {
      stmt = `DROP VIEW IF EXISTS ${safeSchema}.${safeName}`;
    } else if (type === 'procedure') {
      stmt = `DROP PROCEDURE IF EXISTS ${safeSchema}.${safeName}`;
    } else if (type === 'function') {
      stmt = `DROP FUNCTION IF EXISTS ${safeSchema}.${safeName}`;
    } else {
      throw new Error('Unsupported object type');
    }

    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to drop ${type}: ${msg}`);
    }
    return { dropped: true, type, schema, name };
  }
}
