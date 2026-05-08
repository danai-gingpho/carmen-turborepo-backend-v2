import { PrismaClient } from '@repo/prisma-shared-schema-platform';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.SYSTEM_DIRECT_URL },
  },
});

// ─── Helper: FastReport XML generator ────────────────────────────────────────

interface ColDef {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date';
  width?: number;
}

interface FilterDef {
  name: string;
  label: string;
}

interface ReportXmlConfig {
  title: string;
  dataSource: string;
  columns: ColDef[];
  filters?: FilterDef[];
  groupBy?: { column: string; label: string };
  landscape?: boolean;
  totals?: string[]; // column names to sum
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function numFmt(decimals = 2): string {
  return `Format="Number" Format.UseLocale="false" Format.DecimalDigits="${decimals}" Format.DecimalSeparator="." Format.GroupSeparator="," Format.NegativePattern="1"`;
}

function dateFmt(): string {
  return `Format="Date" Format.Format="d"`;
}

function generateContentXml(cfg: ReportXmlConfig): string {
  const pageWidth = cfg.landscape ? 1047.06 : 718.2;
  const paperAttrs = cfg.landscape
    ? 'Landscape="true" PaperWidth="297" PaperHeight="210" RawPaperSize="9"'
    : 'RawPaperSize="9"';

  // Calculate column widths
  const totalCols = cfg.columns.length;
  const defaultWidth = Math.floor(pageWidth / totalCols);
  const cols = cfg.columns.map((c) => ({
    ...c,
    w: c.width || (c.type === 'number' ? Math.min(85, defaultWidth) : defaultWidth),
  }));
  // Adjust first column to fill remaining space
  const usedWidth = cols.slice(1).reduce((s, c) => s + c.w, 0);
  cols[0].w = Math.max(100, pageWidth - usedWidth);

  // Build left positions
  const positions: number[] = [];
  let x = 0;
  for (const c of cols) {
    positions.push(parseFloat(x.toFixed(2)));
    x += c.w;
  }

  // Filter/parameter text
  const filterText = (cfg.filters || [])
    .map((f) => `${f.label}: [p_${f.name}]`)
    .join('&#13;&#10;');

  // Totals to compute
  const totalNames = cfg.totals || cols.filter((c) => c.type === 'number').map((c) => c.name);

  // ── Dictionary ──
  let dict = '';
  dict += `    <TableDataSource Name="ADMIN_Bu" ReferenceName="ADMIN_Bu.ADMIN_Bu" DataType="System.Int32" Enabled="true">\n`;
  dict += `      <Column Name="Name" DataType="System.String"/>\n`;
  dict += `    </TableDataSource>\n`;
  dict += `    <TableDataSource Name="${cfg.dataSource}" ReferenceName="${cfg.dataSource}.${cfg.dataSource}" DataType="System.Int32" Enabled="true">\n`;
  for (const c of cfg.columns) {
    dict += `      <Column Name="${c.name}" DataType="System.String"/>\n`;
  }
  dict += `    </TableDataSource>\n`;

  // Parameter totals
  dict += `    <Total Name="Date" Expression="0" Evaluator="Data1"/>\n`;
  for (const f of cfg.filters || []) {
    dict += `    <Total Name="p_${f.name}" Expression="0" Evaluator="Data1"/>\n`;
  }
  for (const t of totalNames) {
    dict += `    <Total Name="Sum_${t}" Expression="0" Evaluator="Data1"/>\n`;
  }
  if (cfg.groupBy) {
    for (const t of totalNames) {
      dict += `    <Total Name="Group_${t}" Expression="0" Evaluator="Data1"/>\n`;
    }
  }

  // ── Column Header Band ──
  let colHeaderObjs = '';
  let textIdx = 100;
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    const align = c.type === 'number' ? ' HorzAlign="Right"' : '';
    colHeaderObjs += `        <TextObject Name="Text${textIdx++}" Left="${positions[i]}" Width="${c.w}" Height="22.68" Text="${escapeXml(c.label)}"${align} VertAlign="Center" Font="Tahoma, 8pt, style=Bold"/>\n`;
  }

  // ── Data Band ──
  let dataObjs = '';
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    const align = c.type === 'number' ? ' HorzAlign="Right"' : '';
    let fmt = '';
    if (c.type === 'number') fmt = ` ${numFmt()}`;
    if (c.type === 'date') fmt = ` ${dateFmt()}`;
    dataObjs += `          <TextObject Name="Text${textIdx++}" Left="${positions[i]}" Top="1.89" Width="${c.w}" Height="18.9" CanGrow="true" Text="[${cfg.dataSource}.${c.name}]"${fmt}${align} WordWrap="false" Font="Tahoma, 8pt"/>\n`;
  }

  // ── Group Footer ──
  let groupHeaderStart = '';
  let groupFooterEnd = '';
  let dataBandTop: number;

  if (cfg.groupBy) {
    const ghTop = 132.08;
    const childTop = ghTop + 30;
    dataBandTop = childTop + 26.68;
    const gfTop = dataBandTop + 26.69;

    let gfObjs = '';
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      if (totalNames.includes(c.name)) {
        gfObjs += `          <TextObject Name="Text${textIdx++}" Left="${positions[i]}" Top="3.78" Width="${c.w}" Height="18.9" Text="[Group_${c.name}]" ${numFmt()} HorzAlign="Right" Font="Tahoma, 8pt, style=Bold"/>\n`;
      }
    }
    gfObjs += `          <TextObject Name="Text${textIdx++}" Left="${positions[0]}" Top="3.78" Width="${cols[0].w}" Height="18.9" Text="Total [${cfg.dataSource}.${cfg.groupBy.column}]" Font="Tahoma, 8pt, style=Bold"/>\n`;

    groupHeaderStart = `      <GroupHeaderBand Name="GroupHeader1" Top="${ghTop}" Width="${pageWidth}" Height="26.46" Border.Lines="Bottom" Fill.Color="WhiteSmoke" Condition="[${cfg.dataSource}.${cfg.groupBy.column}]" SortOrder="None">
        <TextObject Name="Text${textIdx++}" Width="75.6" Height="26.46" Text="${escapeXml(cfg.groupBy.label)}:" VertAlign="Center" Font="Tahoma, 8pt, style=Bold"/>
        <TextObject Name="Text${textIdx++}" Left="75.6" Width="${pageWidth - 75.6}" Height="26.46" Text="[${cfg.dataSource}.${cfg.groupBy.column}]" VertAlign="Center" Font="Tahoma, 8pt"/>
`;

    groupFooterEnd = `        <GroupFooterBand Name="GroupFooter1" Top="${gfTop}" Width="${pageWidth}" Height="26.46" Border.Lines="Top" Border.Style="Dot" Fill.Color="WhiteSmoke">
${gfObjs}        </GroupFooterBand>
      </GroupHeaderBand>
`;
  } else {
    dataBandTop = 158.76;
  }

  // ── Report Summary ──
  const summaryTop = cfg.groupBy ? 300 : 200;
  let summaryObjs = '';
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    if (totalNames.includes(c.name)) {
      summaryObjs += `        <TextObject Name="Text${textIdx++}" Left="${positions[i]}" Top="3.78" Width="${c.w}" Height="18.9" Text="[Sum_${c.name}]" ${numFmt()} HorzAlign="Right" Font="Tahoma, 8pt, style=Bold"/>\n`;
    }
  }
  summaryObjs += `        <TextObject Name="Text${textIdx++}" Left="${positions[0]}" Top="3.78" Width="${cols[0].w}" Height="18.9" Text="Grand Total" Font="Tahoma, 8pt, style=Bold"/>\n`;

  // ── Assemble XML ──
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<Report ScriptLanguage="CSharp">
  <Dictionary>
${dict}  </Dictionary>

  <ReportPage Name="Page1" ${paperAttrs}>
    <PageHeaderBand Name="PageHeader1" Width="${pageWidth}" Height="98.28" Border.Lines="Bottom">
      <PictureObject Name="Picture1" Width="151.2" Height="75.6" DataColumn="ADMIN_Bu.BuLogo"/>
      <TextObject Name="Text1" Left="170.5" Top="2.83" Width="${pageWidth - 340}" Height="28.35" Text="${escapeXml(cfg.title)}" HorzAlign="Center" Font="Tahoma, 16pt"/>
      <TextObject Name="Text2" Top="79.38" Width="302.4" Height="18.9" Text="[ADMIN_Bu.Name]" Font="Tahoma, 8pt"/>
${filterText ? `      <TextObject Name="Text3" Left="${pageWidth - 300}" Top="40" Width="300" Height="56.7" Text="${filterText}" HorzAlign="Right" Font="Tahoma, 8pt"/>\n` : ''}    </PageHeaderBand>
    <ColumnHeaderBand Name="ColumnHeader1" Top="102.28" Width="${pageWidth}" Height="22.68" Border.Lines="Top, Bottom" Fill.Color="WhiteSmoke">
${colHeaderObjs}    </ColumnHeaderBand>
`;

  if (cfg.groupBy) {
    xml += groupHeaderStart;
    xml += `        <DataBand Name="Data1" Top="${dataBandTop}" Width="${pageWidth}" Height="22.68" CanGrow="true">
${dataObjs}        </DataBand>
`;
    xml += groupFooterEnd;
  } else {
    xml += `    <DataBand Name="Data1" Top="${dataBandTop}" Width="${pageWidth}" Height="22.68" CanGrow="true">
${dataObjs}    </DataBand>
`;
  }

  xml += `    <ReportSummaryBand Name="ReportSummary1" Top="${summaryTop}" Width="${pageWidth}" Height="28.35" Border.Lines="Top" Border.Style="Dash">
${summaryObjs}    </ReportSummaryBand>
    <PageFooterBand Name="PageFooter1" Top="${summaryTop + 32}" Width="${pageWidth}" Height="37.8">
      <TextObject Name="Text98" Top="3.78" Width="207.9" Height="22.68" Text="Print On [Date]" ${dateFmt()} AutoWidth="true" VertAlign="Center" Font="Tahoma, 8pt"/>
      <TextObject Name="Text99" Left="${pageWidth - 200}" Top="3.78" Width="200" Height="22.68" Text="Page [Page#] Of [TotalPages#]" HorzAlign="Right" VertAlign="Center" Font="Tahoma, 8pt"/>
    </PageFooterBand>
  </ReportPage>

</Report>`;

  return xml;
}

// ─── Document layout XML generator ───────────────────────────────────────────
//
// For single-document prints (PR/PO/GRN/SR), use this layout instead of the
// list/tabular generator above. It produces a FastReport XML with TWO data
// sources:
//
//   1. <headerDataSource>  — single row holding header values + signature
//                            names/positions (e.g. PRHeader)
//   2. <detailDataSource>  — N rows of line items (e.g. PRDetail)
//
// Layout structure:
//   PageHeader   : logo + document title (e.g. "PURCHASE REQUEST") + BU name
//   ReportTitle  : header field grid (2 columns key/value, e.g. PR No, Date)
//   ColumnHeader : line item column headers
//   Data1        : line item rows (bound to detailDataSource)
//   ReportSummary: totals + signature footer (N signature columns)
//   PageFooter   : print date + page number

interface DocHeaderField {
  key: string;                    // column name in headerDataSource
  label: string;                  // display label
  column?: 'left' | 'right';      // which side of the 2-col grid
  type?: 'string' | 'date' | 'number';
}

interface DocSignature {
  key: string;                    // column in headerDataSource holding the name
  label: string;                  // e.g. "Requested by"
}

interface DocumentXmlConfig {
  title: string;
  headerDataSource: string;
  headerFields: DocHeaderField[];
  detailDataSource: string;
  detailColumns: ColDef[];
  totals?: string[];
  signatures?: DocSignature[];
  landscape?: boolean;
  footerNote?: string;
}

function generateDocumentXml(cfg: DocumentXmlConfig): string {
  const pageWidth = cfg.landscape ? 1047.06 : 718.2;
  const paperAttrs = cfg.landscape
    ? 'Landscape="true" PaperWidth="297" PaperHeight="210" RawPaperSize="9"'
    : 'RawPaperSize="9"';

  // ── Detail column widths (same logic as tabular) ──
  const totalCols = cfg.detailColumns.length;
  const defaultWidth = Math.floor(pageWidth / totalCols);
  const cols = cfg.detailColumns.map((c) => ({
    ...c,
    w: c.width || (c.type === 'number' ? Math.min(85, defaultWidth) : defaultWidth),
  }));
  const usedWidth = cols.slice(1).reduce((s, c) => s + c.w, 0);
  cols[0].w = Math.max(100, pageWidth - usedWidth);

  const positions: number[] = [];
  let x = 0;
  for (const c of cols) {
    positions.push(parseFloat(x.toFixed(2)));
    x += c.w;
  }

  const totalNames = cfg.totals || cols.filter((c) => c.type === 'number').map((c) => c.name);

  // ── Dictionary ──
  let dict = '';
  dict += `    <TableDataSource Name="ADMIN_Bu" ReferenceName="ADMIN_Bu.ADMIN_Bu" DataType="System.Int32" Enabled="true">\n`;
  dict += `      <Column Name="Name" DataType="System.String"/>\n`;
  dict += `      <Column Name="BuLogo" DataType="System.Byte[]"/>\n`;
  dict += `    </TableDataSource>\n`;

  // Header datasource (1 row)
  dict += `    <TableDataSource Name="${cfg.headerDataSource}" ReferenceName="${cfg.headerDataSource}.${cfg.headerDataSource}" DataType="System.Int32" Enabled="true">\n`;
  for (const f of cfg.headerFields) {
    dict += `      <Column Name="${f.key}" DataType="System.String"/>\n`;
  }
  for (const s of cfg.signatures || []) {
    dict += `      <Column Name="${s.key}" DataType="System.String"/>\n`;
  }
  dict += `    </TableDataSource>\n`;

  // Detail datasource (N rows)
  dict += `    <TableDataSource Name="${cfg.detailDataSource}" ReferenceName="${cfg.detailDataSource}.${cfg.detailDataSource}" DataType="System.Int32" Enabled="true">\n`;
  for (const c of cfg.detailColumns) {
    dict += `      <Column Name="${c.name}" DataType="System.String"/>\n`;
  }
  dict += `    </TableDataSource>\n`;

  // Totals
  dict += `    <Total Name="Date" Expression="0" Evaluator="Data1"/>\n`;
  for (const t of totalNames) {
    dict += `    <Total Name="Sum_${t}" Expression="0" Evaluator="Data1"/>\n`;
  }

  // ── Header field grid ──
  // Portrait: 2-column layout (left/right groups stacked vertically)
  // Landscape: inline layout (all fields in a row, wrapping to next row every N fields)
  const rowHeight = 18.9;
  let textIdx = 100;
  let headerObjs = '';
  let headerBandHeight: number;

  if (cfg.landscape) {
    // Landscape: lay out all fields inline, N fields per row
    const allFields = cfg.headerFields;
    const fieldsPerRow = 4; // 4 label+value pairs per row
    const labelWidth = 85;
    const pairWidth = pageWidth / fieldsPerRow;
    const valueWidth = pairWidth - labelWidth - 5;
    const totalRows = Math.ceil(allFields.length / fieldsPerRow);
    headerBandHeight = Math.max(40, totalRows * rowHeight + 15);

    allFields.forEach((f, i) => {
      const row = Math.floor(i / fieldsPerRow);
      const col = i % fieldsPerRow;
      const top = 5 + row * rowHeight;
      const left = col * pairWidth;
      let fmt = '';
      if (f.type === 'number') fmt = ` ${numFmt()}`;
      if (f.type === 'date') fmt = ` ${dateFmt()}`;
      headerObjs += `      <TextObject Name="Text${textIdx++}" Left="${left}" Top="${top}" Width="${labelWidth}" Height="${rowHeight}" Text="${escapeXml(f.label)}:" Font="Tahoma, 8pt, style=Bold"/>\n`;
      headerObjs += `      <TextObject Name="Text${textIdx++}" Left="${left + labelWidth}" Top="${top}" Width="${valueWidth}" Height="${rowHeight}" Text="[${cfg.headerDataSource}.${f.key}]"${fmt} Font="Tahoma, 8pt"/>\n`;
    });
  } else {
    // Portrait: 2-column layout (left/right)
    const labelWidth = 90;
    const valueWidth = pageWidth / 2 - labelWidth - 10;
    const leftFields = cfg.headerFields.filter((f) => f.column !== 'right');
    const rightFields = cfg.headerFields.filter((f) => f.column === 'right');
    const headerRows = Math.max(leftFields.length, rightFields.length);
    headerBandHeight = Math.max(40, headerRows * rowHeight + 20);

    leftFields.forEach((f, i) => {
      const top = 5 + i * rowHeight;
      let fmt = '';
      if (f.type === 'number') fmt = ` ${numFmt()}`;
      if (f.type === 'date') fmt = ` ${dateFmt()}`;
      headerObjs += `      <TextObject Name="Text${textIdx++}" Left="0" Top="${top}" Width="${labelWidth}" Height="${rowHeight}" Text="${escapeXml(f.label)}:" Font="Tahoma, 8pt, style=Bold"/>\n`;
      headerObjs += `      <TextObject Name="Text${textIdx++}" Left="${labelWidth}" Top="${top}" Width="${valueWidth}" Height="${rowHeight}" Text="[${cfg.headerDataSource}.${f.key}]"${fmt} Font="Tahoma, 8pt"/>\n`;
    });
    rightFields.forEach((f, i) => {
      const top = 5 + i * rowHeight;
      const leftBase = pageWidth / 2 + 10;
      let fmt = '';
      if (f.type === 'number') fmt = ` ${numFmt()}`;
      if (f.type === 'date') fmt = ` ${dateFmt()}`;
      headerObjs += `      <TextObject Name="Text${textIdx++}" Left="${leftBase}" Top="${top}" Width="${labelWidth}" Height="${rowHeight}" Text="${escapeXml(f.label)}:" Font="Tahoma, 8pt, style=Bold"/>\n`;
      headerObjs += `      <TextObject Name="Text${textIdx++}" Left="${leftBase + labelWidth}" Top="${top}" Width="${valueWidth}" Height="${rowHeight}" Text="[${cfg.headerDataSource}.${f.key}]"${fmt} Font="Tahoma, 8pt"/>\n`;
    });
  }

  // ── Column header band (line item table) ──
  let colHeaderObjs = '';
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    const align = c.type === 'number' ? ' HorzAlign="Right"' : '';
    colHeaderObjs += `      <TextObject Name="Text${textIdx++}" Left="${positions[i]}" Width="${c.w}" Height="22.68" Text="${escapeXml(c.label)}"${align} VertAlign="Center" Font="Tahoma, 8pt, style=Bold"/>\n`;
  }

  // ── Data band (line items) ──
  let dataObjs = '';
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    const align = c.type === 'number' ? ' HorzAlign="Right"' : '';
    let fmt = '';
    if (c.type === 'number') fmt = ` ${numFmt()}`;
    if (c.type === 'date') fmt = ` ${dateFmt()}`;
    dataObjs += `        <TextObject Name="Text${textIdx++}" Left="${positions[i]}" Top="1.89" Width="${c.w}" Height="18.9" CanGrow="true" Text="[${cfg.detailDataSource}.${c.name}]"${fmt}${align} WordWrap="false" Font="Tahoma, 8pt"/>\n`;
  }

  // ── Report summary: totals + signatures ──
  let summaryObjs = '';
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i];
    if (totalNames.includes(c.name)) {
      summaryObjs += `      <TextObject Name="Text${textIdx++}" Left="${positions[i]}" Top="3.78" Width="${c.w}" Height="18.9" Text="[Sum_${c.name}]" ${numFmt()} HorzAlign="Right" Font="Tahoma, 8pt, style=Bold"/>\n`;
    }
  }
  if (totalNames.length > 0) {
    summaryObjs += `      <TextObject Name="Text${textIdx++}" Left="${positions[0]}" Top="3.78" Width="${cols[0].w}" Height="18.9" Text="Grand Total" Font="Tahoma, 8pt, style=Bold"/>\n`;
  }

  // Signature columns (laid out below totals)
  const sigs = cfg.signatures || [];
  let sigObjs = '';
  if (sigs.length > 0) {
    const sigBlockTop = 35;
    const sigWidth = pageWidth / sigs.length;
    const sigInnerWidth = sigWidth - 20;
    sigs.forEach((s, i) => {
      const left = i * sigWidth + 10;
      // Signature line (60px above the name)
      sigObjs += `      <LineObject Name="Line${textIdx++}" Left="${left + 20}" Top="${sigBlockTop + 60}" Width="${sigInnerWidth - 40}" Height="0" Border.Lines="Top"/>\n`;
      // Name (under the line)
      sigObjs += `      <TextObject Name="Text${textIdx++}" Left="${left}" Top="${sigBlockTop + 65}" Width="${sigInnerWidth}" Height="18" Text="([${cfg.headerDataSource}.${s.key}])" HorzAlign="Center" Font="Tahoma, 8pt"/>\n`;
      // Label (under the name)
      sigObjs += `      <TextObject Name="Text${textIdx++}" Left="${left}" Top="${sigBlockTop + 84}" Width="${sigInnerWidth}" Height="18" Text="${escapeXml(s.label)}" HorzAlign="Center" Font="Tahoma, 8pt, style=Bold"/>\n`;
      // Date placeholder
      sigObjs += `      <TextObject Name="Text${textIdx++}" Left="${left}" Top="${sigBlockTop + 102}" Width="${sigInnerWidth}" Height="18" Text="Date: ____________" HorzAlign="Center" Font="Tahoma, 8pt"/>\n`;
    });
  }

  // Footer note
  let footerNoteObj = '';
  if (cfg.footerNote) {
    const noteTop = 35 + (sigs.length > 0 ? 130 : 0);
    footerNoteObj = `      <TextObject Name="Text${textIdx++}" Left="0" Top="${noteTop}" Width="${pageWidth}" Height="18" Text="${escapeXml(cfg.footerNote)}" HorzAlign="Center" Font="Tahoma, 7pt, style=Italic"/>\n`;
  }

  // ── Band positions ──
  const headerBandTop = 100;
  const colHeaderTop = headerBandTop + headerBandHeight + 5;
  const dataBandTop = colHeaderTop + 26;
  const summaryTop = dataBandTop + 30;
  const summaryHeight = 30 + (sigs.length > 0 ? 130 : 0) + (cfg.footerNote ? 20 : 0);
  const pageFooterTop = summaryTop + summaryHeight + 10;

  // ── Assemble XML ──
  return `<?xml version="1.0" encoding="utf-8"?>
<Report ScriptLanguage="CSharp">
  <Dictionary>
${dict}  </Dictionary>

  <ReportPage Name="Page1" ${paperAttrs}>
    <PageHeaderBand Name="PageHeader1" Width="${pageWidth}" Height="98.28" Border.Lines="Bottom">
      <PictureObject Name="Picture1" Width="151.2" Height="75.6" DataColumn="ADMIN_Bu.BuLogo"/>
      <TextObject Name="Text1" Left="170.5" Top="2.83" Width="${pageWidth - 340}" Height="28.35" Text="${escapeXml(cfg.title)}" HorzAlign="Center" Font="Tahoma, 16pt, style=Bold"/>
      <TextObject Name="Text2" Top="79.38" Width="302.4" Height="18.9" Text="[ADMIN_Bu.Name]" Font="Tahoma, 8pt"/>
    </PageHeaderBand>

    <ReportTitleBand Name="ReportTitle1" Top="${headerBandTop}" Width="${pageWidth}" Height="${headerBandHeight}" Border.Lines="Bottom">
${headerObjs}    </ReportTitleBand>

    <ColumnHeaderBand Name="ColumnHeader1" Top="${colHeaderTop}" Width="${pageWidth}" Height="22.68" Border.Lines="Top, Bottom" Fill.Color="WhiteSmoke">
${colHeaderObjs}    </ColumnHeaderBand>

    <DataBand Name="Data1" Top="${dataBandTop}" Width="${pageWidth}" Height="22.68" CanGrow="true" DataSource="${cfg.detailDataSource}">
${dataObjs}    </DataBand>

    <ReportSummaryBand Name="ReportSummary1" Top="${summaryTop}" Width="${pageWidth}" Height="${summaryHeight}" Border.Lines="Top" Border.Style="Dash">
${summaryObjs}${sigObjs}${footerNoteObj}    </ReportSummaryBand>

    <PageFooterBand Name="PageFooter1" Top="${pageFooterTop}" Width="${pageWidth}" Height="37.8">
      <TextObject Name="Text98" Top="3.78" Width="207.9" Height="22.68" Text="Print On [Date]" ${dateFmt()} AutoWidth="true" VertAlign="Center" Font="Tahoma, 8pt"/>
      <TextObject Name="Text99" Left="${pageWidth - 200}" Top="3.78" Width="200" Height="22.68" Text="Page [Page#] Of [TotalPages#]" HorzAlign="Right" VertAlign="Center" Font="Tahoma, 8pt"/>
    </PageFooterBand>
  </ReportPage>
</Report>`;
}

// ─── Report Template Definitions ─────────────────────────────────────────────

interface ReportTemplate {
  name: string;
  description: string;
  report_group: string;
  is_standard: boolean;
  contentConfig?: ReportXmlConfig;
  documentConfig?: DocumentXmlConfig;
}

const reportTemplates: ReportTemplate[] = [
  // ===================== Purchasing (PR) =====================
  {
    name: 'Purchase Request List Report',
    description:
      'รายงานแสดงข้อมูลของ PR แสดงยอด Summary ของ PR แต่ละใบ โดยเป็นการแสดงข้อมูลตามที่ user บันทึกข้อมูลลงในระบบ',
    report_group: 'PR',
    is_standard: true,
    contentConfig: {
      title: 'Purchase Request List Report',
      dataSource: 'PurchaseRequest',
      columns: [
        { name: 'DocDate', label: 'Date', type: 'date', width: 70 },
        { name: 'PrNo', label: 'PR No.', type: 'string', width: 90 },
        { name: 'Description', label: 'Description', type: 'string', width: 150 },
        { name: 'DepartmentRequest', label: 'Department', type: 'string', width: 100 },
        { name: 'DeliveryDate', label: 'Delivery Date', type: 'date', width: 80 },
        { name: 'PrType', label: 'PR Type', type: 'string', width: 70 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 70 },
        { name: 'TotalAmount', label: 'Total', type: 'number', width: 85 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FStatus', label: 'Status' },
      ],
      groupBy: { column: 'DocStatus', label: 'Status' },
      totals: ['TotalAmount'],
    },
  },
  {
    name: 'Purchase Request Detail Report',
    description:
      'รายงานแสดงข้อมูล PR แสดงรายละเอียด Product, Qty, Tax, Amount โดยเป็นการแสดงข้อมูลตามที่ user บันทึกข้อมูลลงในระบบ',
    report_group: 'PR',
    is_standard: true,
    contentConfig: {
      title: 'Purchase Request Detail Report',
      dataSource: 'PurchaseRequestDetail',
      landscape: true,
      columns: [
        { name: 'LocationCode', label: 'Store Location', type: 'string', width: 120 },
        { name: 'ProductCode', label: 'Product ID', type: 'string', width: 80 },
        { name: 'ProductDesc1', label: 'Description', type: 'string', width: 160 },
        { name: 'OrderQty', label: 'Order Qty', type: 'number', width: 75 },
        { name: 'OrderUnit', label: 'Order Unit', type: 'string', width: 65 },
        { name: 'FocQty', label: 'FOC Qty', type: 'number', width: 65 },
        { name: 'Price', label: 'Price', type: 'number', width: 80 },
        { name: 'Discount', label: 'Discount', type: 'number', width: 70 },
        { name: 'TaxAmt', label: 'Tax', type: 'number', width: 75 },
        { name: 'NetAmt', label: 'Net Amount', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FStatus', label: 'Status' },
      ],
      groupBy: { column: 'PrNo', label: 'PR No' },
      totals: ['OrderQty', 'TaxAmt', 'NetAmt'],
    },
  },
  {
    name: 'Price List Detail by Product Report',
    description:
      'รายงานแสดงข้อมูลรายการที่มีใน Price list โดยนำข้อมูลจากหลายร้านค้ามาเปรียบเทียบกัน เพื่อให้ user review ได้ว่าในช่วงเวลาที่กำหนด vendor ไหนเสนอราคาต่ำที่สุด',
    report_group: 'PR',
    is_standard: true,
    contentConfig: {
      title: 'Price List Detail by Product Report',
      dataSource: 'PriceList',
      landscape: true,
      columns: [
        { name: 'ProductCode', label: 'Product Code', type: 'string', width: 90 },
        { name: 'ProductDesc1', label: 'Product Name', type: 'string', width: 160 },
        { name: 'OrderUnit', label: 'Unit', type: 'string', width: 60 },
        { name: 'VendorCode', label: 'Vendor Code', type: 'string', width: 80 },
        { name: 'VendorName', label: 'Vendor Name', type: 'string', width: 160 },
        { name: 'Price', label: 'Price', type: 'number', width: 80 },
        { name: 'EffectiveDate', label: 'Effective Date', type: 'date', width: 80 },
        { name: 'ExpiryDate', label: 'Expiry Date', type: 'date', width: 80 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FProduct', label: 'Product From' },
        { name: 'TProduct', label: 'Product To' },
      ],
      groupBy: { column: 'ProductCode', label: 'Product' },
      totals: [],
    },
  },

  // ===================== Purchase Order (PO) =====================
  {
    name: 'Order Pending Report',
    description:
      'รายงานแสดงข้อมูล PO ที่ยังค้างรับสินค้า สามารถ Group by Vendor, Product, Location',
    report_group: 'PO',
    is_standard: true,
    contentConfig: {
      title: 'Purchase Order Pending Report',
      dataSource: 'OrderPending',
      landscape: true,
      columns: [
        { name: 'PoNo', label: 'PO No.', type: 'string', width: 80 },
        { name: 'PoDate', label: 'PO Date', type: 'date', width: 70 },
        { name: 'DeliveryDate', label: 'Delivery Date', type: 'date', width: 75 },
        { name: 'ProductDesc1', label: 'Product', type: 'string', width: 160 },
        { name: 'LocationName', label: 'Location', type: 'string', width: 100 },
        { name: 'OrderQty', label: 'Order Qty', type: 'number', width: 70 },
        { name: 'ReceivedQty', label: 'Received', type: 'number', width: 70 },
        { name: 'PendingQty', label: 'Pending', type: 'number', width: 70 },
        { name: 'Price', label: 'Price', type: 'number', width: 75 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 85 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 70 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'VendorName', label: 'Vendor' },
      totals: ['OrderQty', 'ReceivedQty', 'PendingQty', 'Amount'],
    },
  },
  {
    name: 'Purchase Order Detail Report',
    description:
      'รายงานแสดงข้อมูลรายละเอียดของ PO เช่น product, location, qty, tax, amount โดยแสดงข้อมูลตามจริงที่มีการบันทึกลงในระบบ',
    report_group: 'PO',
    is_standard: true,
    contentConfig: {
      title: 'Purchase Order Detail Report',
      dataSource: 'PurchaseOrderDetail',
      landscape: true,
      columns: [
        { name: 'RefPrNo', label: 'Ref PR No.', type: 'string', width: 80 },
        { name: 'LocationCode', label: 'Store Location', type: 'string', width: 110 },
        { name: 'ProductCode', label: 'Product ID', type: 'string', width: 75 },
        { name: 'ProductDesc1', label: 'Description', type: 'string', width: 140 },
        { name: 'OrderQty', label: 'Order Qty', type: 'number', width: 70 },
        { name: 'OrderUnit', label: 'Unit', type: 'string', width: 55 },
        { name: 'FocQty', label: 'FOC', type: 'number', width: 55 },
        { name: 'Price', label: 'Price', type: 'number', width: 75 },
        { name: 'Discount', label: 'Discount', type: 'number', width: 65 },
        { name: 'TaxAmt', label: 'Tax', type: 'number', width: 70 },
        { name: 'NetAmt', label: 'Net Amount', type: 'number', width: 85 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FCategory', label: 'Category' },
        { name: 'FStatus', label: 'Status' },
      ],
      groupBy: { column: 'PoNo', label: 'PO No' },
      totals: ['OrderQty', 'TaxAmt', 'NetAmt'],
    },
  },
  {
    name: 'Purchase Order List Report',
    description:
      'รายงานแสดงข้อมูลของ PO แสดงยอด Summary ของ PO แต่ละใบ โดยเป็นการแสดงข้อมูลตามที่ user บันทึกข้อมูลลงในระบบ',
    report_group: 'PO',
    is_standard: true,
    contentConfig: {
      title: 'Purchase Order List Report',
      dataSource: 'PurchaseOrder',
      columns: [
        { name: 'PoDate', label: 'PO Date', type: 'date', width: 70 },
        { name: 'PoNo', label: 'PO No.', type: 'string', width: 90 },
        { name: 'Description', label: 'Description', type: 'string', width: 130 },
        { name: 'VendorName', label: 'Vendor', type: 'string', width: 120 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 70 },
        { name: 'DeliveryDate', label: 'Delivery Date', type: 'date', width: 75 },
        { name: 'TotalAmount', label: 'Total', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'DocStatus', label: 'Status' },
      totals: ['TotalAmount'],
    },
  },

  // ===================== Receiving (RC) =====================
  {
    name: 'Extra Cost Report',
    description:
      'รายงานแสดงการบันทึก Extra Cost (Landed Cost) ใน Receiving แสดง Receiving No, Product, Qty, Price, Amount, Extra Cost Amt, Status',
    report_group: 'RC',
    is_standard: true,
    contentConfig: {
      title: 'Extra Cost Report',
      dataSource: 'ExtraCost',
      landscape: true,
      columns: [
        { name: 'RecNo', label: 'Receiving No.', type: 'string', width: 90 },
        { name: 'ProductCode', label: 'Product Code', type: 'string', width: 80 },
        { name: 'ProductDesc1', label: 'Product Name', type: 'string', width: 160 },
        { name: 'Qty', label: 'Qty', type: 'number', width: 60 },
        { name: 'Price', label: 'Price', type: 'number', width: 75 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 85 },
        { name: 'ExtraCostAmt', label: 'Extra Cost', type: 'number', width: 85 },
        { name: 'CalcBy', label: 'Calc By', type: 'string', width: 80 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 70 },
        { name: 'CommitDate', label: 'Commit Date', type: 'date', width: 80 },
      ],
      filters: [
        { name: 'FDate', label: 'Receiving Date From' },
        { name: 'TDate', label: 'Receiving Date To' },
      ],
      totals: ['Amount', 'ExtraCostAmt'],
    },
  },
  {
    name: 'Receiving List Report',
    description:
      'รายงานแสดงการทำรับสินค้าแบบ summary แสดง Currency โดยเป็นการแสดงข้อมูลตามที่ user บันทึกข้อมูลลงในระบบ',
    report_group: 'RC',
    is_standard: true,
    contentConfig: {
      title: 'Receiving List Report',
      dataSource: 'ReceivingList',
      landscape: true,
      columns: [
        { name: 'RecNo', label: 'Receiving No.', type: 'string', width: 85 },
        { name: 'RecDate', label: 'Rec. Date', type: 'date', width: 70 },
        { name: 'InvoiceNo', label: 'Inv. No.', type: 'string', width: 75 },
        { name: 'InvoiceDate', label: 'Inv. Date', type: 'date', width: 70 },
        { name: 'VendorName', label: 'Vendor', type: 'string', width: 140 },
        { name: 'CurrencyRate', label: 'Currency', type: 'string', width: 65 },
        { name: 'NetAmt', label: 'Net Amount', type: 'number', width: 85 },
        { name: 'TaxAmt', label: 'Tax', type: 'number', width: 75 },
        { name: 'TotalAmt', label: 'Total', type: 'number', width: 85 },
        { name: 'ExtraCostAmt', label: 'Extra Cost', type: 'number', width: 80 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 70 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'DocStatus', label: 'Status' },
      totals: ['NetAmt', 'TaxAmt', 'TotalAmt', 'ExtraCostAmt'],
    },
  },
  {
    name: 'Receiving Detail Report',
    description:
      'รายงานแสดงรายละเอียดของ Receiving แต่ละใบ แยกตาม Status, Vendor และแสดงรายละเอียด product, location, qty, tax, amount',
    report_group: 'RC',
    is_standard: true,
    contentConfig: {
      title: 'Receiving Detail Report',
      dataSource: 'ReceivingDetail',
      landscape: true,
      columns: [
        { name: 'PoNo', label: 'PO No.', type: 'string', width: 75 },
        { name: 'LocationCode', label: 'Location', type: 'string', width: 90 },
        { name: 'ProductDesc1', label: 'Product', type: 'string', width: 130 },
        { name: 'OrderQty', label: 'Order Qty', type: 'number', width: 65 },
        { name: 'OrderUnit', label: 'O.Unit', type: 'string', width: 50 },
        { name: 'RecQty', label: 'Rec Qty', type: 'number', width: 65 },
        { name: 'RecUnit', label: 'R.Unit', type: 'string', width: 50 },
        { name: 'FocQty', label: 'FOC', type: 'number', width: 50 },
        { name: 'Discount', label: 'Discount', type: 'number', width: 65 },
        { name: 'Price', label: 'Price/Unit', type: 'number', width: 70 },
        { name: 'NetAmt', label: 'Net', type: 'number', width: 75 },
        { name: 'TaxAmt', label: 'Tax', type: 'number', width: 65 },
        { name: 'TotalAmt', label: 'Total', type: 'number', width: 80 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FItemGroup', label: 'Item Group' },
      ],
      groupBy: { column: 'RecNo', label: 'Receiving No' },
      totals: ['RecQty', 'NetAmt', 'TaxAmt', 'TotalAmt'],
    },
  },
  {
    name: 'Receiving Detail Summary by Product Report',
    description:
      'รายงานแสดงสรุปรายละเอียดการทำรับสินค้าแยกตาม Product โดย Location แสดง Product Code, Name, Unit, Qty, Price/Unit, Total',
    report_group: 'RC',
    is_standard: true,
    contentConfig: {
      title: 'Receiving Detail Summary by Product',
      dataSource: 'ReceivingDetailSummary',
      columns: [
        { name: 'ProductCode', label: 'Product Code', type: 'string', width: 100 },
        { name: 'ProductDesc1', label: 'Product Name', type: 'string', width: 200 },
        { name: 'OrderUnit', label: 'Unit', type: 'string', width: 60 },
        { name: 'Qty', label: 'Qty', type: 'number', width: 80 },
        { name: 'PricePerUnit', label: 'Price/Unit', type: 'number', width: 90 },
        { name: 'TotalAmt', label: 'Total', type: 'number', width: 100 },
      ],
      filters: [
        { name: 'FLocation', label: 'Location From' },
        { name: 'TLocation', label: 'Location To' },
      ],
      groupBy: { column: 'LocationCode', label: 'Location' },
      totals: ['Qty', 'TotalAmt'],
    },
  },
  {
    name: 'Top Purchasing Report',
    description:
      'รายงานแสดงรายการสินค้าที่มีการสั่งซื้อมากที่สุด สามารถเลือกได้ 10-100 อันดับ group by vendor (amount) / product (Qty)',
    report_group: 'RC',
    is_standard: true,
    contentConfig: {
      title: 'Top Purchasing Report',
      dataSource: 'TopReceiving',
      columns: [
        { name: 'RowNo', label: 'No.', type: 'string', width: 50 },
        { name: 'VendorName', label: 'Vendor', type: 'string', width: 350 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 120 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'TopN', label: 'Top' },
      ],
      totals: ['Amount'],
    },
  },
  {
    name: 'Purchase Analysis by Item Report',
    description:
      'รายงานแสดงการวิเคราะห์ข้อมูลที่มีการซื้อสินค้า รายการไหน ราคาเท่าไหร่ เข้า location ไหนบ้าง',
    report_group: 'RC',
    is_standard: true,
    contentConfig: {
      title: 'Purchase Analysis by Item Report',
      dataSource: 'PurchaseAnalysis',
      landscape: true,
      columns: [
        { name: 'VendorName', label: 'Vendor', type: 'string', width: 130 },
        { name: 'RecNo', label: 'Rec No.', type: 'string', width: 80 },
        { name: 'RecDate', label: 'Rec Date', type: 'date', width: 70 },
        { name: 'LocationName', label: 'Location', type: 'string', width: 100 },
        { name: 'Qty', label: 'Qty', type: 'number', width: 60 },
        { name: 'UnitCode', label: 'Unit', type: 'string', width: 50 },
        { name: 'PricePerUnit', label: 'Price/Unit', type: 'number', width: 75 },
        { name: 'Discount', label: 'Discount', type: 'number', width: 65 },
        { name: 'NetAmt', label: 'Net', type: 'number', width: 80 },
        { name: 'TaxAmt', label: 'Tax', type: 'number', width: 70 },
        { name: 'TotalAmt', label: 'Total', type: 'number', width: 85 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'ProductCode', label: 'Product' },
      totals: ['Qty', 'NetAmt', 'TaxAmt', 'TotalAmt'],
    },
  },

  // ===================== Credit Note (CR) =====================
  {
    name: 'Credit Note List Report',
    description:
      'รายงานแสดงรายการ CN แบบ summary โดยเป็นการแสดงข้อมูลตามที่ user บันทึกข้อมูลลงในระบบ',
    report_group: 'CR',
    is_standard: true,
    contentConfig: {
      title: 'Credit Note List Report',
      dataSource: 'CreditNoteList',
      landscape: true,
      columns: [
        { name: 'CnDate', label: 'CN Date', type: 'date', width: 70 },
        { name: 'CnNo', label: 'CN No.', type: 'string', width: 85 },
        { name: 'RefNo', label: 'Ref. Doc', type: 'string', width: 80 },
        { name: 'Description', label: 'Description', type: 'string', width: 140 },
        { name: 'VendorName', label: 'Vendor', type: 'string', width: 130 },
        { name: 'CnType', label: 'CN Type', type: 'string', width: 70 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 65 },
        { name: 'NetAmt', label: 'Net Amount', type: 'number', width: 80 },
        { name: 'TaxAmt', label: 'Tax', type: 'number', width: 70 },
        { name: 'TotalAmt', label: 'Total', type: 'number', width: 85 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'DocStatus', label: 'Status' },
      totals: ['NetAmt', 'TaxAmt', 'TotalAmt'],
    },
  },
  {
    name: 'Credit Note Detail Report',
    description:
      'รายงานแสดงรายละเอียดของ CN แต่ละใบ และแสดงรายละเอียด product, location, qty, tax, amount',
    report_group: 'CR',
    is_standard: true,
    contentConfig: {
      title: 'Credit Note Detail Report',
      dataSource: 'CreditNoteDetail',
      landscape: true,
      columns: [
        { name: 'RecNo', label: 'Receiving No.', type: 'string', width: 90 },
        { name: 'LocationName', label: 'Location', type: 'string', width: 130 },
        { name: 'ProductDesc1', label: 'Product', type: 'string', width: 160 },
        { name: 'CnType', label: 'CN Type', type: 'string', width: 70 },
        { name: 'RecQty', label: 'Qty', type: 'number', width: 65 },
        { name: 'NetAmt', label: 'Net Amount', type: 'number', width: 90 },
        { name: 'TaxAmt', label: 'Tax', type: 'number', width: 80 },
        { name: 'TotalAmt', label: 'Total', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'CnNo', label: 'CN No' },
      totals: ['RecQty', 'NetAmt', 'TaxAmt', 'TotalAmt'],
    },
  },

  // ===================== Vendor =====================
  {
    name: 'Vendor List Report',
    description:
      'รายงานแสดงข้อมูลร้านค้า Credit Term, Tax ID, Discount, Rating, Status',
    report_group: 'Vendor',
    is_standard: true,
    contentConfig: {
      title: 'Vendor List Report',
      dataSource: 'VendorList',
      columns: [
        { name: 'VendorCode', label: 'Code', type: 'string', width: 70 },
        { name: 'VendorName', label: 'Vendor Name', type: 'string', width: 200 },
        { name: 'TaxId', label: 'Tax ID', type: 'string', width: 110 },
        { name: 'CreditTerm', label: 'Credit Term', type: 'string', width: 80 },
        { name: 'Discount', label: 'Discount', type: 'number', width: 70 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 70 },
      ],
      filters: [
        { name: 'FVendor', label: 'Vendor From' },
        { name: 'TVendor', label: 'Vendor To' },
      ],
      totals: [],
    },
  },
  {
    name: 'Vendor Detail Report',
    description:
      'รายงานแสดงข้อมูลของร้านค้า ที่อยู่ เบอร์ติดต่อ เครดิต Category, Telephone, Fax, Status',
    report_group: 'Vendor',
    is_standard: true,
    contentConfig: {
      title: 'Vendor Detail Report',
      dataSource: 'VendorDetail',
      columns: [
        { name: 'VendorCode', label: 'Code', type: 'string', width: 70 },
        { name: 'VendorName', label: 'Vendor Name', type: 'string', width: 140 },
        { name: 'VendorCategory', label: 'Category', type: 'string', width: 90 },
        { name: 'TaxId', label: 'Tax ID', type: 'string', width: 100 },
        { name: 'Telephone', label: 'Telephone', type: 'string', width: 90 },
        { name: 'Fax', label: 'Fax', type: 'string', width: 80 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 60 },
      ],
      filters: [
        { name: 'FVendor', label: 'Vendor From' },
        { name: 'TVendor', label: 'Vendor To' },
      ],
      totals: [],
    },
  },

  // ===================== Product =====================
  {
    name: 'Product List Report',
    description:
      'รายงานแสดง list ของสินค้า และแสดงข้อมูล Product, Inventory Unit, Order Unit, Last Cost, Status',
    report_group: 'Product',
    is_standard: true,
    contentConfig: {
      title: 'Product List Report',
      dataSource: 'ProductList',
      landscape: true,
      columns: [
        { name: 'ProductCode', label: 'Product ID', type: 'string', width: 80 },
        { name: 'ProductDesc1', label: 'Name (EN)', type: 'string', width: 130 },
        { name: 'ProductDesc2', label: 'Name (Local)', type: 'string', width: 120 },
        { name: 'CategoryName', label: 'Category', type: 'string', width: 90 },
        { name: 'SubCategoryName', label: 'Sub Category', type: 'string', width: 90 },
        { name: 'ItemGroupName', label: 'Item Group', type: 'string', width: 90 },
        { name: 'InventoryUnit', label: 'Inv. Unit', type: 'string', width: 60 },
        { name: 'OrderUnit', label: 'Ord. Unit', type: 'string', width: 60 },
        { name: 'LastCost', label: 'Last Cost', type: 'number', width: 80 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 60 },
      ],
      filters: [
        { name: 'FProduct', label: 'Product From' },
        { name: 'TProduct', label: 'Product To' },
      ],
      totals: [],
    },
  },
  {
    name: 'Product Category Report',
    description:
      'รายงานแสดงข้อมูลหมวดหมู่สินค้า Category, Sub Category, Item Group ว่าแต่ละ Item Group มี Product อะไรบ้าง',
    report_group: 'Product',
    is_standard: true,
    contentConfig: {
      title: 'Product Category Report',
      dataSource: 'ProductCategory',
      columns: [
        { name: 'ProductCode', label: 'Product Code', type: 'string', width: 90 },
        { name: 'ProductDesc1', label: 'Product Name', type: 'string', width: 200 },
        { name: 'ItemGroupName', label: 'Item Group', type: 'string', width: 120 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 70 },
      ],
      filters: [],
      groupBy: { column: 'CategoryName', label: 'Category' },
      totals: [],
    },
  },

  // ===================== Store Requisition (SR) =====================
  {
    name: 'Store Requisition Detail Report',
    description:
      'รายงานแสดงรายละเอียดของ SR แต่ละใบ เช่น product, location from, location to, qty, amount สามารถเลือก filter movement type ได้',
    report_group: 'SR',
    is_standard: true,
    contentConfig: {
      title: 'Store Requisition Detail Report',
      dataSource: 'StoreRequisition',
      landscape: true,
      columns: [
        { name: 'SrNo', label: 'SR No.', type: 'string', width: 80 },
        { name: 'SrDate', label: 'Date', type: 'date', width: 70 },
        { name: 'ProductDesc1', label: 'Product', type: 'string', width: 150 },
        { name: 'LocationFrom', label: 'From Location', type: 'string', width: 100 },
        { name: 'LocationTo', label: 'To Location', type: 'string', width: 100 },
        { name: 'MovementType', label: 'Movement', type: 'string', width: 70 },
        { name: 'Qty', label: 'Qty', type: 'number', width: 65 },
        { name: 'UnitCode', label: 'Unit', type: 'string', width: 50 },
        { name: 'CostPerUnit', label: 'Cost/Unit', type: 'number', width: 75 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 85 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 65 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FMovementType', label: 'Movement Type' },
        { name: 'FStatus', label: 'Status' },
      ],
      groupBy: { column: 'SrNo', label: 'SR No' },
      totals: ['Qty', 'Amount'],
    },
  },
  {
    name: 'Requisition Cost Summary Report',
    description:
      'รายงานเพื่อตรวจสอบการบันทึก cost หรือ inventory โดยดูว่าข้อมูลถูกกระจายไปที่ location ใดบ้าง',
    report_group: 'SR',
    is_standard: true,
    contentConfig: {
      title: 'Requisition Cost Summary Report',
      dataSource: 'CostSummary',
      columns: [
        { name: 'LocationName', label: 'Location', type: 'string', width: 150 },
        { name: 'ItemGroupName', label: 'Item Group', type: 'string', width: 130 },
        { name: 'ReceivingAmt', label: 'Receiving', type: 'number', width: 90 },
        { name: 'CreditNoteAmt', label: 'Credit Note', type: 'number', width: 90 },
        { name: 'SrIssueAmt', label: 'SR-Issue', type: 'number', width: 90 },
        { name: 'TotalAmt', label: 'Total', type: 'number', width: 100 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FLocation', label: 'Location From' },
        { name: 'TLocation', label: 'Location To' },
      ],
      groupBy: { column: 'LocationName', label: 'Location' },
      totals: ['ReceivingAmt', 'CreditNoteAmt', 'SrIssueAmt', 'TotalAmt'],
    },
  },
  {
    name: 'Store Requisition List Report',
    description:
      'รายงานแสดงรายการ SR แบบ summary Group by location โดยเป็นการแสดงข้อมูลตามที่ user บันทึกข้อมูลลงในระบบ',
    report_group: 'SR',
    is_standard: true,
    contentConfig: {
      title: 'Store Requisition List Report',
      dataSource: 'StoreRequisitionList',
      columns: [
        { name: 'SrDate', label: 'Date', type: 'date', width: 70 },
        { name: 'SrNo', label: 'SR No.', type: 'string', width: 100 },
        { name: 'Description', label: 'Description', type: 'string', width: 180 },
        { name: 'MovementType', label: 'Movement', type: 'string', width: 80 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 70 },
        { name: 'TotalAmount', label: 'Total', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'LocationName', label: 'Location' },
      totals: ['TotalAmount'],
    },
  },
  {
    name: 'Issue Detail Report',
    description:
      'รายงานแสดงรายละเอียดของ SR (Issue) แต่ละใบ เช่น product, location from, location to, qty, amount สามารถเลือก filter movement type ได้',
    report_group: 'SR',
    is_standard: true,
    contentConfig: {
      title: 'Issue Detail Report',
      dataSource: 'IssueDetail',
      landscape: true,
      columns: [
        { name: 'SrNo', label: 'SR No.', type: 'string', width: 80 },
        { name: 'CommitDate', label: 'Commit Date', type: 'date', width: 75 },
        { name: 'ProductDesc1', label: 'Product', type: 'string', width: 150 },
        { name: 'LocationFrom', label: 'From', type: 'string', width: 100 },
        { name: 'LocationTo', label: 'To', type: 'string', width: 100 },
        { name: 'MovementType', label: 'Movement', type: 'string', width: 70 },
        { name: 'Qty', label: 'Qty', type: 'number', width: 65 },
        { name: 'UnitCode', label: 'Unit', type: 'string', width: 50 },
        { name: 'CostPerUnit', label: 'Cost/Unit', type: 'number', width: 75 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 85 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FMovementType', label: 'Movement Type' },
      ],
      groupBy: { column: 'SrNo', label: 'SR No' },
      totals: ['Qty', 'Amount'],
    },
  },
  {
    name: 'Store Requisition Summary by Cost Report',
    description:
      'รายงานแสดงสรุปยอดต้นทุนแยกตาม Location และ Item Group แสดง Receiving, Credit Note, SR-Issue, Total',
    report_group: 'SR',
    is_standard: true,
    contentConfig: {
      title: 'Direct Cost Summary Report',
      dataSource: 'DirectCostSummary',
      columns: [
        { name: 'LocationName', label: 'Location', type: 'string', width: 140 },
        { name: 'ItemGroupName', label: 'Item Group', type: 'string', width: 130 },
        { name: 'ReceivingAmt', label: 'Receiving', type: 'number', width: 100 },
        { name: 'CreditNoteAmt', label: 'Credit Note', type: 'number', width: 100 },
        { name: 'SrIssueAmt', label: 'SR-Issue', type: 'number', width: 100 },
        { name: 'TotalAmt', label: 'Total', type: 'number', width: 100 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'LocationName', label: 'Location' },
      totals: ['ReceivingAmt', 'CreditNoteAmt', 'SrIssueAmt', 'TotalAmt'],
    },
  },

  // ===================== Stock In (SI) =====================
  {
    name: 'Stock In Detail Report',
    description:
      'รายงานแสดงรายละเอียดของ Stock In แต่ละใบ เช่น product, location, qty, amount Group by Movement Type',
    report_group: 'SI',
    is_standard: true,
    contentConfig: {
      title: 'Stock In Detail Report',
      dataSource: 'StockIn',
      landscape: true,
      columns: [
        { name: 'DocNo', label: 'Doc No.', type: 'string', width: 90 },
        { name: 'DocDate', label: 'Date', type: 'date', width: 70 },
        { name: 'ProductCode', label: 'Product Code', type: 'string', width: 80 },
        { name: 'ProductDesc1', label: 'Product Name', type: 'string', width: 160 },
        { name: 'LocationName', label: 'Location', type: 'string', width: 110 },
        { name: 'Qty', label: 'Qty', type: 'number', width: 65 },
        { name: 'UnitCode', label: 'Unit', type: 'string', width: 55 },
        { name: 'CostPerUnit', label: 'Cost/Unit', type: 'number', width: 80 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 90 },
        { name: 'Remark', label: 'Remark', type: 'string', width: 120 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'MovementType', label: 'Movement Type' },
      totals: ['Qty', 'Amount'],
    },
  },

  // ===================== Stock Out (SO) =====================
  {
    name: 'Stock Out Detail Report',
    description:
      'รายงานแสดงรายละเอียดของ Stock Out แต่ละใบ เช่น product, location, qty, amount Group by Movement Type',
    report_group: 'SO',
    is_standard: true,
    contentConfig: {
      title: 'Stock Out Detail Report',
      dataSource: 'StockOut',
      landscape: true,
      columns: [
        { name: 'DocNo', label: 'Doc No.', type: 'string', width: 90 },
        { name: 'DocDate', label: 'Date', type: 'date', width: 70 },
        { name: 'ProductCode', label: 'Product Code', type: 'string', width: 80 },
        { name: 'ProductDesc1', label: 'Product Name', type: 'string', width: 160 },
        { name: 'LocationName', label: 'Location', type: 'string', width: 110 },
        { name: 'Qty', label: 'Qty', type: 'number', width: 65 },
        { name: 'UnitCode', label: 'Unit', type: 'string', width: 55 },
        { name: 'CostPerUnit', label: 'Cost/Unit', type: 'number', width: 80 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 90 },
        { name: 'Remark', label: 'Remark', type: 'string', width: 120 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      groupBy: { column: 'MovementType', label: 'Movement Type' },
      totals: ['Qty', 'Amount'],
    },
  },

  // ===================== Inventory =====================
  {
    name: 'EOP Adjustment Report',
    description:
      'รายงานแสดงข้อมูลการทำ Closing Balance แสดงยอดคงเหลือตามระบบ ยอดที่นับได้ ส่วนต่าง รวมถึง Cost/Unit และ Amount',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'EOP Adjustment Report',
      dataSource: 'EOPAdjustment',
      landscape: true,
      columns: [
        { name: 'ProductCode', label: 'Product Code', type: 'string', width: 80 },
        { name: 'ProductDesc1', label: 'Product Name', type: 'string', width: 160 },
        { name: 'UnitCode', label: 'Unit', type: 'string', width: 50 },
        { name: 'SystemQty', label: 'System Qty', type: 'number', width: 80 },
        { name: 'CountQty', label: 'Count Qty', type: 'number', width: 80 },
        { name: 'DiffQty', label: 'Diff Qty', type: 'number', width: 75 },
        { name: 'CostPerUnit', label: 'Cost/Unit', type: 'number', width: 80 },
        { name: 'DiffAmount', label: 'Diff Amount', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FDate', label: 'Period' },
        { name: 'FLocation', label: 'Location' },
      ],
      groupBy: { column: 'LocationName', label: 'Location' },
      totals: ['DiffQty', 'DiffAmount'],
    },
  },
  {
    name: 'Inventory Balance Report',
    description:
      'รายงานแสดงยอดคงเหลือ แบบ summary โดย group ด้วยเงื่อนไข Location, Product แสดง Min, Max, On hand, Unit, Cost/Unit, Balance Amount',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'Inventory Balance Report',
      dataSource: 'Inventory',
      columns: [
        { name: 'ProductCode', label: 'Product', type: 'string', width: 200 },
        { name: 'InventoryUnit', label: 'Unit', type: 'string', width: 50 },
        { name: 'MinQty', label: 'Min', type: 'number', width: 60 },
        { name: 'MaxQty', label: 'Max', type: 'number', width: 60 },
        { name: 'NetQty', label: 'On Hand', type: 'number', width: 80 },
        { name: 'UnitCost', label: 'Cost/Unit', type: 'number', width: 80 },
        { name: 'Amount', label: 'Balance Amt', type: 'number', width: 100 },
      ],
      filters: [
        { name: 'FDate', label: 'As at Date' },
        { name: 'FLocation', label: 'Location From' },
        { name: 'TLocation', label: 'Location To' },
        { name: 'FProduct', label: 'Product From' },
        { name: 'TProduct', label: 'Product To' },
      ],
      groupBy: { column: 'LocationCode', label: 'Location' },
      totals: ['NetQty', 'Amount'],
    },
  },
  {
    name: 'Monthly Inventory Movement Report',
    description:
      'รายงานแสดง summary โดย transaction ว่าสินค้าจากแต่ละ location ถูกใช้ไปกับ transaction ประเภทใดบ้าง แสดงยอดยกมาและคงเหลือ',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'Monthly Inventory Movement Report',
      dataSource: 'InventoryMovement',
      landscape: true,
      columns: [
        { name: 'ProductDesc1', label: 'Product', type: 'string', width: 140 },
        { name: 'BFQty', label: 'B/F Qty', type: 'number', width: 65 },
        { name: 'BFAmt', label: 'B/F Amt', type: 'number', width: 70 },
        { name: 'RecQty', label: 'Rec Qty', type: 'number', width: 60 },
        { name: 'RecAmt', label: 'Rec Amt', type: 'number', width: 70 },
        { name: 'CnQty', label: 'CN Qty', type: 'number', width: 55 },
        { name: 'CnAmt', label: 'CN Amt', type: 'number', width: 65 },
        { name: 'TrInQty', label: 'Tr.In Qty', type: 'number', width: 60 },
        { name: 'TrOutQty', label: 'Tr.Out Qty', type: 'number', width: 65 },
        { name: 'IssueQty', label: 'Issue Qty', type: 'number', width: 60 },
        { name: 'SiQty', label: 'SI Qty', type: 'number', width: 55 },
        { name: 'SoQty', label: 'SO Qty', type: 'number', width: 55 },
        { name: 'CFQty', label: 'C/F Qty', type: 'number', width: 65 },
        { name: 'CFAmt', label: 'C/F Amt', type: 'number', width: 75 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FLocation', label: 'Location' },
        { name: 'FCategory', label: 'Category' },
      ],
      groupBy: { column: 'LocationCode', label: 'Location' },
      totals: ['BFAmt', 'RecAmt', 'CnAmt', 'CFAmt'],
    },
  },
  {
    name: 'Inventory Movement Summary by Location Report',
    description:
      'รายงานแสดง Inventory Movement summary ตาม Location แสดง B/F, Receiving, Credit Note, Transfer In/Out, Issue, Stock In/Out, Extra Cost, C/F',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'Inventory Movement Summary by Location',
      dataSource: 'InventoryMovementSummary',
      landscape: true,
      columns: [
        { name: 'LocationName', label: 'Location', type: 'string', width: 120 },
        { name: 'BFAmt', label: 'B/F', type: 'number', width: 75 },
        { name: 'RecAmt', label: 'Receiving', type: 'number', width: 75 },
        { name: 'CnAmt', label: 'Credit Note', type: 'number', width: 75 },
        { name: 'TrInAmt', label: 'Transfer In', type: 'number', width: 75 },
        { name: 'TrOutAmt', label: 'Transfer Out', type: 'number', width: 80 },
        { name: 'IssueAmt', label: 'Issue Out', type: 'number', width: 75 },
        { name: 'SiAmt', label: 'Stock In', type: 'number', width: 70 },
        { name: 'SoAmt', label: 'Stock Out', type: 'number', width: 70 },
        { name: 'ExtraCostAmt', label: 'Extra Cost', type: 'number', width: 75 },
        { name: 'CFAmt', label: 'C/F', type: 'number', width: 80 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
      ],
      totals: ['BFAmt', 'RecAmt', 'CnAmt', 'TrInAmt', 'TrOutAmt', 'IssueAmt', 'SiAmt', 'SoAmt', 'ExtraCostAmt', 'CFAmt'],
    },
  },
  {
    name: 'Slow Moving Report',
    description:
      'รายงานแสดงสินค้าที่ไม่มีการเคลื่อนไหวในช่วงระยะเวลาที่กำหนด แสดง Product, Last Active, On hand, Cost/Unit, Amount',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'Slow Moving Report',
      dataSource: 'SlowMoving',
      landscape: true,
      columns: [
        { name: 'RowNo', label: 'No.', type: 'string', width: 40 },
        { name: 'ProductCode', label: 'Product ID', type: 'string', width: 80 },
        { name: 'ProductDesc1', label: 'Description', type: 'string', width: 180 },
        { name: 'LastActiveDate', label: 'Last Active', type: 'date', width: 80 },
        { name: 'LastActiveType', label: 'Type', type: 'string', width: 60 },
        { name: 'InventoryUnit', label: 'Unit', type: 'string', width: 50 },
        { name: 'OnHandQty', label: 'On Hand', type: 'number', width: 75 },
        { name: 'CostPerUnit', label: 'Cost/Unit', type: 'number', width: 80 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FDate', label: 'As at Date' },
        { name: 'FGroupBy', label: 'Group By' },
      ],
      groupBy: { column: 'LocationName', label: 'Location' },
      totals: ['OnHandQty', 'Amount'],
    },
  },
  {
    name: 'Stock Card Detailed Report',
    description:
      'รายงานแสดง Movement ของ Product แยกตาม Location แสดงยอดยกมา In/Out ยอดยกไป Cost/Unit Amount',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'Stock Card Detail Report',
      dataSource: 'Stockcard',
      landscape: true,
      columns: [
        { name: 'DocDate', label: 'Date', type: 'date', width: 70 },
        { name: 'HdrNo', label: 'Document No.', type: 'string', width: 100 },
        { name: 'DocType', label: 'Type', type: 'string', width: 45 },
        { name: 'InventoryUnit', label: 'Unit', type: 'string', width: 50 },
        { name: 'BFQty', label: 'B/F Qty', type: 'number', width: 70 },
        { name: 'InQty', label: 'In', type: 'number', width: 65 },
        { name: 'OutQty', label: 'Out', type: 'number', width: 65 },
        { name: 'CFQty', label: 'C/F Qty', type: 'number', width: 70 },
        { name: 'BaseCost', label: 'Cost/Unit', type: 'number', width: 75 },
        { name: 'BaseAmount', label: 'Amount', type: 'number', width: 85 },
        { name: 'UnitCost', label: 'Avg. Cost', type: 'number', width: 75 },
        { name: 'Amount', label: 'Total', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FDate', label: 'As at Date' },
        { name: 'FLocation', label: 'Location From' },
        { name: 'TLocation', label: 'Location To' },
        { name: 'FProduct', label: 'Product From' },
        { name: 'TProduct', label: 'Product To' },
      ],
      groupBy: { column: 'ProductCode', label: 'Product' },
      totals: ['InQty', 'OutQty', 'Amount'],
    },
  },
  {
    name: 'Stock Card Summary Report',
    description:
      'รายงานแสดง Movement ของ Product แยกตาม Location แบบสรุป แสดง B/F, In, Out, C/F, Amount',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'Stock Card Summary Report',
      dataSource: 'StockcardSummary',
      landscape: true,
      columns: [
        { name: 'LocationName', label: 'Location', type: 'string', width: 120 },
        { name: 'InventoryUnit', label: 'Unit', type: 'string', width: 50 },
        { name: 'UnitCost', label: 'Cost/Unit', type: 'number', width: 80 },
        { name: 'BFQty', label: 'B/F Qty', type: 'number', width: 75 },
        { name: 'InQty', label: 'In', type: 'number', width: 70 },
        { name: 'OutQty', label: 'Out', type: 'number', width: 70 },
        { name: 'CFQty', label: 'C/F Qty', type: 'number', width: 75 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FDate', label: 'As at Date' },
        { name: 'FProduct', label: 'Product From' },
        { name: 'TProduct', label: 'Product To' },
        { name: 'FLocation', label: 'Location From' },
        { name: 'TLocation', label: 'Location To' },
      ],
      groupBy: { column: 'ProductCode', label: 'Product' },
      totals: ['InQty', 'OutQty', 'Amount'],
    },
  },
  {
    name: 'Deviation by Item Report',
    description:
      'รายงานแสดงความแตกต่างระหว่าง PO และ Receiving ว่ามีรายการใดรับสินค้ามากกว่า PO',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'Deviation by Item Report',
      dataSource: 'Deviation',
      landscape: true,
      columns: [
        { name: 'PoNo', label: 'PO No.', type: 'string', width: 75 },
        { name: 'RecNo', label: 'Rec No.', type: 'string', width: 75 },
        { name: 'InvoiceNo', label: 'Inv. No.', type: 'string', width: 70 },
        { name: 'VendorName', label: 'Vendor', type: 'string', width: 120 },
        { name: 'ProductDesc1', label: 'Product', type: 'string', width: 130 },
        { name: 'PoQty', label: 'PO Qty', type: 'number', width: 60 },
        { name: 'RecQty', label: 'Rec Qty', type: 'number', width: 60 },
        { name: 'DiffQty', label: 'Diff Qty', type: 'number', width: 60 },
        { name: 'RecDevPct', label: 'Dev %', type: 'number', width: 55 },
        { name: 'AllowDevPct', label: 'Allow %', type: 'number', width: 55 },
        { name: 'PoPrice', label: 'PO Price', type: 'number', width: 70 },
        { name: 'RecPrice', label: 'Rec Price', type: 'number', width: 70 },
        { name: 'DiffPrice', label: 'Diff Price', type: 'number', width: 70 },
      ],
      filters: [
        { name: 'FDate', label: 'Rec Date From' },
        { name: 'TDate', label: 'Rec Date To' },
        { name: 'FVendor', label: 'Vendor From' },
        { name: 'TVendor', label: 'Vendor To' },
      ],
      totals: [],
    },
  },
  {
    name: 'Inventory Aging Report',
    description:
      'รายงานแสดงอายุของสินค้าที่ไม่มีการเคลื่อนไหวในระบบ เป็นช่วงเวลา 30, 60, 90 วัน',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'Inventory Aging Report',
      dataSource: 'InventoryAging',
      landscape: true,
      columns: [
        { name: 'ProductCode', label: 'Product', type: 'string', width: 150 },
        { name: 'Qty30', label: '0-30 Qty', type: 'number', width: 65 },
        { name: 'Amt30', label: '0-30 Amt', type: 'number', width: 75 },
        { name: 'Qty60', label: '31-60 Qty', type: 'number', width: 65 },
        { name: 'Amt60', label: '31-60 Amt', type: 'number', width: 75 },
        { name: 'Qty90', label: '61-90 Qty', type: 'number', width: 65 },
        { name: 'Amt90', label: '61-90 Amt', type: 'number', width: 75 },
        { name: 'QtyOver', label: '>90 Qty', type: 'number', width: 65 },
        { name: 'AmtOver', label: '>90 Amt', type: 'number', width: 75 },
        { name: 'TotalQty', label: 'Total Qty', type: 'number', width: 70 },
        { name: 'TotalAmt', label: 'Total Amt', type: 'number', width: 80 },
      ],
      filters: [
        { name: 'FProduct', label: 'Product From' },
        { name: 'TProduct', label: 'Product To' },
        { name: 'FGroupBy', label: 'Group By' },
      ],
      groupBy: { column: 'LocationName', label: 'Location' },
      totals: ['Amt30', 'Amt60', 'Amt90', 'AmtOver', 'TotalAmt'],
    },
  },
  {
    name: 'Expired Items Report',
    description:
      'รายงานแสดงสินค้าที่มีวัน Expiry Date ในช่วงเวลาที่กำหนด',
    report_group: 'Inventory',
    is_standard: true,
    contentConfig: {
      title: 'Expired Items Report',
      dataSource: 'ExpiredItems',
      columns: [
        { name: 'ProductCode', label: 'Product Code', type: 'string', width: 90 },
        { name: 'ProductDesc1', label: 'Description', type: 'string', width: 200 },
        { name: 'Qty', label: 'Qty', type: 'number', width: 70 },
        { name: 'UnitCode', label: 'Unit', type: 'string', width: 55 },
        { name: 'ReceivedDate', label: 'Received Date', type: 'date', width: 85 },
        { name: 'ExpiredDate', label: 'Expired Date', type: 'date', width: 85 },
      ],
      filters: [
        { name: 'FDate', label: 'Expired Within' },
        { name: 'FCategory', label: 'Category' },
      ],
      totals: ['Qty'],
    },
  },

  // ===================== Recipe =====================
  {
    name: 'Recipe List Report',
    description:
      'รายงานแสดง list รายการ Recipe เช่น Recipe Code, Name, Category, Unit, Status',
    report_group: 'Recipe',
    is_standard: true,
    contentConfig: {
      title: 'Recipe List Report',
      dataSource: 'RecipeList',
      columns: [
        { name: 'RecipeCode', label: 'Recipe Code', type: 'string', width: 90 },
        { name: 'RecipeNameEn', label: 'Name (EN)', type: 'string', width: 160 },
        { name: 'RecipeNameTh', label: 'Name (TH)', type: 'string', width: 140 },
        { name: 'CategoryName', label: 'Category', type: 'string', width: 100 },
        { name: 'UnitCode', label: 'Unit', type: 'string', width: 55 },
        { name: 'DocStatus', label: 'Status', type: 'string', width: 65 },
      ],
      filters: [
        { name: 'FCategory', label: 'Category From' },
        { name: 'TCategory', label: 'Category To' },
      ],
      totals: [],
    },
  },
  {
    name: 'Recipe Card Report',
    description:
      'รายงานแสดงรายละเอียดของ Recipe ที่บันทึก เช่น product, qty, cost, total cost',
    report_group: 'Recipe',
    is_standard: true,
    contentConfig: {
      title: 'Recipe Card Report',
      dataSource: 'RecipeCard',
      landscape: true,
      columns: [
        { name: 'ProductCode', label: 'Product Code', type: 'string', width: 90 },
        { name: 'ProductDesc1', label: 'Ingredient', type: 'string', width: 200 },
        { name: 'Qty', label: 'Qty', type: 'number', width: 70 },
        { name: 'UnitCode', label: 'Unit', type: 'string', width: 55 },
        { name: 'CostPerUnit', label: 'Cost/Unit', type: 'number', width: 80 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FCategory', label: 'Category From' },
        { name: 'TCategory', label: 'Category To' },
        { name: 'FRecipe', label: 'Recipe Code From' },
        { name: 'TRecipe', label: 'Recipe Code To' },
      ],
      groupBy: { column: 'RecipeCode', label: 'Recipe' },
      totals: ['Amount'],
    },
  },
  {
    name: 'Material Consumption Report',
    description:
      'รายงานเอา Qty จาก POS เทียบกับ Recipe เพื่อประเมินว่าจะมีการตัดวัตถุดิบอะไรไปบ้าง',
    report_group: 'Recipe',
    is_standard: true,
    contentConfig: {
      title: 'Material Consumption Report',
      dataSource: 'MaterialConsumption',
      landscape: true,
      columns: [
        { name: 'RecipeName', label: 'Recipe', type: 'string', width: 180 },
        { name: 'RecipeQty', label: 'Recipe Qty', type: 'number', width: 80 },
        { name: 'RecipeUnit', label: 'Recipe Unit', type: 'string', width: 70 },
        { name: 'InventoryQty', label: 'Inv. Qty', type: 'number', width: 80 },
        { name: 'InventoryUnit', label: 'Inv. Unit', type: 'string', width: 70 },
        { name: 'CostPerUnit', label: 'Cost/Unit', type: 'number', width: 80 },
        { name: 'Amount', label: 'Amount', type: 'number', width: 90 },
      ],
      filters: [
        { name: 'FLocation', label: 'Location' },
      ],
      groupBy: { column: 'RecipeCode', label: 'Recipe' },
      totals: ['Amount'],
    },
  },
  {
    name: 'Menu Engineering Report',
    description:
      'รายงานเอาข้อมูลยอดขาย ต้นทุน เพื่อหากำไรขาดทุน แบ่งเป็นหมวดหมู่ STAR, DOG, PUZZLE, PLOWHORSE',
    report_group: 'Recipe',
    is_standard: true,
    contentConfig: {
      title: 'Menu Engineering Report',
      dataSource: 'MenuEngineering',
      landscape: true,
      columns: [
        { name: 'RecipeCode', label: 'Recipe Code', type: 'string', width: 90 },
        { name: 'RecipeName', label: 'Recipe Name', type: 'string', width: 160 },
        { name: 'SalesQty', label: 'Qty Sold', type: 'number', width: 70 },
        { name: 'Cost', label: 'Cost', type: 'number', width: 80 },
        { name: 'Price', label: 'Price', type: 'number', width: 80 },
        { name: 'Profit', label: 'Profit', type: 'number', width: 80 },
        { name: 'ProfitPct', label: 'Profit %', type: 'number', width: 65 },
        { name: 'Model', label: 'Model', type: 'string', width: 80 },
      ],
      filters: [
        { name: 'FDate', label: 'Date From' },
        { name: 'TDate', label: 'Date To' },
        { name: 'FCategory', label: 'Category' },
      ],
      groupBy: { column: 'Model', label: 'Model' },
      totals: ['SalesQty', 'Cost', 'Profit'],
    },
  },

  // ===================== Document Layout (Single-doc Print) =====================
  {
    name: 'Purchase Request Document',
    description:
      'Document layout สำหรับพิมพ์ใบ PR แต่ละใบ ประกอบด้วย header (PR No, Requestor, Department, Date), รายการสินค้า, และช่องลายเซ็นด้านล่าง',
    report_group: 'PR_DOC',
    is_standard: true,
    documentConfig: {
      title: 'PURCHASE REQUEST',
      headerDataSource: 'PRHeader',
      headerFields: [
        { key: 'PrNo',           label: 'PR Number',  column: 'left' },
        { key: 'RequestorName',  label: 'Requestor',  column: 'left' },
        { key: 'DepartmentName', label: 'Department', column: 'left' },
        { key: 'Description',    label: 'Description',column: 'left' },
        { key: 'PrDate',         label: 'PR Date',    column: 'right', type: 'date' },
        { key: 'DeliveryDate',   label: 'Required',   column: 'right', type: 'date' },
        { key: 'PrStatus',       label: 'Status',     column: 'right' },
        { key: 'WorkflowName',   label: 'Workflow',   column: 'right' },
      ],
      detailDataSource: 'PRDetail',
      detailColumns: [
        { name: 'No',           label: 'No.',        type: 'string', width: 30 },
        { name: 'ProductName',  label: 'Product',    type: 'string', width: 200 },
        { name: 'LocationName', label: 'Location',   type: 'string', width: 100 },
        { name: 'RequestedQty', label: 'Req. Qty',   type: 'number', width: 70 },
        { name: 'UnitName',     label: 'Unit',       type: 'string', width: 60 },
        { name: 'DeliveryDate', label: 'Delivery',   type: 'date',   width: 75 },
        { name: 'NetAmount',    label: 'Net Amount', type: 'number', width: 90 },
      ],
      totals: ['NetAmount'],
      signatures: [
        { key: 'Sig1Name', label: 'Requested by' },
        { key: 'Sig2Name', label: 'Verified by' },
        { key: 'Sig3Name', label: 'Approved by' },
      ],
      footerNote: 'This document is computer-generated.',
    },
  },
  {
    name: 'Purchase Request Document Landscape',
    description:
      'Document layout แนวนอนสำหรับพิมพ์ใบ PR — header data แสดงแบบ inline, ตารางกว้างขึ้น',
    report_group: 'PR_DOC',
    is_standard: true,
    documentConfig: {
      title: 'PURCHASE REQUEST',
      landscape: true,
      headerDataSource: 'PRHeader',
      headerFields: [
        { key: 'PrNo',           label: 'PR Number' },
        { key: 'PrDate',         label: 'PR Date',    type: 'date' },
        { key: 'PrStatus',       label: 'Status' },
        { key: 'WorkflowName',   label: 'Workflow' },
        { key: 'RequestorName',  label: 'Requestor' },
        { key: 'DepartmentName', label: 'Department' },
        { key: 'DeliveryDate',   label: 'Required',   type: 'date' },
        { key: 'Description',    label: 'Description' },
      ],
      detailDataSource: 'PRDetail',
      detailColumns: [
        { name: 'No',           label: 'No.',        type: 'string', width: 30 },
        { name: 'ProductName',  label: 'Product',    type: 'string', width: 250 },
        { name: 'LocationName', label: 'Location',   type: 'string', width: 120 },
        { name: 'RequestedQty', label: 'Req. Qty',   type: 'number', width: 75 },
        { name: 'UnitName',     label: 'Unit',       type: 'string', width: 65 },
        { name: 'UnitPrice',    label: 'Unit Price', type: 'number', width: 85 },
        { name: 'Discount',     label: 'Discount',   type: 'number', width: 75 },
        { name: 'TaxAmount',    label: 'Tax',        type: 'number', width: 75 },
        { name: 'DeliveryDate', label: 'Delivery',   type: 'date',   width: 75 },
        { name: 'NetAmount',    label: 'Net Amount', type: 'number', width: 95 },
      ],
      totals: ['NetAmount'],
      signatures: [
        { key: 'Sig1Name', label: 'Requested by' },
        { key: 'Sig2Name', label: 'Verified by' },
        { key: 'Sig3Name', label: 'Approved by' },
      ],
      footerNote: 'This document is computer-generated.',
    },
  },
  {
    name: 'Purchase Order Document',
    description:
      'Document layout สำหรับพิมพ์ใบ PO แต่ละใบ (แนวตั้ง) ประกอบด้วย header, รายการสินค้า, และช่องลายเซ็น',
    report_group: 'PO_DOC',
    is_standard: true,
    documentConfig: {
      title: 'PURCHASE ORDER',
      headerDataSource: 'POHeader',
      headerFields: [
        { key: 'PoNo',          label: 'PO Number',  column: 'left' },
        { key: 'VendorName',    label: 'Vendor',     column: 'left' },
        { key: 'DepartmentName',label: 'Department', column: 'left' },
        { key: 'Description',   label: 'Description',column: 'left' },
        { key: 'PoDate',        label: 'PO Date',    column: 'right', type: 'date' },
        { key: 'DeliveryDate',  label: 'Delivery',   column: 'right', type: 'date' },
        { key: 'PoStatus',      label: 'Status',     column: 'right' },
        { key: 'CreditTerm',    label: 'Credit Term', column: 'right' },
      ],
      detailDataSource: 'PODetail',
      detailColumns: [
        { name: 'No',           label: 'No.',        type: 'string', width: 30 },
        { name: 'ProductName',  label: 'Product',    type: 'string', width: 200 },
        { name: 'OrderQty',     label: 'Order Qty',  type: 'number', width: 70 },
        { name: 'UnitName',     label: 'Unit',       type: 'string', width: 60 },
        { name: 'UnitPrice',    label: 'Unit Price', type: 'number', width: 80 },
        { name: 'NetAmount',    label: 'Net Amount', type: 'number', width: 90 },
      ],
      totals: ['NetAmount'],
      signatures: [
        { key: 'Sig1Name', label: 'Prepared by' },
        { key: 'Sig2Name', label: 'Verified by' },
        { key: 'Sig3Name', label: 'Approved by' },
      ],
      footerNote: 'This document is computer-generated.',
    },
  },
  {
    name: 'Purchase Order Document Landscape',
    description:
      'Document layout แนวนอนสำหรับพิมพ์ใบ PO — header data แสดงแบบ inline, ตารางกว้างขึ้น',
    report_group: 'PO_DOC',
    is_standard: true,
    documentConfig: {
      title: 'PURCHASE ORDER',
      landscape: true,
      headerDataSource: 'POHeader',
      headerFields: [
        { key: 'PoNo',          label: 'PO Number' },
        { key: 'PoDate',        label: 'PO Date',    type: 'date' },
        { key: 'PoStatus',      label: 'Status' },
        { key: 'CreditTerm',    label: 'Credit Term' },
        { key: 'VendorName',    label: 'Vendor' },
        { key: 'DepartmentName',label: 'Department' },
        { key: 'DeliveryDate',  label: 'Delivery',   type: 'date' },
        { key: 'Description',   label: 'Description' },
      ],
      detailDataSource: 'PODetail',
      detailColumns: [
        { name: 'No',           label: 'No.',         type: 'string', width: 30 },
        { name: 'ProductName',  label: 'Product',     type: 'string', width: 250 },
        { name: 'LocationName', label: 'Location',    type: 'string', width: 120 },
        { name: 'OrderQty',     label: 'Order Qty',   type: 'number', width: 75 },
        { name: 'UnitName',     label: 'Unit',        type: 'string', width: 65 },
        { name: 'UnitPrice',    label: 'Unit Price',  type: 'number', width: 85 },
        { name: 'Discount',     label: 'Discount',    type: 'number', width: 75 },
        { name: 'TaxAmount',    label: 'Tax',         type: 'number', width: 75 },
        { name: 'DeliveryDate', label: 'Delivery',    type: 'date',   width: 75 },
        { name: 'NetAmount',    label: 'Net Amount',  type: 'number', width: 95 },
      ],
      totals: ['NetAmount'],
      signatures: [
        { key: 'Sig1Name', label: 'Prepared by' },
        { key: 'Sig2Name', label: 'Verified by' },
        { key: 'Sig3Name', label: 'Approved by' },
      ],
      footerNote: 'This document is computer-generated.',
    },
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Deleting existing report templates...');
  const deleted = await prisma.tb_report_template.deleteMany({});
  console.log(`Deleted ${deleted.count} records.\n`);

  console.log(`Seeding ${reportTemplates.length} report templates...\n`);

  let createdCount = 0;

  for (let i = 0; i < reportTemplates.length; i++) {
    const t = reportTemplates[i];
    const progress = `[${i + 1}/${reportTemplates.length}]`;
    const contentXml = t.documentConfig
      ? generateDocumentXml(t.documentConfig)
      : generateContentXml(t.contentConfig!);

    await prisma.tb_report_template.create({
      data: {
        name: t.name,
        description: t.description,
        report_group: t.report_group,
        kind: 'report',
        dialog: '',
        content: contentXml,
        is_standard: t.is_standard,
        is_active: true,
      },
    });

    console.log(`${progress} CREATE: ${t.name} (${t.report_group})`);
    createdCount++;
  }

  console.log(`\n==================== Summary ====================`);
  console.log(`Deleted: ${deleted.count}`);
  console.log(`Created: ${createdCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
