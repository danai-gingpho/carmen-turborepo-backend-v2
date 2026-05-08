import { PrismaClient } from '@repo/prisma-shared-schema-platform';
import * as Minio from 'minio';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';

dotenv.config();

// ==================== Configuration ====================

const BLUELEDGERS_BASE_URL =
  'https://dev.blueledgers.com/support/DeevanaPhuket/Blueledgers';

const BL_USERNAME = 'support@carmen';
const BL_PASSWORD = 'alpha2011';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://dev.blueledgers.com:3990';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'carmen';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || '9pYSsEvTj3ZhwzBClRuAj3yJ';
const MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'carmen';
const MINIO_FOLDER = 'report-templates';

const COOKIE_FILE = '/tmp/bl_upload_cookies.txt';

// Report IDs from Blueledgers mapped to report names
const REPORT_MAP: Record<string, string> = {
  '864B40AF-2202-4894-A7BE-E4CB8F2204F0': 'Credit Note Detail',
  'FB243B5E-FA57-4CA6-8EC1-A071910321DC': 'Deviation by Item',
  'D33094D9-7C56-412F-83E3-F71520284D9A': 'End Of Month Balanced',
  '3DB3DD73-54C6-4ACD-82E4-31D5CACB5D5B': 'EOP Adjustment Report',
  '8A5F1E34-C27C-4583-BF84-77347D40DEAF': 'Extra Cost Summary By Type',
  'C3BC3BE3-349B-452E-91FE-AA673D781C94': 'Inventory Aging Detailed',
  'EB49A685-3553-41B8-89C0-589612E4CA15': 'Inventory Aging Summary',
  '49F579C5-3927-4D08-93BE-A26C7F6B2635': 'Inventory Balance',
  '201D9A8E-3CE8-4264-838C-22E34B1081ED': 'Inventory Balance Summary by Category',
  '1AA68C25-D3D8-4FF6-BD14-4B7D2368C7E8': 'Inventory Balance Summary by Item',
  '9E529B13-6BA6-451A-AF5A-9F0B0E4378EB': 'Inventory By ExpiryDate',
  'B8EE945E-99E1-4E14-9A08-EEED519EFFFC': 'Inventory Movement Detailed By Product',
  '8AD03C96-DC8E-453C-83D2-8DBB4F4698B1': 'Inventory Movement Summary By Location',
  'DDD51537-F289-472C-862F-F9649C575157': 'Issue Detail',
  '877438AD-5818-405E-8C6A-CA069E80AAD8': 'Item Expiry',
  '585794F2-100B-453E-AA69-706B172062CE': 'Order Pending By Item report',
  'DB34256C-B9EB-4E4D-9FE8-9E80ABF8703C': 'Order Pending By Vendor Report',
  '15FC9F5E-EE29-42A6-8C3E-0A18049B0C3D': 'Physical Count Qty Difference Report',
  'F56D6233-EEEA-4EE9-9B19-98616461D5E9': 'PO Log Book Report',
  '265F1095-8053-4F27-8CC6-5FEF86259FC3': 'Price List Detail by Product Report',
  '21CD4DEA-E5C7-4FCA-9B51-A5ADF5C4FFD5': 'Pricelist Comparison by Vendor',
  'AA0E1E07-D909-4BA3-BC95-FA0154B2F4A9': 'Product Category',
  '177AC38A-B320-4962-A88C-A908E4B2A6FA': 'Product List',
  'EECBCA7F-66AE-41EB-A65A-6C31E6191CCE': 'Project Job Function',
  '9BB660CA-EDD7-488B-B209-FA009E98EADF': 'Purchase Analysis by Item Report',
  'CA04701A-9D3D-4532-82B3-A31356194F1F': 'Purchase Order By Department',
  '747CCE5C-ADB0-4126-A490-751D44F68543': 'Purchase Order Detail by Date',
  'AB203D41-9394-40A6-857D-372C0682F5E3': 'Purchase Request by Department',
  '303B78EF-FE9F-4378-8714-518DE51A0DAA': 'Receiving Audit Report - (Committed Date)',
  '555C2406-37C6-4BE6-8E8D-CC9ED1EBB9B7': 'Receiving Daily Detailed Summary Report by Location Type',
  '0B8DBC79-F8CE-4EDC-846E-9C4C727EE1CF': 'Receiving Daily Summary by Location and Category',
  '7EF577CC-BA31-467F-B979-BC4DEBEEA8FB': 'Receiving Detail',
  '21DE2E80-1F6E-46BB-86DF-17EC4D9B26C9': 'Receiving Detail with Currency',
  '48BFC093-74CC-45F7-9313-55F33D17B72D': 'Receiving Monthly Summary by Location and Category',
  'EE851565-059C-453B-BBB2-12F9FE265CCB': 'Receiving Monthly Summary by Receving Date and Category',
  '025218DE-B5C7-4AA2-93D3-EB3736107C84': 'Receiving Summary',
  'D05CC687-F4C7-4285-A47D-2359C4799E89': 'Receiving Summary with Currency',
  'FC14D023-2DA1-4399-A707-0DF5B15FD07C': 'Reject Purchase Request Report Report',
  'DCF858C8-21F7-4033-9E93-8E0DCB3B2C7A': 'Slow Moving Report',
  '1BAEFCBE-67BE-49E0-9C90-660E391691EE': 'Stock Card Detailed',
  '87826B1C-2AA9-4E5B-BD59-8662070FB126': 'Stock Card Summary',
  'E8E21178-F1D8-4309-8BA9-1F4A24A38E36': 'Stock In Detail',
  'B7B0001B-2AD0-44EC-B61B-79D1373EF362': 'Stock Out Detail',
  '70F40213-3159-4B5F-9F51-0A1A5B05A20E': 'Store Location',
  'EA4867FA-FC86-42AD-A51A-2F49CC2595D5': 'Store Requisition By Request Store Is Void',
  'A97B16CA-0C8E-4E5A-B997-0DAE6EE57BE3': 'Store Requisition By Request Store On Daily Summary Void',
  '920A925B-D250-4BEB-894F-CAE4C82FBF53': 'Store Requisition By Request Store On Summary',
  '0FCB892B-B8CF-4725-AB37-5A28C0712B56': 'Store Requisition By Request Store On Summary (Show Void Only)',
  'D2B40155-397B-463C-AA2F-6621C889F271': 'Store Requisition Detail',
  '59D7DA4C-F189-443A-B031-99A55E22AC6D': 'Store Requisition Details \u2013 Issue from any/some location',
  '177604A4-DD5B-4C3B-B1FD-C379B49B4C71': 'Store Requisition Details \u2013 Request to any/some location',
  '5196BEEC-BFAC-4515-A23F-F2AF205690E9': 'Store Requisition Inventory - Summary (All)',
  'B9D5CB4B-8135-4A02-AFE7-8AB2966A555B': 'Store Requisition Inventory - Summary (Type Shipment)',
  '2F0CC70A-3FEC-43E2-B9EA-6ED4DEE73F3F': 'Store Requisition Inventory - Summary (Type Transfer)',
  '692555A6-CE40-46A9-A54D-8AEA5A6D7E10': 'Store Requisition Summary \u2013 Issue from any/some location',
  'A7EA8272-51CC-4AC5-B4BA-671D49FEF210': 'Summary Cost Receiving Report',
  'FC5F93EA-1EA8-4795-8491-07FF83712654': 'Top Receiving by Product',
  '3D947571-51D0-4ADA-82EF-0FEA206F5B7B': 'Top Receiving by Vendor',
  '42D1E497-B29E-4A5A-BB1D-C025295EA283': 'Total Purchase by Vendor Report',
  'B0255CFB-84A4-445C-9EA6-C48F22223D92': 'Transaction Summary',
  'C82288F7-02DA-47B5-846D-BA00461808B6': 'Vat Report',
  '31FB0D6C-F243-4E6F-B385-42D1445EACBF': 'Vendor by Purchase Order',
  '0DDC1AEF-B908-4E16-A433-DBBA9955FD5F': 'Vendor Detailed',
  'D92B8607-5538-4B71-9FB3-81F3B2C68F09': 'Vendor List',
};

// ==================== Curl Helpers ====================

function curl(args: string): string {
  return execSync(`curl -sk ${args}`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
}

function curlBinary(args: string, outputFile: string): void {
  execSync(`curl -sk ${args} -o "${outputFile}"`, { maxBuffer: 10 * 1024 * 1024 });
}

// ==================== Blueledgers Auth ====================

function loginBlueledgers(): void {
  console.log('Logging in to Blueledgers...');

  // Step 1: Get login page
  const loginHtml = curl(
    `-c ${COOKIE_FILE} "${BLUELEDGERS_BASE_URL}/login.aspx"`,
  );

  // Extract form tokens
  const viewState = loginHtml.match(/__VIEWSTATE" id="__VIEWSTATE" value="([^"]*)/)?.[1] || '';
  const viewStateGen =
    loginHtml.match(/__VIEWSTATEGENERATOR" id="__VIEWSTATEGENERATOR" value="([^"]*)/)?.[1] || '';
  const eventValidation =
    loginHtml.match(/__EVENTVALIDATION" id="__EVENTVALIDATION" value="([^"]*)/)?.[1] || '';

  // Step 2: POST login - write form data to temp file to avoid shell escaping issues
  const formData = [
    `__VIEWSTATE=${encodeURIComponent(viewState)}`,
    `__VIEWSTATEGENERATOR=${encodeURIComponent(viewStateGen)}`,
    `__EVENTVALIDATION=${encodeURIComponent(eventValidation)}`,
    `LoginControl%24UserName=${encodeURIComponent(BL_USERNAME)}`,
    `LoginControl%24Password=${encodeURIComponent(BL_PASSWORD)}`,
    `LoginControl%24LoginButton=${encodeURIComponent('Log In')}`,
  ].join('&');

  const formFile = '/tmp/bl_login_form.txt';
  writeFileSync(formFile, formData);

  const loginResult = curl(
    `-b ${COOKIE_FILE} -c ${COOKIE_FILE} -D - ` +
    `"${BLUELEDGERS_BASE_URL}/login.aspx" ` +
    `-d @${formFile}`,
  );

  unlinkSync(formFile);

  if (loginResult.includes('302') || loginResult.includes('.ASPXAUTH')) {
    console.log('Login successful!\n');
  } else {
    throw new Error('Login failed');
  }
}

// ==================== Report Download ====================

function downloadReportFpx(reportId: string): Buffer | null {
  const tmpFile = `/tmp/bl_rpt_${reportId}.fpx`;

  try {
    // Step 1: Load report page to get preview object
    const reportHtml = curl(
      `-b ${COOKIE_FILE} -c ${COOKIE_FILE} ` +
      `"${BLUELEDGERS_BASE_URL}/RPT/Report.aspx?id=${reportId}"`,
    );

    const previewObj = reportHtml.match(/previewobject=(fr[A-Za-z0-9_\-]+)/)?.[1];
    if (!previewObj) {
      console.log('    Could not find preview object');
      return null;
    }

    // Step 2: Initialize the FastReport viewer (loads dialog)
    curl(
      `-b ${COOKIE_FILE} -c ${COOKIE_FILE} ` +
      `"${BLUELEDGERS_BASE_URL}/FastReport.Export.axd?previewobject=${previewObj}"`,
    );

    // Step 3: Submit dialog OK (prepare report with default params)
    curl(
      `-b ${COOKIE_FILE} -c ${COOKIE_FILE} ` +
      `"${BLUELEDGERS_BASE_URL}/FastReport.Export.axd?object=${previewObj}&dialog=0&control=btnOk&event=onclick&data="`,
    );

    // Step 4: Export as FPX (follow redirects)
    curlBinary(
      `-L --max-time 120 -b ${COOKIE_FILE} -c ${COOKIE_FILE} ` +
      `"${BLUELEDGERS_BASE_URL}/FastReport.Export.axd?previewobject=${previewObj}&export_fpx=1&s=${Date.now()}"`,
      tmpFile,
    );

    if (!existsSync(tmpFile)) {
      console.log('    FPX file not created');
      return null;
    }

    const buffer = readFileSync(tmpFile);
    unlinkSync(tmpFile);

    if (buffer.length < 100) {
      console.log(`    FPX too small (${buffer.length} bytes)`);
      return null;
    }

    return buffer;
  } catch (err) {
    console.log(`    Error: ${(err as Error).message}`);
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
    return null;
  }
}

// ==================== MinIO ====================

function createMinioClient(): Minio.Client {
  const endpoint = new URL(MINIO_ENDPOINT);
  return new Minio.Client({
    endPoint: endpoint.hostname,
    port: endpoint.port ? parseInt(endpoint.port) : 9000,
    useSSL: endpoint.protocol === 'https:',
    accessKey: MINIO_ACCESS_KEY,
    secretKey: MINIO_SECRET_KEY,
  });
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-_()]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

// ==================== Main ====================

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.SYSTEM_DIRECT_URL } },
  });

  const minioClient = createMinioClient();

  // Ensure bucket exists
  const bucketExists = await minioClient.bucketExists(MINIO_BUCKET_NAME);
  if (!bucketExists) {
    await minioClient.makeBucket(MINIO_BUCKET_NAME);
    console.log(`Created bucket: ${MINIO_BUCKET_NAME}`);
  }

  // Get all report templates from DB
  const templates = await prisma.tb_report_template.findMany({
    where: { deleted_at: null },
  });
  console.log(`Found ${templates.length} report templates in DB.\n`);

  // Login to Blueledgers
  loginBlueledgers();

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  const reportEntries = Object.entries(REPORT_MAP);

  for (let i = 0; i < reportEntries.length; i++) {
    const [reportId, reportName] = reportEntries[i];
    const template = templates.find((t) => t.name === reportName);

    if (!template) {
      console.log(`[${i + 1}/${reportEntries.length}] SKIP (not in DB): ${reportName}`);
      skipCount++;
      continue;
    }

    if (template.template_file_token) {
      console.log(`[${i + 1}/${reportEntries.length}] SKIP (already uploaded): ${reportName}`);
      skipCount++;
      continue;
    }

    console.log(`[${i + 1}/${reportEntries.length}] Downloading: ${reportName}...`);

    // Download FPX
    const fpxBuffer = downloadReportFpx(reportId);
    if (!fpxBuffer) {
      console.log('    FAILED to download');
      failCount++;
      continue;
    }

    console.log(`    Downloaded ${(fpxBuffer.length / 1024).toFixed(1)} KB`);

    // Upload to MinIO with retry
    const sanitizedName = sanitizeFileName(reportName);
    const objectName = `${MINIO_FOLDER}/${sanitizedName}.fpx`;

    const metaData = {
      'Content-Type': 'application/octet-stream',
      'X-Original-Name': encodeURIComponent(`${reportName}.fpx`),
      'X-Report-Id': reportId,
      'X-Report-Type': template.report_type,
    };

    let uploaded = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await minioClient.putObject(
          MINIO_BUCKET_NAME,
          objectName,
          fpxBuffer,
          fpxBuffer.length,
          metaData,
        );
        uploaded = true;
        break;
      } catch (uploadErr) {
        console.log(`    Upload attempt ${attempt} failed: ${(uploadErr as Error).message}`);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    if (!uploaded) {
      console.log('    FAILED to upload to MinIO');
      failCount++;
      continue;
    }

    const fileToken = `${MINIO_FOLDER}/${sanitizedName}`;

    // Update DB with file token
    await prisma.tb_report_template.update({
      where: { id: template.id },
      data: { template_file_token: fileToken },
    });

    console.log(`    Uploaded -> ${objectName} (token: ${fileToken})`);
    successCount++;
  }

  console.log(`\n==================== Summary ====================`);
  console.log(`Success: ${successCount}`);
  console.log(`Failed:  ${failCount}`);
  console.log(`Skipped: ${skipCount}`);
  console.log(`Total:   ${reportEntries.length}`);

  // Cleanup
  if (existsSync(COOKIE_FILE)) unlinkSync(COOKIE_FILE);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
