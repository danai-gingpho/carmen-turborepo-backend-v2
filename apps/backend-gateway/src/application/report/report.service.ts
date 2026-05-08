import { Injectable, HttpException } from '@nestjs/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { envConfig } from 'src/libs/config.env';

// ─── Shared types ───────────────────────────────────────────────────────────
interface ReportFilters {
  date_from?: string;
  date_to?: string;
  DateFrom?: string;
  DateTo?: string;
  location_ids?: string[];
  department_ids?: string[];
  vendor_ids?: string[];
  product_ids?: string[];
  category_ids?: string[];
  status?: string[];
  [key: string]: unknown;
}

interface ReportOptions {
  title?: string;
  locale?: string;
  timezone?: string;
  page_size?: string;
  orientation?: string;
  include_summary?: boolean;
  group_by?: string;
  sort_by?: string;
  sort_order?: string;
}

// Controller still expects this shape (file bytes + metadata).
interface GenerateResponse {
  file_content: Buffer;
  file_name: string;
  content_type: string;
  file_size: number;
  row_count: number;
}

interface AsyncResponse {
  job_id: string;
  status?: string;
  message: string;
}

interface ReportTypeInfo {
  report_type: string;
  name: string;
  description: string;
  category: string;
  supported_formats: string[];
}

interface ListTypesResponse {
  types: ReportTypeInfo[];
}

interface ReportTemplateResponse {
  id: string;
  name: string;
  description?: string;
  report_group: string;
  dialog?: string;
  content?: string;
  is_standard: boolean;
  is_active: boolean;
  allow_business_unit?: unknown;
  deny_business_unit?: unknown;
  created_by_name?: string;
  updated_by_name?: string;
}

interface ListReportTemplatesResponse {
  templates: ReportTemplateResponse[];
}

interface JobStatusResponse {
  job_id: string;
  report_type: string;
  format: string | number;
  status: string | number;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  row_count?: number;
  error_message?: string;
}

interface HistoryResponse {
  jobs: JobStatusResponse[];
  total: number;
  page: number;
  per_page: number;
}

interface ScheduleConfig {
  frequency: string;
  time: string;
  days_of_week?: number[];
  days_of_month?: number[];
}

interface ScheduleDelivery {
  type?: string;
  viewer_endpoint?: string;
}

interface ScheduleNotifications {
  web?: boolean;
  email?: boolean;
  mail_source?: 'internal' | 'external';
}

interface ScheduleResponse {
  id: string;
  name: string;
  report_type: string;
  report_template_id?: string;
  format: string;
  cron_expression: string;
  schedule_config?: ScheduleConfig;
  delivery?: ScheduleDelivery;
  notifications?: ScheduleNotifications;
  recipients?: string[];
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
}

interface ListSchedulesResponse {
  schedules: ScheduleResponse[];
}

interface DeleteScheduleResponse {
  success: boolean;
  message: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class ReportService {
  private readonly logger = new BackendLogger(ReportService.name);
  private readonly reportBaseUrl = `http://${envConfig.REPORT_SERVICE_HOST}:${envConfig.REPORT_SERVICE_HTTP_PORT}`;
  private readonly cronjobBaseUrl = envConfig.CRONJOB_SERVICE_URL?.replace(/\/$/, '') ?? '';

  // ─── Internal HTTP helpers ────────────────────────────────────────────────

  private async request<T = unknown>(
    baseUrl: string,
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
      },
      ...init,
    });

    if (!response.ok) {
      const body = await response
        .json()
        .catch(() => ({ message: 'Request failed' }));
      throw new HttpException(
        (body as { error?: string; message?: string }).error ??
          (body as { message?: string }).message ??
          'Request failed',
        response.status,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
    return (await response.text()) as unknown as T;
  }

  private get reportHttp() {
    return <T = unknown>(path: string, init?: RequestInit) =>
      this.request<T>(this.reportBaseUrl, path, init);
  }

  private get cronjobHttp() {
    if (!this.cronjobBaseUrl) {
      throw new HttpException('CRONJOB_SERVICE_URL is not configured', 500);
    }
    return <T = unknown>(path: string, init?: RequestInit) =>
      this.request<T>(this.cronjobBaseUrl, path, init);
  }

  // ─── Report generation ────────────────────────────────────────────────────

  /**
   * Synchronous generate.
   *
   * micro-report returns:
   *  - `application/json` body for format=json (the raw ReportData)
   *  - file bytes with `Content-Disposition` / `X-Row-Count` headers otherwise
   *
   * We preserve the gRPC-era response shape (`GenerateResponse`) so the
   * controller can keep reading `result.file_content`, `result.file_name`, etc.
   */
  async generate(
    user_id: string,
    bu_code: string,
    report_type: string,
    format: string,
    filters?: ReportFilters,
    options?: ReportOptions,
    template_id?: string,
  ): Promise<GenerateResponse> {
    this.logger.debug(
      { function: 'generate', report_type, format, bu_code, user_id },
      ReportService.name,
    );

    const body = {
      report_type,
      format,
      bu_codes: [bu_code],
      filters: filters ?? {},
      options: {
        locale: 'th-TH',
        timezone: 'Asia/Bangkok',
        page_size: 'A4',
        orientation: 'portrait',
        include_summary: true,
        ...options,
      },
      template_id,
    };

    const url = `${this.reportBaseUrl}/api/reports/generate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response
        .json()
        .catch(() => ({ error: 'Generate failed' }));
      throw new HttpException(
        (err as { error?: string }).error ?? 'Generate failed',
        response.status,
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    const rowCount = Number(response.headers.get('x-row-count') ?? 0);

    if (format === 'json' || contentType.includes('application/json')) {
      const text = await response.text();
      const buffer = Buffer.from(text, 'utf-8');
      return {
        file_content: buffer,
        file_name: `${report_type}.json`,
        content_type: 'application/json',
        file_size: buffer.length,
        row_count: rowCount,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const disposition = response.headers.get('content-disposition') ?? '';
    const match = /filename="?([^";]+)"?/.exec(disposition);
    const fileName = match?.[1] ?? `${report_type}.${format}`;

    return {
      file_content: buffer,
      file_name: fileName,
      content_type: contentType || 'application/octet-stream',
      file_size: buffer.length,
      row_count: rowCount,
    };
  }

  async listTypes(category?: string): Promise<ListTypesResponse> {
    this.logger.debug({ function: 'listTypes', category }, ReportService.name);
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const result = await this.reportHttp<{
      total: number;
      types: ReportTypeInfo[];
    }>(`/api/reports/types${query}`);
    return { types: result.types ?? [] };
  }

  /**
   * List templates.
   *
   * micro-report groups templates by `report_group`:
   *   { total, groups: [{ report_group, templates: [...] }] }
   *
   * We flatten here so the controller still works with `result.templates`.
   */
  async listTemplates(
    report_group?: string,
  ): Promise<ListReportTemplatesResponse> {
    this.logger.debug(
      { function: 'listTemplates', report_group },
      ReportService.name,
    );

    const query = report_group
      ? `?report_group=${encodeURIComponent(report_group)}`
      : '';
    const result = await this.reportHttp<{
      total: number;
      groups: Array<{
        report_group: string;
        templates: ReportTemplateResponse[];
      }>;
    }>(`/api/report-templates${query}`);

    const templates = (result.groups ?? []).flatMap((g) =>
      (g.templates ?? []).map((t) => ({
        ...t,
        report_group: t.report_group ?? g.report_group,
      })),
    );

    return { templates };
  }

  async getTemplate(id: string): Promise<ReportTemplateResponse> {
    this.logger.debug({ function: 'getTemplate', id }, ReportService.name);
    return this.reportHttp<ReportTemplateResponse>(
      `/api/report-templates/${encodeURIComponent(id)}`,
    );
  }

  // ─── Async jobs ──────────────────────────────────────────────────────────

  async generateAsync(
    user_id: string,
    bu_code: string,
    report_type: string,
    format: string,
    filters?: ReportFilters,
    options?: ReportOptions,
  ): Promise<AsyncResponse> {
    this.logger.debug(
      { function: 'generateAsync', report_type, format, bu_code, user_id },
      ReportService.name,
    );

    const body = {
      report_type,
      format,
      filters: filters ?? {},
      options: {
        locale: 'th-TH',
        timezone: 'Asia/Bangkok',
        page_size: 'A4',
        orientation: 'portrait',
        include_summary: true,
        ...options,
      },
      user_id,
    };

    return this.reportHttp<AsyncResponse>(
      `/api/${encodeURIComponent(bu_code)}/report/generate-async`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  }

  async getJobStatus(
    user_id: string,
    bu_code: string,
    job_id: string,
  ): Promise<JobStatusResponse> {
    this.logger.debug(
      { function: 'getJobStatus', job_id, user_id },
      ReportService.name,
    );
    return this.reportHttp<JobStatusResponse>(
      `/api/${encodeURIComponent(bu_code)}/report/job-status/${encodeURIComponent(job_id)}`,
    );
  }

  async getHistory(
    user_id: string,
    bu_code: string,
    page?: number,
    per_page?: number,
    report_type?: string,
  ): Promise<HistoryResponse> {
    this.logger.debug(
      { function: 'getHistory', bu_code, page, user_id },
      ReportService.name,
    );

    const params = new URLSearchParams();
    if (page) params.set('page', String(page));
    if (per_page) params.set('per_page', String(per_page));
    if (report_type) params.set('report_type', report_type);
    const query = params.toString() ? `?${params.toString()}` : '';

    const wrapped = await this.reportHttp<{ data: HistoryResponse }>(
      `/api/${encodeURIComponent(bu_code)}/report/history${query}`,
    );
    return wrapped.data;
  }

  // ─── Viewer / data / lookups (already REST on micro-report) ───────────────

  async viewReport(bu_code: string, template_id: string, filters?: unknown) {
    this.logger.debug(
      { function: 'viewReport', bu_code, template_id },
      ReportService.name,
    );
    return this.reportHttp(
      `/api/${encodeURIComponent(bu_code)}/report/viewer`,
      {
        method: 'POST',
        body: JSON.stringify({ template_id, filters: filters ?? {} }),
      },
    );
  }

  async reportData(bu_code: string, template_id: string, filters?: unknown) {
    this.logger.debug(
      { function: 'reportData', bu_code, template_id },
      ReportService.name,
    );
    return this.reportHttp(`/api/${encodeURIComponent(bu_code)}/report/data`, {
      method: 'POST',
      body: JSON.stringify({ template_id, filters: filters ?? {} }),
    });
  }

  /**
   * Resolve which print template to use for a (document_type, bu_code) pair.
   * Wraps micro-report /api/print-template-mappings/resolve so end users can
   * call it via the tenant /api/:bu_code namespace (the /api-system/ admin
   * route is locked behind admin role).
   */
  async resolvePrintTemplate(bu_code: string, document_type: string) {
    this.logger.debug(
      { function: 'resolvePrintTemplate', bu_code, document_type },
      ReportService.name,
    );
    const params = new URLSearchParams({ document_type, bu_code });
    return this.reportHttp(
      `/api/print-template-mappings/resolve?${params.toString()}`,
    );
  }

  async lookups(bu_code: string, types?: string) {
    this.logger.debug(
      { function: 'lookups', bu_code, types },
      ReportService.name,
    );
    const query = types ? `?types=${encodeURIComponent(types)}` : '';
    return this.reportHttp(
      `/api/${encodeURIComponent(bu_code)}/report/lookups${query}`,
    );
  }

  // ─── Schedules (now backed by micro-cronjob) ──────────────────────────────
  // micro-report no longer owns schedules; they live in micro-cronjob as rows in
  // the Cronjob table with job_type="report" and source_service="micro-report".

  async createSchedule(
    user_id: string,
    bu_code: string,
    name: string,
    report_type: string,
    format: string,
    cron_expression?: string,
    filters?: ReportFilters,
    options?: ReportOptions,
    recipients?: string[],
    report_template_id?: string,
    schedule_config?: ScheduleConfig,
    delivery?: ScheduleDelivery,
    notifications?: ScheduleNotifications,
  ): Promise<ScheduleResponse> {
    this.logger.debug(
      { function: 'createSchedule', name, report_type, bu_code, user_id },
      ReportService.name,
    );

    const cron = cron_expression ?? this.cronFromConfig(schedule_config);
    if (!cron) {
      throw new HttpException(
        'Either cron_expression or schedule_config is required',
        400,
      );
    }

    const resolvedDelivery: ScheduleDelivery = {
      type: delivery?.type ?? (format === 'viewer_url' ? 'viewer_url' : 'file'),
      viewer_endpoint: delivery?.viewer_endpoint,
    };

    const resolvedNotifications: ScheduleNotifications = {
      web: notifications?.web ?? false,
      email: notifications?.email ?? false,
      mail_source: notifications?.mail_source ?? 'internal',
    };

    const payload = {
      name,
      description: `Scheduled report: ${report_type}`,
      job_type: 'report',
      cron_expression: cron,
      is_active: true,
      source_service: 'micro-report',
      source_id: report_template_id ?? report_type,
      job_config: {
        template_id: report_template_id,
        bu_codes: [bu_code],
        format,
        filters: filters ?? {},
        options,
        recipients: recipients ?? [],
        user_id,
        delivery: resolvedDelivery,
        notifications: resolvedNotifications,
      },
    };

    const created = await this.cronjobHttp<CronJobResponse>('/api/cronjobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return this.mapCronJobToSchedule(created, bu_code);
  }

  async listSchedules(
    user_id: string,
    bu_code: string,
  ): Promise<ListSchedulesResponse> {
    this.logger.debug(
      { function: 'listSchedules', bu_code, user_id },
      ReportService.name,
    );

    const wrapped = await this.cronjobHttp<{
      data: CronJobResponse[];
      total: number;
    }>('/api/cronjobs');

    const schedules = (wrapped.data ?? [])
      .filter(
        (c) =>
          c.job_type === 'report' &&
          (c.source_service === 'micro-report' || !c.source_service) &&
          (!bu_code ||
            (Array.isArray(c.job_config?.bu_codes)
              ? c.job_config!.bu_codes!.includes(bu_code)
              : true)),
      )
      .map((c) => this.mapCronJobToSchedule(c, bu_code));

    return { schedules };
  }

  async deleteSchedule(
    user_id: string,
    bu_code: string,
    id: string,
  ): Promise<DeleteScheduleResponse> {
    this.logger.debug(
      { function: 'deleteSchedule', id, bu_code, user_id },
      ReportService.name,
    );

    await this.cronjobHttp(`/api/cronjobs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    return { success: true, message: 'Schedule deleted' };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private mapCronJobToSchedule(
    c: CronJobResponse,
    fallbackBuCode: string,
  ): ScheduleResponse {
    const cfg = c.job_config ?? {};
    return {
      id: c.id,
      name: c.name,
      report_type: (cfg.template_id as string) ?? fallbackBuCode,
      report_template_id: cfg.template_id as string | undefined,
      format: (cfg.format as string) ?? 'viewer_url',
      cron_expression: c.cron_expression,
      delivery: cfg.delivery ?? undefined,
      notifications: cfg.notifications ?? undefined,
      recipients: cfg.recipients ?? undefined,
      is_active: c.is_active,
      last_run_at: c.last_run_at,
      next_run_at: c.next_run_at,
    };
  }

  private cronFromConfig(cfg?: ScheduleConfig): string | undefined {
    if (!cfg) return undefined;
    const [hh = '0', mm = '0'] = (cfg.time ?? '0:0').split(':');
    switch (cfg.frequency) {
      case 'daily':
        return `${mm} ${hh} * * *`;
      case 'weekly': {
        const dow = (cfg.days_of_week ?? [1]).join(',');
        return `${mm} ${hh} * * ${dow}`;
      }
      case 'monthly': {
        const dom = (cfg.days_of_month ?? [1]).join(',');
        return `${mm} ${hh} ${dom} * *`;
      }
      default:
        return undefined;
    }
  }
}

// ─── Internal cronjob shape (subset of micro-cronjob.CronJob) ──────────────
interface CronJobResponse {
  id: string;
  name: string;
  description?: string;
  job_type: string;
  cron_expression: string;
  job_config?: {
    template_id?: string;
    bu_codes?: string[];
    format?: string;
    filters?: unknown;
    recipients?: string[];
    delivery?: ScheduleDelivery;
    notifications?: ScheduleNotifications;
  } | null;
  source_service?: string;
  source_id?: string;
  is_active: boolean;
  last_run_at?: string;
  next_run_at?: string;
}
