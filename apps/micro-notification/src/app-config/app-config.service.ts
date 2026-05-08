import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient_SYSTEM_CUSTOM } from '@repo/prisma-shared-schema-platform';
import type { PrismaClient } from '@repo/prisma-shared-schema-platform';
import { z } from 'zod';
import { encryptSecret, isEncrypted } from '../common/crypto.util';
import { NotificationService } from '../notification/notification.service';

const SCHEMA_NAME_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const KEY_REGEX = /^[a-zA-Z0-9_.-]+$/;
const MASK = '***ENCRYPTED***';

// Per-key Zod schemas. Unknown keys fall back to passthrough JSON.
const ReportEmailSchema = z.object({
  smtp: z.object({
    host: z.string().min(1),
    port: z.number().int().min(1).max(65535),
    username: z.string().min(1),
    password: z.string().min(1),
    from: z.string(),
    enabled: z.boolean(),
  }),
  recipients: z.array(z.string().email()).optional(),
  cc: z.array(z.string().email()).optional(),
  subject_prefix: z.string().optional(),
});

interface AppConfigRow {
  id: string;
  key: string;
  value: unknown;
  created_at: Date;
  created_by_id: string | null;
  updated_at: Date | null;
  updated_by_id: string | null;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);
  private prismaPromise: Promise<PrismaClient>;

  constructor(private readonly notificationService: NotificationService) {
    this.prismaPromise = PrismaClient_SYSTEM_CUSTOM(process.env.SYSTEM_DATABASE_URL!);
  }

  private async getPrisma() {
    return this.prismaPromise;
  }

  /**
   * Resolve tenant schema name from bu_code via tb_business_unit.db_connection.
   * Throws if BU not found or schema name fails regex check.
   */
  private async resolveSchema(bu_code: string): Promise<string> {
    const prisma = await this.getPrisma();
    const bu = await prisma.tb_business_unit.findFirst({ where: { code: bu_code } });
    if (!bu) throw new Error(`Business unit not found: ${bu_code}`);

    const dbConn = bu.db_connection as { schema?: string } | null;
    const schema = dbConn?.schema;
    if (!schema || !SCHEMA_NAME_REGEX.test(schema)) {
      throw new Error(`Invalid tenant schema for BU ${bu_code}`);
    }
    return schema;
  }

  /** Mask password field(s) inside a config value before returning to caller. */
  private maskSensitiveFields(key: string, value: unknown): unknown {
    if (key !== 'report_email' || !value || typeof value !== 'object') return value;
    const v = value as { smtp?: { password?: string } };
    if (v.smtp?.password) {
      return { ...v, smtp: { ...v.smtp, password: MASK } };
    }
    return value;
  }

  /** Encrypt password field(s) before persisting. Skip if already encrypted. */
  private encryptSensitiveFields(key: string, value: unknown): unknown {
    if (key !== 'report_email' || !value || typeof value !== 'object') return value;
    const v = value as { smtp?: { password?: string } };
    if (v.smtp?.password && !isEncrypted(v.smtp.password)) {
      return { ...v, smtp: { ...v.smtp, password: encryptSecret(v.smtp.password) } };
    }
    return value;
  }

  /** Validate value with per-key Zod schema. Unknown keys are accepted as-is. */
  private validateValue(key: string, value: unknown): unknown {
    if (key === 'report_email') {
      const parsed = ReportEmailSchema.safeParse(value);
      if (!parsed.success) {
        throw new Error(
          `Invalid report_email value: ${parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')}`,
        );
      }
      return parsed.data;
    }
    return value;
  }

  // ─── Endpoints ───

  async list(bu_code: string) {
    const schema = await this.resolveSchema(bu_code);
    const prisma = await this.getPrisma();
    const rows = await prisma.$queryRawUnsafe<AppConfigRow[]>(
      `SELECT id, key, value, created_at, created_by_id, updated_at, updated_by_id
         FROM "${schema}".tb_application_config
        WHERE deleted_at IS NULL
        ORDER BY key ASC`,
    );
    return rows.map((r) => ({ ...r, value: this.maskSensitiveFields(r.key, r.value) }));
  }

  async get(bu_code: string, key: string) {
    if (!KEY_REGEX.test(key)) throw new Error('Invalid key format');
    const schema = await this.resolveSchema(bu_code);
    const prisma = await this.getPrisma();
    const rows = await prisma.$queryRawUnsafe<AppConfigRow[]>(
      `SELECT id, key, value, created_at, created_by_id, updated_at, updated_by_id
         FROM "${schema}".tb_application_config
        WHERE key = $1 AND deleted_at IS NULL
        LIMIT 1`,
      key,
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return { ...row, value: this.maskSensitiveFields(row.key, row.value) };
  }

  async upsert(bu_code: string, key: string, value: unknown, user_id: string) {
    if (!KEY_REGEX.test(key)) throw new Error('Invalid key format');
    if (!user_id) throw new Error('user_id is required');

    const validated = this.validateValue(key, value);
    const toStore = this.encryptSensitiveFields(key, validated);

    const schema = await this.resolveSchema(bu_code);
    const prisma = await this.getPrisma();
    const jsonValue = JSON.stringify(toStore);

    const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "${schema}".tb_application_config
        WHERE key = $1 AND deleted_at IS NULL LIMIT 1`,
      key,
    );

    let row: AppConfigRow;
    if (existing.length > 0) {
      const updated = await prisma.$queryRawUnsafe<AppConfigRow[]>(
        `UPDATE "${schema}".tb_application_config
            SET value = $1::jsonb, updated_at = NOW(), updated_by_id = $2
          WHERE id = $3
        RETURNING id, key, value, created_at, created_by_id, updated_at, updated_by_id`,
        jsonValue,
        user_id,
        existing[0].id,
      );
      row = updated[0];
    } else {
      const inserted = await prisma.$queryRawUnsafe<AppConfigRow[]>(
        `INSERT INTO "${schema}".tb_application_config
            (key, value, created_at, created_by_id)
          VALUES ($1, $2::jsonb, NOW(), $3)
        RETURNING id, key, value, created_at, created_by_id, updated_at, updated_by_id`,
        key,
        jsonValue,
        user_id,
      );
      row = inserted[0];
    }

    if (key === 'report_email') {
      this.notificationService.invalidateBUEmailConfigCache(bu_code);
    }

    return { ...row, value: this.maskSensitiveFields(row.key, row.value) };
  }

  async delete(bu_code: string, key: string, user_id: string) {
    if (!KEY_REGEX.test(key)) throw new Error('Invalid key format');
    if (!user_id) throw new Error('user_id is required');

    const schema = await this.resolveSchema(bu_code);
    const prisma = await this.getPrisma();
    const result = await prisma.$executeRawUnsafe(
      `UPDATE "${schema}".tb_application_config
          SET deleted_at = NOW(), deleted_by_id = $1
        WHERE key = $2 AND deleted_at IS NULL`,
      user_id,
      key,
    );

    if (key === 'report_email') {
      this.notificationService.invalidateBUEmailConfigCache(bu_code);
    }

    return { deleted: result > 0 };
  }

  /**
   * Send a test email using the current report_email config for this BU.
   * Re-uses the normal BU notification flow (load config → decrypt → send)
   * so the result mirrors production behavior.
   */
  async testEmail(bu_code: string) {
    try {
      const notifications = await this.notificationService.createBusinessUnitNotification({
        bu_code,
        title: 'Test Email',
        message: `This is a test email from Carmen for business unit ${bu_code}.`,
        type: 'BU_INFO',
        metadata: { source: 'app-config.testEmail' },
      });
      return { sent: true, recipients_count: notifications.length };
    } catch (error) {
      this.logger.warn(`Test email failed for ${bu_code}: ${errMsg(error)}`);
      return { sent: false, error: errMsg(error) };
    }
  }
}
