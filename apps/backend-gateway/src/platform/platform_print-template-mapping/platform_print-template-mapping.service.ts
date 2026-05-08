import { HttpException, Injectable } from '@nestjs/common';
import { BackendLogger } from 'src/common/helpers/backend.logger';
import { envConfig } from 'src/libs/config.env';

interface ListResponse {
  data: PrintTemplateMappingDto[];
  total: number;
}

export interface PrintTemplateMappingDto {
  id: string;
  document_type: string;
  report_template_id: string;
  is_default: boolean;
  display_label?: string | null;
  display_order: number;
  allow_business_unit?: unknown;
  deny_business_unit?: unknown;
  is_active: boolean;
  template_name?: string | null;
  template_group?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  updated_by_name?: string;
}

export interface CreateMappingPayload {
  document_type: string;
  report_template_id: string;
  is_default?: boolean;
  display_label?: string | null;
  display_order?: number;
  allow_business_unit?: unknown;
  deny_business_unit?: unknown;
  is_active?: boolean;
}

export type UpdateMappingPayload = Partial<CreateMappingPayload>;

/**
 * Forwards every call to the micro-report Go service via plain HTTP. Pattern
 * mirrors apps/backend-gateway/src/application/report/report.service.ts.
 */
@Injectable()
export class Platform_PrintTemplateMappingService {
  private readonly logger = new BackendLogger(
    Platform_PrintTemplateMappingService.name,
  );
  private readonly baseUrl = `http://${envConfig.REPORT_SERVICE_HOST}:${envConfig.REPORT_SERVICE_HTTP_PORT}`;

  private async request<T = unknown>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
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
    return (await response.json()) as T;
  }

  async findAll(documentType?: string, activeOnly?: boolean): Promise<ListResponse> {
    const params = new URLSearchParams();
    if (documentType) params.set('document_type', documentType);
    if (activeOnly) params.set('active_only', 'true');
    const qs = params.toString();
    return this.request<ListResponse>(
      `/api/print-template-mappings${qs ? `?${qs}` : ''}`,
    );
  }

  async findOne(id: string): Promise<PrintTemplateMappingDto> {
    return this.request<PrintTemplateMappingDto>(
      `/api/print-template-mappings/${encodeURIComponent(id)}`,
    );
  }

  async listDocumentTypes(): Promise<{
    document_types: { code: string; label: string }[];
  }> {
    return this.request(`/api/print-template-mappings/document-types`);
  }

  async resolve(documentType: string, buCode?: string): Promise<PrintTemplateMappingDto> {
    const params = new URLSearchParams({ document_type: documentType });
    if (buCode) params.set('bu_code', buCode);
    return this.request<PrintTemplateMappingDto>(
      `/api/print-template-mappings/resolve?${params.toString()}`,
    );
  }

  async create(
    body: CreateMappingPayload & { user_id?: string },
  ): Promise<PrintTemplateMappingDto> {
    return this.request<PrintTemplateMappingDto>(
      `/api/print-template-mappings`,
      { method: 'POST', body: JSON.stringify(body) },
    );
  }

  async update(
    id: string,
    body: UpdateMappingPayload & { user_id?: string },
  ): Promise<PrintTemplateMappingDto> {
    return this.request<PrintTemplateMappingDto>(
      `/api/print-template-mappings/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(body) },
    );
  }

  async delete(id: string, userId?: string): Promise<{ message: string }> {
    const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
    return this.request<{ message: string }>(
      `/api/print-template-mappings/${encodeURIComponent(id)}${qs}`,
      { method: 'DELETE' },
    );
  }
}
