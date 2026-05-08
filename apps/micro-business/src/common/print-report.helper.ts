/**
 * Shared FastReport viewer helper.
 *
 * Each domain module (PO, GRN, SR, …) loads its own entity + builds module-specific
 * header/detail rows. Everything else — template lookup, signature labels, POST to
 * micro-report, viewer URL extraction — is identical, so it lives here.
 *
 * PR uses an inlined version of this same flow inside its service; intentionally
 * not refactored here to avoid touching the existing wired path.
 */

import type { PrismaClient_SYSTEM } from '@repo/prisma-shared-schema-platform';
import { format } from 'date-fns';
import { Result, ErrorCode } from '@/common';

type PrismaSystem = typeof PrismaClient_SYSTEM;

type SignatureBlock = { key: string; label: string; required?: boolean };

export type SignatureNameMap = Record<
  'Sig1Name' | 'Sig2Name' | 'Sig3Name' | 'Sig4Name' | 'Sig5Name',
  string
>;

export interface RenderViaMicroReportInput {
  prismaSystem: PrismaSystem;
  bu_code: string;
  /** Document type discriminator — must match a row in tb_print_template_mapping. */
  documentType: string;
  /** Dataset key prefix used inside `payload.data` (e.g. "PO" → POHeader/PODetail). */
  datasetPrefix: string;
  /**
   * Build the single-row header. Receives the resolved Sig*Name labels so they
   * can be merged into the header object.
   */
  buildHeader: (sig: SignatureNameMap) => Record<string, unknown>;
  /** Build the detail rows. Caller is responsible for ordering. */
  buildDetail: () => Record<string, unknown>[];
}

export interface RenderViaMicroReportResult {
  viewer_url: string;
}

/**
 * Format date as dd/MM/yyyy (FastReport templates' standard).
 */
export function formatReportDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  return format(new Date(d), 'dd/MM/yyyy');
}

/**
 * Resolve the active print template for the given document type, build the
 * payload, and POST it to micro-report's viewer-with-data endpoint.
 */
export async function renderViaMicroReport(
  input: RenderViaMicroReportInput,
): Promise<Result<RenderViaMicroReportResult>> {
  const { prismaSystem, bu_code, documentType, datasetPrefix, buildHeader, buildDetail } = input;

  // 1. Resolve template via tb_print_template_mapping
  const mapping = await prismaSystem.tb_print_template_mapping.findFirst({
    where: {
      document_type: documentType,
      is_active: true,
      deleted_at: null,
    },
    orderBy: [{ is_default: 'desc' }, { display_order: 'asc' }],
  });
  if (!mapping) {
    return Result.error(
      `No active ${documentType} print mapping found`,
      ErrorCode.NOT_FOUND,
    );
  }

  const template = await prismaSystem.tb_report_template.findFirst({
    where: { id: mapping.report_template_id, deleted_at: null },
    select: { id: true, name: true, signature_config: true },
  });
  if (!template) {
    return Result.error(
      `Mapped template ${mapping.report_template_id} not found`,
      ErrorCode.NOT_FOUND,
    );
  }

  // 2. Resolve signature labels from template metadata
  const sigCfg =
    (template.signature_config as { blocks?: SignatureBlock[] } | null) ?? { blocks: [] };
  const sigNames: SignatureNameMap = {
    Sig1Name: '',
    Sig2Name: '',
    Sig3Name: '',
    Sig4Name: '',
    Sig5Name: '',
  };
  for (const b of sigCfg.blocks ?? []) {
    if (b.key in sigNames) {
      sigNames[b.key as keyof SignatureNameMap] = b.label;
    }
  }

  // 3. Build payload
  const headerData = [{ ...buildHeader(sigNames), ...sigNames }];
  const detailData = buildDetail();

  // 4. POST to micro-report
  const reportHost = process.env.REPORT_SERVICE_HOST || '127.0.0.1';
  const reportPort = process.env.REPORT_SERVICE_HTTP_PORT || '6015';
  const reportUrl = `http://${reportHost}:${reportPort}/api/${bu_code}/report/viewer-with-data`;

  const payload = {
    template_name: template.name,
    data: {
      [`${datasetPrefix}Header`]: headerData,
      [`${datasetPrefix}Detail`]: detailData,
    },
  };

  const response = await fetch(reportUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    return Result.error(
      `Report service error: ${response.status} ${errBody}`,
      ErrorCode.INTERNAL,
    );
  }

  const result = (await response.json()) as { url?: string };
  if (!result.url) {
    return Result.error('Report service did not return viewer URL', ErrorCode.INTERNAL);
  }

  return Result.ok({ viewer_url: result.url });
}
