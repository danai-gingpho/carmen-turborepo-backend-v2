/**
 * One-off seed for the print pipeline.
 *
 * - Updates existing PR / PO templates: scoping them to bu_code "T03",
 *   filling orientation + signature_config, and removing the legacy
 *   "Landscape" suffix from the displayed name.
 * - Inserts placeholder portrait + landscape templates for the 8 document
 *   types that don't have one yet (GRN, SR, CN, IA, PC, SC, RFQ, INV).
 * - Inserts default print-template mappings (1 per doc_type → portrait variant).
 *
 * Run:
 *   bun run prisma/seed.print-templates.ts
 *
 * Idempotent: existing rows are matched by name + deleted_at IS NULL.
 */

import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

interface DocSpec {
  code: string; // PR, PO, GRN, ... — also used as report_group (kind='print' carries the type signal)
  label: string; // human-friendly title
  signatures: { key: string; label: string; required: boolean }[];
}

// One row per document type. Two templates will be created per row (portrait + landscape).
const DOCS: DocSpec[] = [
  {
    code: 'PR',
    label: 'Purchase Request',
    signatures: [
      { key: 'Sig1Name', label: 'Requestor', required: true },
      { key: 'Sig2Name', label: 'Department Head', required: true },
      { key: 'Sig3Name', label: 'Finance', required: false },
    ],
  },
  {
    code: 'PO',
    label: 'Purchase Order',
    signatures: [
      { key: 'Sig1Name', label: 'Buyer', required: true },
      { key: 'Sig2Name', label: 'Procurement Manager', required: true },
      { key: 'Sig3Name', label: 'Finance', required: false },
    ],
  },
  {
    code: 'GRN',
    label: 'Good Received Note',
    signatures: [
      { key: 'Sig1Name', label: 'Receiver', required: true },
      { key: 'Sig2Name', label: 'Store Keeper', required: true },
      { key: 'Sig3Name', label: 'Approver', required: false },
    ],
  },
  {
    code: 'SR',
    label: 'Store Requisition',
    signatures: [
      { key: 'Sig1Name', label: 'Requestor', required: true },
      { key: 'Sig2Name', label: 'Issuer', required: true },
    ],
  },
  {
    code: 'CN',
    label: 'Credit Note',
    signatures: [
      { key: 'Sig1Name', label: 'Issuer', required: true },
      { key: 'Sig2Name', label: 'Approver', required: true },
    ],
  },
  {
    code: 'IA',
    label: 'Inventory Adjustment',
    signatures: [
      { key: 'Sig1Name', label: 'Adjuster', required: true },
      { key: 'Sig2Name', label: 'Manager', required: true },
    ],
  },
  {
    code: 'PC',
    label: 'Physical Count',
    signatures: [
      { key: 'Sig1Name', label: 'Counted By', required: true },
      { key: 'Sig2Name', label: 'Verified By', required: true },
    ],
  },
  {
    code: 'SC',
    label: 'Spot Check',
    signatures: [
      { key: 'Sig1Name', label: 'Counted By', required: true },
      { key: 'Sig2Name', label: 'Approved By', required: true },
    ],
  },
  {
    code: 'RFQ',
    label: 'Request For Quotation',
    signatures: [
      { key: 'Sig1Name', label: 'Buyer', required: true },
      { key: 'Sig2Name', label: 'Manager', required: true },
    ],
  },
  {
    code: 'INV',
    label: 'Invoice',
    signatures: [
      { key: 'Sig1Name', label: 'Issuer', required: true },
      { key: 'Sig2Name', label: 'Approver', required: false },
    ],
  },
];

const ALLOW_BU = ['T03'];

/**
 * Minimal placeholder FastReport XML. Real layouts are designed in FastReport
 * Designer and uploaded via /report-templates/:id/edit; this skeleton just
 * makes the print pipeline end-to-end testable.
 */
function buildPlaceholderFrx(title: string, orientation: 'portrait' | 'landscape'): string {
  const portraitW = 210;
  const portraitH = 297;
  const w = orientation === 'landscape' ? portraitH : portraitW;
  const h = orientation === 'landscape' ? portraitW : portraitH;
  return `<?xml version="1.0" encoding="utf-8"?>
<Report ScriptLanguage="CSharp">
  <Dictionary>
    <TableDataSource Name="ADMIN_Bu" ReferenceName="ADMIN_Bu.ADMIN_Bu" DataType="System.Int32" Enabled="true">
      <Column Name="Name" DataType="System.String"/>
      <Column Name="BuLogo" DataType="System.Byte[]"/>
    </TableDataSource>
    <TableDataSource Name="DocHeader" ReferenceName="DocHeader.DocHeader" DataType="System.Int32" Enabled="true">
      <Column Name="DocNo" DataType="System.String"/>
      <Column Name="DocDate" DataType="System.String"/>
      <Column Name="Description" DataType="System.String"/>
      <Column Name="Status" DataType="System.String"/>
      <Column Name="Sig1Name" DataType="System.String"/>
      <Column Name="Sig2Name" DataType="System.String"/>
      <Column Name="Sig3Name" DataType="System.String"/>
      <Column Name="Sig4Name" DataType="System.String"/>
      <Column Name="Sig5Name" DataType="System.String"/>
    </TableDataSource>
    <TableDataSource Name="DocDetail" ReferenceName="DocDetail.DocDetail" DataType="System.Int32" Enabled="true">
      <Column Name="No" DataType="System.String"/>
      <Column Name="ProductName" DataType="System.String"/>
      <Column Name="Qty" DataType="System.String"/>
      <Column Name="UnitName" DataType="System.String"/>
      <Column Name="Amount" DataType="System.String"/>
    </TableDataSource>
  </Dictionary>
  <ReportPage Name="Page1" PaperWidth="${w}" PaperHeight="${h}">
    <ReportTitleBand Name="ReportTitle1" Width="718.2" Height="60">
      <TextObject Name="TitleText" Width="718.2" Height="38" Text="${escapeXml(title)}" HorzAlign="Center" Font="Arial, 16pt, style=Bold"/>
      <TextObject Name="BuText" Top="38" Width="718.2" Height="20" Text="[ADMIN_Bu.Name]" HorzAlign="Center"/>
    </ReportTitleBand>
    <PageHeaderBand Name="PageHeader1" Top="64" Width="718.2" Height="40">
      <TextObject Name="HeaderNo" Width="200" Height="20" Text="No: [DocHeader.DocNo]"/>
      <TextObject Name="HeaderDate" Left="200" Width="200" Height="20" Text="Date: [DocHeader.DocDate]"/>
      <TextObject Name="HeaderStatus" Left="400" Width="200" Height="20" Text="Status: [DocHeader.Status]"/>
      <TextObject Name="HeaderDesc" Top="20" Width="600" Height="20" Text="[DocHeader.Description]"/>
    </PageHeaderBand>
    <DataBand Name="Data1" Top="108" Width="718.2" Height="22" DataSource="DocDetail">
      <TextObject Name="DetNo" Width="40" Height="22" Text="[DocDetail.No]" HorzAlign="Center"/>
      <TextObject Name="DetProd" Left="40" Width="380" Height="22" Text="[DocDetail.ProductName]"/>
      <TextObject Name="DetQty" Left="420" Width="80" Height="22" Text="[DocDetail.Qty]" HorzAlign="Right"/>
      <TextObject Name="DetUnit" Left="500" Width="60" Height="22" Text="[DocDetail.UnitName]"/>
      <TextObject Name="DetAmt" Left="560" Width="120" Height="22" Text="[DocDetail.Amount]" HorzAlign="Right"/>
    </DataBand>
    <ReportSummaryBand Name="Summary1" Top="134" Width="718.2" Height="100">
      <TextObject Name="Sig1" Width="240" Height="20" Top="60" Text="[DocHeader.Sig1Name]" HorzAlign="Center"/>
      <TextObject Name="Sig2" Left="240" Width="240" Height="20" Top="60" Text="[DocHeader.Sig2Name]" HorzAlign="Center"/>
      <TextObject Name="Sig3" Left="480" Width="240" Height="20" Top="60" Text="[DocHeader.Sig3Name]" HorzAlign="Center"/>
    </ReportSummaryBand>
  </ReportPage>
</Report>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function upsertTemplate(
  doc: DocSpec,
  orientation: 'portrait' | 'landscape',
): Promise<void> {
  const baseName = `${doc.label} Document`;
  const name = orientation === 'landscape' ? `${baseName} Landscape` : baseName;

  const existing = await prisma.tb_report_template.findFirst({
    where: { name, deleted_at: null },
    select: { id: true, content: true },
  });

  const signatureConfig = { blocks: doc.signatures };

  // Only overwrite content for our placeholder docs (8 new ones); leave PR/PO
  // existing FastReport content alone since those were carefully designed.
  const isExistingPRPO = existing && existing.content && existing.content.length > 5_000;
  const placeholderContent = buildPlaceholderFrx(`${doc.label} (${orientation})`, orientation);

  if (existing) {
    await prisma.tb_report_template.update({
      where: { id: existing.id },
      data: {
        report_group: doc.code,
        kind: 'print',
        orientation,
        signature_config: signatureConfig as never,
        allow_business_unit: ALLOW_BU as never,
        is_active: true,
        ...(isExistingPRPO ? {} : { content: placeholderContent }),
      },
    });
    console.log(`[upd] ${name}`);
    return;
  }

  await prisma.tb_report_template.create({
    data: {
      name,
      description: `${doc.label} print template (${orientation})`,
      report_group: doc.reportGroup,
      dialog: '',
      content: placeholderContent,
      orientation,
      signature_config: signatureConfig as never,
      allow_business_unit: ALLOW_BU as never,
      is_active: true,
      is_standard: true,
      builder_key: `${doc.code.toLowerCase()}-document${orientation === 'landscape' ? '-landscape' : ''}`,
      source_type: 'view',
      source_params: { params: [] } as never,
    },
  });
  console.log(`[new] ${name}`);
}

async function ensureDefaultMapping(doc: DocSpec): Promise<void> {
  const portraitName = `${doc.label} Document`;
  const tpl = await prisma.tb_report_template.findFirst({
    where: { name: portraitName, deleted_at: null },
    select: { id: true },
  });
  if (!tpl) {
    console.warn(`[map] skip ${doc.code} — portrait template not found`);
    return;
  }

  const existing = await prisma.tb_print_template_mapping.findFirst({
    where: {
      document_type: doc.code,
      report_template_id: tpl.id,
      deleted_at: null,
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.tb_print_template_mapping.update({
      where: { id: existing.id },
      data: {
        is_default: true,
        is_active: true,
        display_label: `${doc.label} (Portrait)`,
        allow_business_unit: ALLOW_BU as never,
      },
    });
    console.log(`[map upd] ${doc.code} → ${portraitName}`);
    return;
  }

  await prisma.tb_print_template_mapping.create({
    data: {
      document_type: doc.code,
      report_template_id: tpl.id,
      is_default: true,
      display_label: `${doc.label} (Portrait)`,
      display_order: 0,
      allow_business_unit: ALLOW_BU as never,
      is_active: true,
    },
  });
  console.log(`[map new] ${doc.code} → ${portraitName}`);
}

async function main() {
  console.log(`Seeding ${DOCS.length} document types (portrait + landscape) → bu T03`);
  for (const doc of DOCS) {
    await upsertTemplate(doc, 'portrait');
    await upsertTemplate(doc, 'landscape');
  }
  console.log('Mappings:');
  for (const doc of DOCS) {
    await ensureDefaultMapping(doc);
  }
  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
