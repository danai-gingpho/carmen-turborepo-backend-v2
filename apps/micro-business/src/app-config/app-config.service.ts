import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { TenantService } from '@/tenant/tenant.service';
import { encryptSecret, decryptSecret, isEncrypted } from '@/common/crypto.util';
import { NotificationService } from '@/common/services/notification.service';

const KEY_REGEX = /^[a-zA-Z0-9_.-]+$/;
const MASK = '***ENCRYPTED***';

// Per-key Zod schemas. Unknown keys are accepted as-is (passthrough JSON).
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

/**
 * Approval flow for PR/PO documents.
 *
 * `approvers` is an ordered list of approval stages. Each stage has one or
 * more candidate user_ids — any one of them approving satisfies the stage.
 *
 * `min_required_last_n` (optional): if set, only the LAST N stages (by order
 * descending) are required for the document to pass — earlier stages become
 * optional shortcuts. Example: 5 stages with min_required_last_n=2 means
 * approving just stages 4 and 5 is enough. Omit (or set to total stage count)
 * to require every stage in sequence.
 */
const ApprovalFlowSchema = z
  .object({
    approvers: z
      .array(
        z.object({
          order: z.number().int().min(1),
          name: z.string().min(1),
          user_ids: z.array(z.string().uuid()).min(1),
        }),
      )
      .min(1),
    min_required_last_n: z.number().int().min(1).optional(),
  })
  .refine(
    (v) => v.min_required_last_n === undefined || v.min_required_last_n <= v.approvers.length,
    { message: 'min_required_last_n must be <= approvers.length' },
  )
  .refine(
    (v) => {
      const orders = v.approvers.map((a) => a.order);
      return new Set(orders).size === orders.length;
    },
    { message: 'approvers.order must be unique' },
  );

/**
 * Print config per document type (PR / PO / GRN / SR / CN / Adjustment).
 * Stored in tb_application_config with key <doc>_print_config.
 */
const PrintConfigSchema = z.object({
  orientation: z.enum(['portrait', 'landscape']).default('portrait'),
});

/**
 * Signature config per document type.
 * Stored in tb_application_config with key <doc>_signature_config.
 * `signatures` is an ordered list (max 5) shown on the printed report footer.
 */
const SignatureConfigSchema = z.object({
  signatures: z
    .array(
      z.object({
        position: z.number().int().min(1),
        user_id: z.string().uuid().optional(),
        name: z.string(),
        label: z.string().min(1),
      }),
    )
    .max(5),
});

@Injectable()
export class AppConfigService {
  private readonly logger = new Logger(AppConfigService.name);

  constructor(
    private readonly tenantService: TenantService,
    private readonly notificationService: NotificationService,
  ) {}

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

  /** Default values for known config keys. Returned when no DB row exists yet. */
  private readonly defaultByKey: Record<string, unknown> = {
    pr_print_config: { orientation: 'portrait' },
    po_print_config: { orientation: 'portrait' },
    grn_print_config: { orientation: 'portrait' },
    sr_print_config: { orientation: 'portrait' },
    cn_print_config: { orientation: 'portrait' },
    adjustment_print_config: { orientation: 'portrait' },
    pr_signature_config: { signatures: [] },
    po_signature_config: { signatures: [] },
    grn_signature_config: { signatures: [] },
    sr_signature_config: { signatures: [] },
    cn_signature_config: { signatures: [] },
    adjustment_signature_config: { signatures: [] },
  };

  /** Validate value with per-key Zod schema. Unknown keys are accepted as-is. */
  private validateValue(key: string, value: unknown): unknown {
    const schemaByKey: Record<string, z.ZodTypeAny> = {
      report_email: ReportEmailSchema,
      pr_approval_flow: ApprovalFlowSchema,
      po_approval_flow: ApprovalFlowSchema,
      pr_print_config: PrintConfigSchema,
      po_print_config: PrintConfigSchema,
      grn_print_config: PrintConfigSchema,
      sr_print_config: PrintConfigSchema,
      cn_print_config: PrintConfigSchema,
      adjustment_print_config: PrintConfigSchema,
      pr_signature_config: SignatureConfigSchema,
      po_signature_config: SignatureConfigSchema,
      grn_signature_config: SignatureConfigSchema,
      sr_signature_config: SignatureConfigSchema,
      cn_signature_config: SignatureConfigSchema,
      adjustment_signature_config: SignatureConfigSchema,
    };

    const schema = schemaByKey[key];
    if (!schema) return value;

    const parsed = schema.safeParse(value);
    if (!parsed.success) {
      throw new Error(
        `Invalid ${key} value: ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    return parsed.data;
  }

  // ─── Endpoints ───

  async list(bu_code: string, user_id: string) {
    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);
    const rows = await prisma.tb_application_config.findMany({
      where: { deleted_at: null },
      orderBy: { key: 'asc' },
      select: {
        id: true,
        key: true,
        value: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
      },
    });
    return rows.map((r) => ({ ...r, value: this.maskSensitiveFields(r.key, r.value) }));
  }

  async get(bu_code: string, user_id: string, key: string) {
    if (!KEY_REGEX.test(key)) throw new Error('Invalid key format');
    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);
    const row = await prisma.tb_application_config.findFirst({
      where: { key, deleted_at: null },
      select: {
        id: true,
        key: true,
        value: true,
        created_at: true,
        created_by_id: true,
        updated_at: true,
        updated_by_id: true,
      },
    });
    if (!row) {
      const defaultValue = this.defaultByKey[key];
      if (defaultValue !== undefined) {
        return { id: null, key, value: defaultValue, created_at: null, created_by_id: null, updated_at: null, updated_by_id: null };
      }
      return null;
    }
    return { ...row, value: this.maskSensitiveFields(row.key, row.value) };
  }

  async upsert(bu_code: string, user_id: string, key: string, value: unknown) {
    if (!KEY_REGEX.test(key)) throw new Error('Invalid key format');
    if (!user_id) throw new Error('user_id is required');

    const validated = this.validateValue(key, value);
    const toStore = this.encryptSensitiveFields(key, validated) as object;

    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);

    const existing = await prisma.tb_application_config.findFirst({
      where: { key, deleted_at: null },
      select: { id: true },
    });

    // Prisma with PostgreSQL @db.Timestamptz requires ISO string, not Date object
    // (see CLAUDE.md § Code Conventions → Timestamps).
    const nowIso = new Date().toISOString();

    const row = existing
      ? await prisma.tb_application_config.update({
          where: { id: existing.id },
          data: {
            value: toStore,
            updated_at: nowIso,
            updated_by_id: user_id,
          },
          select: {
            id: true,
            key: true,
            value: true,
            created_at: true,
            created_by_id: true,
            updated_at: true,
            updated_by_id: true,
          },
        })
      : await prisma.tb_application_config.create({
          data: {
            key,
            value: toStore,
            created_at: nowIso,
            created_by_id: user_id,
          },
          select: {
            id: true,
            key: true,
            value: true,
            created_at: true,
            created_by_id: true,
            updated_at: true,
            updated_by_id: true,
          },
        });

    return { ...row, value: this.maskSensitiveFields(row.key, row.value) };
  }

  async delete(bu_code: string, user_id: string, key: string) {
    if (!KEY_REGEX.test(key)) throw new Error('Invalid key format');
    if (!user_id) throw new Error('user_id is required');

    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);
    const result = await prisma.tb_application_config.updateMany({
      where: { key, deleted_at: null },
      data: { deleted_at: new Date().toISOString(), deleted_by_id: user_id },
    });

    return { deleted: result.count > 0, count: result.count };
  }

  /**
   * Return users eligible to sign on a printed document — read from tb_workflow
   * (active workflows of the mapped type), collect assigned_users from stages
   * whose role is approval-capable (excludes `create` / requestor), dedupe by user_id.
   */
  async getSignatureCandidates(bu_code: string, user_id: string, doc_type: string) {
    // Doc types that have their own workflow use only that workflow's approvers.
    // Doc types without a workflow of their own (GRN/CN/Adjustment) fall back
    // to the union of all approvers across every active workflow in the BU.
    const ALL_WORKFLOWS = [
      'purchase_request_workflow',
      'purchase_order_workflow',
      'store_requisition_workflow',
    ];
    const DOC_TO_WORKFLOWS: Record<string, string[]> = {
      pr: ['purchase_request_workflow'],
      po: ['purchase_order_workflow'],
      sr: ['store_requisition_workflow'],
      grn: ALL_WORKFLOWS,
      cn: ALL_WORKFLOWS,
      adjustment: ALL_WORKFLOWS,
    };
    const workflow_types = DOC_TO_WORKFLOWS[doc_type];
    if (!workflow_types || workflow_types.length === 0) return { candidates: [] };

    const prisma = await this.tenantService.prismaTenantInstance(bu_code, user_id);
    const workflows = await prisma.tb_workflow.findMany({
      where: {
        workflow_type: { in: workflow_types as never[] },
        is_active: true,
        deleted_at: null,
      },
      select: { data: true },
    });

    const SIGNER_ROLES = new Set(['approve', 'purchase']);
    const seen = new Map<string, unknown>();

    for (const wf of workflows) {
      const stages = (wf.data as { stages?: unknown[] } | null)?.stages;
      if (!Array.isArray(stages)) continue;

      for (const stage of stages) {
        const s = stage as { role?: string; assigned_users?: unknown[] };
        if (!s.role || !SIGNER_ROLES.has(s.role)) continue;
        if (!Array.isArray(s.assigned_users)) continue;

        for (const u of s.assigned_users) {
          const user = u as {
            user_id?: string;
            firstname?: string;
            lastname?: string;
            middlename?: string;
            email?: string;
            department?: { id?: string; name?: string };
          };
          if (!user.user_id || seen.has(user.user_id)) continue;
          seen.set(user.user_id, {
            user_id: user.user_id,
            firstname: user.firstname ?? '',
            middlename: user.middlename ?? '',
            lastname: user.lastname ?? '',
            email: user.email ?? '',
            department: user.department ?? null,
          });
        }
      }
    }

    return { candidates: Array.from(seen.values()) };
  }

  /**
   * Internal-only: return the report_email config for a BU with the SMTP password
   * DECRYPTED, ready for micro-notification to feed into nodemailer.
   *
   * Different from `get()`:
   *   - `get()` masks the password (safe for frontend / admin UI).
   *   - This one decrypts the password (never expose over public HTTP; TCP only).
   *
   * Uses `getdb_connection_for_external` so system-initiated callers (cronjobs,
   * micro-notification itself) don't need a real user_id.
   */
  async getReportEmailForSend(bu_code: string) {
    const prisma = await this.tenantService.getdb_connection_for_external(
      bu_code,
      'micro-notification',
    );
    const row = await prisma.tb_application_config.findFirst({
      where: { key: 'report_email', deleted_at: null },
      select: { value: true },
    });
    if (!row) return null;

    const parsed = ReportEmailSchema.safeParse(row.value);
    if (!parsed.success) {
      throw new Error(
        `Invalid report_email for BU ${bu_code}: ${parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ')}`,
      );
    }
    const config = parsed.data;
    if (isEncrypted(config.smtp.password)) {
      config.smtp.password = decryptSecret(config.smtp.password);
    }
    return config;
  }

  /**
   * Send a test email using the current report_email config for this BU.
   * Forwards to micro-notification via the existing HTTP NotificationService client,
   * which loads tb_application_config (report_email), decrypts the SMTP password,
   * and sends the mail through the same flow used in production.
   */
  async testEmail(bu_code: string, user_id: string) {
    try {
      const result = await this.notificationService.sendToBusinessUnit({
        bu_code,
        from_user_id: user_id,
        title: 'Test Email',
        message: `This is a test email from Carmen for business unit ${bu_code}.`,
        type: 'BU_INFO',
        metadata: { source: 'app-config.testEmail' },
      });
      return { sent: result !== null, recipients_count: Array.isArray(result) ? result.length : 0 };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Test email failed for ${bu_code}: ${msg}`);
      return { sent: false, error: msg };
    }
  }
}
