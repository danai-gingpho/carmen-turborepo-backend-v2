import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { PrismaClient_SYSTEM_CUSTOM } from '@repo/prisma-shared-schema-platform';
import type { PrismaClient } from '@repo/prisma-shared-schema-platform';
import { z } from 'zod';
import { EmailService, type EmailConfig } from '../email/email.service';
import { decryptSecret, isEncrypted } from '../common/crypto.util';

// ─── Zod schema for inline email config (legacy metadata.email_config path) ───
const EmailSmtpSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1),
  password: z.string().min(1),
  from: z.string(),
  enabled: z.boolean(),
});

const NotificationEmailConfigSchema = z.object({
  smtp: EmailSmtpSchema,
  recipients: z.array(z.string().email()).optional(),
  cc: z.array(z.string().email()).optional(),
  subject_prefix: z.string().optional(),
});

export type NotificationEmailConfig = z.infer<typeof NotificationEmailConfigSchema>;

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ─── SMTP config from env (loaded once at startup) ───
function splitCsv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
}

function loadEnvEmailConfig(logger: Logger): NotificationEmailConfig | null {
  const enabled = process.env.SMTP_ENABLED === 'true';
  if (!enabled) return null;

  const host = process.env.SMTP_HOST;
  const username = process.env.SMTP_USERNAME;
  const rawPassword = process.env.SMTP_PASSWORD;
  const portRaw = process.env.SMTP_PORT;
  const from = process.env.SMTP_FROM || username || '';

  if (!host || !username || !rawPassword || !portRaw) {
    logger.warn(
      'SMTP_ENABLED=true but SMTP_HOST / SMTP_USERNAME / SMTP_PASSWORD / SMTP_PORT is missing — email sending disabled.',
    );
    return null;
  }

  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    logger.warn(`Invalid SMTP_PORT: ${portRaw}`);
    return null;
  }

  // SMTP_PASSWORD may be plaintext or AES-GCM ciphertext (enc:v1:...)
  // encrypted with SECRET_ENCRYPTION_KEY — same format used in tb_application_config.
  let password: string;
  if (isEncrypted(rawPassword)) {
    try {
      password = decryptSecret(rawPassword);
    } catch (error) {
      logger.error(
        `Failed to decrypt SMTP_PASSWORD (check SECRET_ENCRYPTION_KEY): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  } else {
    password = rawPassword;
  }

  return {
    smtp: { host, port, username, password, from, enabled: true },
    recipients: splitCsv(process.env.SMTP_RECIPIENTS),
    cc: splitCsv(process.env.SMTP_CC),
    subject_prefix: process.env.SMTP_SUBJECT_PREFIX || undefined,
  };
}

export interface CreateSystemNotificationData {
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  scheduled_at?: Date;
  userIds?: string[];
}

export interface CreateUserNotificationData {
  from_user_id: string;
  to_user_id: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  scheduled_at?: Date;
}

export interface CreateBusinessUnitNotificationData {
  bu_code: string;
  from_user_id?: string;
  title: string;
  message: string;
  type: string;
  metadata?: Record<string, unknown>;
  scheduled_at?: Date;
}

// ─── External mode cache (per-BU report_email fetched via micro-business TCP) ───
const EXTERNAL_CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;
interface ExternalCacheEntry {
  config: NotificationEmailConfig | null;
  expiresAt: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private prismaPromise: Promise<PrismaClient>;
  private readonly envEmailConfig: NotificationEmailConfig | null;
  private readonly externalConfigCache = new Map<string, ExternalCacheEntry>();

  constructor(
    private readonly emailService: EmailService,
    @Inject('BUSINESS_SERVICE')
    private readonly businessClient: ClientProxy,
  ) {
    this.prismaPromise = PrismaClient_SYSTEM_CUSTOM(process.env.SYSTEM_DATABASE_URL!);
    this.envEmailConfig = loadEnvEmailConfig(this.logger);
    if (this.envEmailConfig) {
      this.logger.log(
        `SMTP configured from env (internal): ${this.envEmailConfig.smtp.host}:${this.envEmailConfig.smtp.port} (from=${this.envEmailConfig.smtp.from})`,
      );
    } else {
      this.logger.log('Internal SMTP disabled (SMTP_ENABLED !== "true" or missing required env).');
    }
  }

  private async getPrisma() {
    return this.prismaPromise;
  }

  /**
   * Create a system-wide notification for all or specific users
   */
  async createSystemNotification(data: CreateSystemNotificationData) {
    const prisma = await this.getPrisma();

    let users;
    if (data.userIds && data.userIds.length > 0) {
      users = await prisma.tb_user.findMany({
        where: { id: { in: data.userIds } },
      });
    } else {
      users = await prisma.tb_user.findMany();
    }

    const notifications = [];

    for (const user of users) {
      const notification = await prisma.tb_notification.create({
        data: {
          to_user_id: user.id,
          from_user_id: null,
          title: data.title,
          message: data.message,
          type: data.type,
          category: 'system',
          scheduled_at: data.scheduled_at,
          metadata: data.metadata,
        },
      });
      notifications.push(notification);
    }

    // Send email if metadata has email config
    await this.trySendEmail(data, users.map((u) => u.email).filter(Boolean));

    return notifications;
  }

  /**
   * Create a user-to-user notification
   */
  async createUserNotification(data: CreateUserNotificationData) {
    const prisma = await this.getPrisma();

    const notification = await prisma.tb_notification.create({
      data: {
        to_user_id: data.to_user_id,
        from_user_id: data.from_user_id,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        type: data.type,
        category: 'user-to-user',
        scheduled_at: data.scheduled_at,
      },
    });

    // Send email to recipient
    const user = await prisma.tb_user.findFirst({ where: { id: data.to_user_id } });
    if (user?.email) {
      await this.trySendEmail(data, [user.email]);
    }

    return notification;
  }

  /**
   * Get users belonging to a specific business unit
   */
  async getUsersByBusinessUnitCode(bu_code: string) {
    const prisma = await this.getPrisma();

    const businessUnit = await prisma.tb_business_unit.findFirst({
      where: { code: bu_code },
    });

    if (!businessUnit) {
      return [];
    }

    const userBusinessUnits = await prisma.tb_user_tb_business_unit.findMany({
      where: { business_unit_id: businessUnit.id },
      include: {
        tb_user_tb_user_tb_business_unit_user_idTotb_user: true,
      },
    });

    const users = userBusinessUnits
      .filter((ub) => ub.tb_user_tb_user_tb_business_unit_user_idTotb_user !== null)
      .map((ub) => ub.tb_user_tb_user_tb_business_unit_user_idTotb_user!);

    return users;
  }

  /**
   * Create notifications for all users in a business unit
   */
  async createBusinessUnitNotification(data: CreateBusinessUnitNotificationData) {
    const prisma = await this.getPrisma();

    const users = await this.getUsersByBusinessUnitCode(data.bu_code);
    const notifications = [];

    for (const user of users) {
      const notification = await prisma.tb_notification.create({
        data: {
          to_user_id: user.id,
          from_user_id: data.from_user_id || null,
          title: data.title,
          message: data.message,
          type: data.type,
          category: 'business-unit',
          metadata: {
            ...data.metadata,
            bu_code: data.bu_code,
          },
          scheduled_at: data.scheduled_at,
        },
      });
      notifications.push(notification);
    }

    // Send email to BU users
    const emails = users.map((u) => u.email).filter(Boolean);
    if (emails.length > 0) {
      await this.trySendEmailForBU(data, emails);
    }

    return notifications;
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(user_id: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.findMany({
      where: { to_user_id: user_id, is_read: false },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Mark a single notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.update({
      where: { id: notificationId },
      data: { is_read: true },
    });
  }

  /**
   * Mark all unread notifications as read for a user
   */
  async markAllNotificationsAsRead(user_id: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.updateMany({
      where: { to_user_id: user_id, is_read: false },
      data: { is_read: true },
    });
  }

  /**
   * Get scheduled notifications that are due for sending
   */
  async getScheduledNotifications() {
    const prisma = await this.getPrisma();
    const now = new Date();
    return await prisma.tb_notification.findMany({
      where: { scheduled_at: { lte: now }, is_sent: false },
      include: { tb_user_tb_notification_to_user_idTotb_user: true },
    });
  }

  /**
   * Mark a notification as sent
   */
  async markNotificationAsSent(notificationId: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.update({
      where: { id: notificationId },
      data: { is_sent: true },
    });
  }

  /**
   * Get all users who have unread notifications
   */
  async getUsersWithUnreadNotifications() {
    const prisma = await this.getPrisma();
    return await prisma.tb_user.findMany({
      where: {
        tb_notification_tb_notification_to_user_idTotb_user: {
          some: { is_read: false },
        },
      },
      include: {
        tb_notification_tb_notification_to_user_idTotb_user: {
          where: { is_read: false },
        },
      },
    });
  }

  async getAllUsers() {
    const prisma = await this.getPrisma();
    return await prisma.tb_user.findMany();
  }

  async getUserById(userId: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_user.findFirst({ where: { id: userId } });
  }

  async getAllNotifications(userId: string) {
    const prisma = await this.getPrisma();
    return await prisma.tb_notification.findMany({
      where: { to_user_id: userId },
    });
  }

  async updateUserOnlineStatus(user_id: string, isOnline: boolean) {
    const prisma = await this.getPrisma();
    return await prisma.tb_user
      .update({
        where: { id: user_id },
        data: { is_online: isOnline },
      })
      .catch(() => {});
  }

  // ─── Email Integration ───

  /**
   * Resolve which SMTP config to use for a given notification.
   *
   * Mode is chosen by `metadata.mail_source`:
   *   - `'internal'` (default) → env config (SMTP_* vars)
   *   - `'external'`           → per-BU config from tb_application_config,
   *                              fetched via TCP to micro-business.
   *                              Requires `metadata.bu_code`. Falls back to
   *                              internal if external lookup fails.
   */
  private async resolveEmailConfig(
    metadata?: Record<string, unknown>,
  ): Promise<NotificationEmailConfig | null> {
    const mode = metadata?.mail_source === 'external' ? 'external' : 'internal';

    if (mode === 'external') {
      const buCode = typeof metadata?.bu_code === 'string' ? metadata.bu_code : undefined;
      if (!buCode) {
        this.logger.warn(
          'mail_source=external requires metadata.bu_code; falling back to internal env config',
        );
        return this.envEmailConfig;
      }
      const external = await this.loadExternalEmailConfig(buCode);
      if (external) return external;
      this.logger.warn(
        `External report_email config not available for BU ${buCode}; falling back to internal env config`,
      );
      return this.envEmailConfig;
    }

    return this.envEmailConfig;
  }

  /**
   * Fetch per-BU report_email config from micro-business via TCP. micro-business
   * owns tenant DB access (TenantService) so it can reach tb_application_config
   * regardless of where the tenant schema lives. The returned config already has
   * the SMTP password decrypted — safe to feed directly into nodemailer.
   */
  private async loadExternalEmailConfig(
    buCode: string,
  ): Promise<NotificationEmailConfig | null> {
    const now = Date.now();
    const cached = this.externalConfigCache.get(buCode);
    if (cached && cached.expiresAt > now) {
      return cached.config;
    }

    try {
      const response$ = this.businessClient
        .send<{
          status: number;
          data?: NotificationEmailConfig;
          error?: string;
          details?: string;
        }>(
          { cmd: 'appConfig.getReportEmailForSend', service: 'business' },
          { bu_code: buCode },
        )
        .pipe(timeout(5_000));
      const response = await firstValueFrom(response$);

      if (response.status !== 200 || !response.data) {
        this.logger.warn(
          `External config lookup for BU ${buCode} returned status=${response.status} ${response.error ?? ''} ${response.details ?? ''}`,
        );
        this.externalConfigCache.set(buCode, {
          config: null,
          expiresAt: now + EXTERNAL_CONFIG_CACHE_TTL_MS,
        });
        return null;
      }

      this.externalConfigCache.set(buCode, {
        config: response.data,
        expiresAt: now + EXTERNAL_CONFIG_CACHE_TTL_MS,
      });
      return response.data;
    } catch (error) {
      this.logger.warn(
        `External config lookup for BU ${buCode} failed: ${errMsg(error)}`,
      );
      return null;
    }
  }

  /**
   * Try to send email notification.
   *
   * Picks config via `resolveEmailConfig` (internal env vs external per-BU).
   * If `metadata.notify_email === false`, skip entirely so callers can opt out.
   */
  private async trySendEmail(
    data: { title: string; message: string; metadata?: Record<string, unknown> },
    recipientEmails: string[],
  ) {
    try {
      if (data.metadata?.notify_email === false) return;

      const emailConfig = await this.resolveEmailConfig(data.metadata);
      if (!emailConfig) return;

      const isReport = data.metadata?.source === 'micro-report';
      const metaStatus = data.metadata?.status;
      const status: 'success' | 'failure' =
        metaStatus === 'failure' || metaStatus === 'failed' ? 'failure' : 'success';

      const html = isReport
        ? this.emailService.buildReportEmailHtml({
            title: data.title,
            message: data.message,
            jobId: data.metadata?.job_id as string,
            fileUrl: data.metadata?.file_url as string,
            status,
          })
        : this.emailService.buildNotificationEmailHtml(data.title, data.message);

      const to =
        (emailConfig.recipients?.length ?? 0) > 0
          ? emailConfig.recipients!
          : recipientEmails;

      if (to.length === 0) return;

      await this.emailService.sendEmail(emailConfig.smtp as EmailConfig, {
        to,
        cc: emailConfig.cc,
        subject: data.title,
        subjectPrefix: emailConfig.subject_prefix,
        html,
        text: data.message,
      });
    } catch (error) {
      this.logger.warn(`Email send attempt failed: ${errMsg(error)}`);
    }
  }

  /**
   * Try to send email for BU notification. Uses `bu_code` from the call itself
   * if `metadata.mail_source === 'external'`, otherwise the env config.
   */
  private async trySendEmailForBU(
    data: CreateBusinessUnitNotificationData,
    recipientEmails: string[],
  ) {
    try {
      const metadata = { ...(data.metadata ?? {}), bu_code: data.bu_code };
      const config = await this.resolveEmailConfig(metadata);
      if (!config) return;

      const html = this.emailService.buildNotificationEmailHtml(data.title, data.message);

      const to =
        (config.recipients?.length ?? 0) > 0 ? config.recipients! : recipientEmails;
      if (to.length === 0) return;

      await this.emailService.sendEmail(config.smtp as EmailConfig, {
        to,
        cc: config.cc,
        subject: data.title,
        subjectPrefix: config.subject_prefix,
        html,
        text: data.message,
      });
    } catch (error) {
      this.logger.warn(`BU email send failed: ${errMsg(error)}`);
    }
  }

  /**
   * Invalidate cached external config for a BU (called after admin updates
   * tb_application_config via app-config.service.upsert / delete). Internal env
   * config isn't cached per-BU and isn't affected.
   */
  invalidateBUEmailConfigCache(buCode?: string) {
    if (buCode) {
      this.externalConfigCache.delete(buCode);
    } else {
      this.externalConfigCache.clear();
    }
  }
}
