import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as crypto from 'crypto';
import { promises as dns } from 'dns';

// RFC 5322 simplified — covers practical cases
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const MX_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const mxCache = new Map<string, { ok: boolean; expiresAt: number }>();

export interface EmailValidationResult {
  email: string;
  valid: boolean;
  reason?: 'format' | 'no-mx' | 'dns-error';
}

export interface EmailConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  enabled: boolean;
}

export interface SendEmailOptions {
  to: string | string[];
  cc?: string[];
  subject: string;
  html: string;
  text?: string;
  subjectPrefix?: string;
}

const CONNECTION_TIMEOUT_MS = 10_000;
const SOCKET_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporterCache = new Map<string, Transporter>();

  /**
   * Validate email format only (cheap, synchronous).
   */
  isValidFormat(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    if (email.length > 254) return false;
    return EMAIL_REGEX.test(email.trim());
  }

  /**
   * Validate email by checking format AND that the domain has MX records.
   * Note: this does NOT guarantee the mailbox exists — only that the domain
   * is configured to receive mail. SMTP RCPT-level verification is unreliable
   * (most providers reject it as spam reconnaissance) and is intentionally not used.
   */
  async validateEmail(email: string): Promise<EmailValidationResult> {
    const trimmed = (email ?? '').trim();
    if (!this.isValidFormat(trimmed)) {
      return { email: trimmed, valid: false, reason: 'format' };
    }

    const domain = trimmed.split('@')[1].toLowerCase();

    const cached = mxCache.get(domain);
    const now = Date.now();
    if (cached && cached.expiresAt > now) {
      return cached.ok
        ? { email: trimmed, valid: true }
        : { email: trimmed, valid: false, reason: 'no-mx' };
    }

    try {
      const records = await dns.resolveMx(domain);
      const ok = Array.isArray(records) && records.length > 0;
      mxCache.set(domain, { ok, expiresAt: now + MX_CACHE_TTL_MS });
      return ok
        ? { email: trimmed, valid: true }
        : { email: trimmed, valid: false, reason: 'no-mx' };
    } catch (error) {
      // ENOTFOUND / ENODATA → domain doesn't exist or has no MX
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code === 'ENOTFOUND' || code === 'ENODATA') {
        mxCache.set(domain, { ok: false, expiresAt: now + MX_CACHE_TTL_MS });
        return { email: trimmed, valid: false, reason: 'no-mx' };
      }
      this.logger.warn(`MX lookup failed for ${domain}: ${errMsg(error)}`);
      return { email: trimmed, valid: false, reason: 'dns-error' };
    }
  }

  /**
   * Validate a list of emails in parallel; return only the valid ones.
   */
  async filterValidEmails(emails: string[]): Promise<string[]> {
    const results = await Promise.all(emails.map((e) => this.validateEmail(e)));
    const invalid = results.filter((r) => !r.valid);
    if (invalid.length > 0) {
      this.logger.warn(
        `Dropping ${invalid.length} invalid email(s): ${invalid
          .map((r) => `${r.email}(${r.reason})`)
          .join(', ')}`,
      );
    }
    return results.filter((r) => r.valid).map((r) => r.email);
  }

  /**
   * Get or create a cached transporter for the given SMTP config.
   * Caching avoids re-creating connections per send and lets nodemailer pool reuse sockets.
   */
  private getTransporter(config: EmailConfig): Transporter {
    const key = crypto
      .createHash('sha1')
      .update(`${config.host}|${config.port}|${config.username}|${config.password}`)
      .digest('hex');

    const existing = this.transporterCache.get(key);
    if (existing) return existing;

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      secure: config.port === 465,
      auth: {
        user: config.username,
        pass: config.password,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      connectionTimeout: CONNECTION_TIMEOUT_MS,
      socketTimeout: SOCKET_TIMEOUT_MS,
      greetingTimeout: CONNECTION_TIMEOUT_MS,
    });

    // Verify in background — log only, do not block sends
    transporter
      .verify()
      .then(() => this.logger.log(`SMTP transporter verified for ${config.host}`))
      .catch((err) => this.logger.warn(`SMTP verify failed for ${config.host}: ${errMsg(err)}`));

    this.transporterCache.set(key, transporter);
    return transporter;
  }

  /**
   * Send email using SMTP config (with retry + pooled transporter)
   */
  async sendEmail(config: EmailConfig, options: SendEmailOptions): Promise<boolean> {
    if (!config.enabled) {
      this.logger.debug('Email sending is disabled');
      return false;
    }

    if (!config.host || !config.username || !config.password) {
      this.logger.warn('Email SMTP config incomplete, skipping');
      return false;
    }

    // Validate sender
    const fromAddress = config.from || config.username;
    const fromCheck = await this.validateEmail(fromAddress);
    if (!fromCheck.valid) {
      this.logger.error(
        `Invalid 'from' address ${fromAddress}: ${fromCheck.reason}, aborting send`,
      );
      return false;
    }

    // Validate recipients (to + cc) — drop invalid ones
    const toList = Array.isArray(options.to) ? options.to : [options.to];
    const validTo = await this.filterValidEmails(toList);
    if (validTo.length === 0) {
      this.logger.warn('No valid recipients after validation, skipping send');
      return false;
    }
    const validCc = options.cc ? await this.filterValidEmails(options.cc) : undefined;

    const transporter = this.getTransporter(config);

    const subject = options.subjectPrefix
      ? `${options.subjectPrefix} ${options.subject}`
      : options.subject;

    const recipients = validTo.join(', ');

    const mail = {
      from: fromAddress,
      to: recipients,
      cc: validCc && validCc.length > 0 ? validCc.join(', ') : undefined,
      subject,
      html: options.html,
      text: options.text,
    };

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const info = await transporter.sendMail(mail);
        this.logger.log(
          `Email sent (attempt ${attempt}): ${info.messageId} → ${recipients}`,
        );
        return true;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Email send attempt ${attempt}/${MAX_RETRIES} failed: ${errMsg(error)}`,
        );
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    this.logger.error(
      `Email send failed after ${MAX_RETRIES} attempts: ${errMsg(lastError)}`,
      errStack(lastError),
    );
    return false;
  }

  /**
   * Build HTML for report notification email
   */
  buildReportEmailHtml(params: {
    title: string;
    message: string;
    jobId?: string;
    fileUrl?: string;
    status: 'success' | 'failure';
  }): string {
    const statusColor = params.status === 'success' ? '#28a745' : '#dc3545';
    const statusLabel = params.status === 'success' ? 'Completed' : 'Failed';

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background: ${statusColor}; color: white; padding: 16px 24px;">
      <h2 style="margin: 0;">${params.title}</h2>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 15px; line-height: 1.6;">${params.message}</p>
      <table style="margin-top: 16px; font-size: 14px;">
        <tr><td style="padding: 4px 12px 4px 0; color: #666;">Status:</td><td><strong style="color: ${statusColor};">${statusLabel}</strong></td></tr>
        ${params.jobId ? `<tr><td style="padding: 4px 12px 4px 0; color: #666;">Job ID:</td><td><code>${params.jobId}</code></td></tr>` : ''}
      </table>
      ${params.fileUrl ? `<div style="margin-top: 20px;"><a href="${params.fileUrl}" style="background: #2F5496; color: white; padding: 10px 24px; text-decoration: none; border-radius: 4px;">Download Report</a></div>` : ''}
    </div>
    <div style="background: #f8f9fa; padding: 12px 24px; font-size: 12px; color: #999;">
      Carmen ERP — Automated Report Notification
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Build HTML for generic notification email
   */
  buildNotificationEmailHtml(title: string, message: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
    <div style="background: #2F5496; color: white; padding: 16px 24px;">
      <h2 style="margin: 0;">${title}</h2>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 15px; line-height: 1.6;">${message}</p>
    </div>
    <div style="background: #f8f9fa; padding: 12px 24px; font-size: 12px; color: #999;">
      Carmen ERP — Notification
    </div>
  </div>
</body>
</html>`;
  }
}
