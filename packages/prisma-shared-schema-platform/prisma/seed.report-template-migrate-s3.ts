import { PrismaClient } from '@repo/prisma-shared-schema-platform';
import * as Minio from 'minio';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config();

// ==================== Configuration ====================

// MinIO (source)
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'http://dev.blueledgers.com:3990';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'carmen';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || '9pYSsEvTj3ZhwzBClRuAj3yJ';
const MINIO_BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'carmen';

// AWS S3 (destination)
const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-7';
const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || 'report-templates';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';

// ==================== Folder Mapping ====================
// จัดกลุ่ม report ตาม module/domain

function getReportFolder(name: string): string {
  const n = name.toLowerCase();

  // Purchase Order
  if (n.includes('purchase order') || n.startsWith('po ')) return 'po';

  // Purchase Request
  if (n.includes('purchase request')) return 'pr';

  // Purchase Analysis
  if (n.includes('purchase analysis') || n.includes('total purchase')) return 'po';

  // Receiving
  if (n.includes('receiving') || n.includes('receiving#')) return 'receiving';

  // Credit Note
  if (n.includes('credit note')) return 'cn';

  // Store Requisition
  if (n.includes('store requisition')) return 'sr';

  // Stock
  if (n.includes('stock card') || n.includes('stock in') || n.includes('stock out')) return 'stock';

  // Inventory
  if (
    n.includes('inventory') ||
    n.includes('end of month') ||
    n.includes('eop ') ||
    n.includes('slow moving') ||
    n.includes('physical count')
  )
    return 'inventory';

  // Issue
  if (n === 'issue detail') return 'issue';

  // Vendor
  if (n.includes('vendor')) return 'vendor';

  // Product / Price List
  if (n.includes('product') || n.includes('price list') || n.includes('pricelist')) return 'product';

  // Item
  if (n.includes('item expiry') || n.includes('deviation by item') || n.includes('order pending'))
    return 'order';

  // Store Location
  if (n.includes('store location')) return 'store';

  // Vat / Tax
  if (n.includes('vat')) return 'vat';

  // Extra Cost
  if (n.includes('extra cost') || n.includes('summary cost')) return 'cost';

  // Transaction / Others
  if (n.includes('transaction')) return 'transaction';
  if (n.includes('project job')) return 'project';
  if (n.includes('reject')) return 'pr';

  return 'other';
}

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-_()]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

// ==================== Clients ====================

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

function createS3Client(): S3Client {
  return new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
}

async function downloadFromMinio(
  minioClient: Minio.Client,
  objectName: string,
): Promise<Buffer> {
  const stream = await minioClient.getObject(MINIO_BUCKET_NAME, objectName);
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function uploadToS3(
  s3Client: S3Client,
  key: string,
  body: Buffer,
  metadata: Record<string, string>,
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: 'application/octet-stream',
      Metadata: metadata,
    }),
  );
}

async function existsInS3(s3Client: S3Client, key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: AWS_S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// ==================== Main ====================

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.SYSTEM_DIRECT_URL } },
  });
  const minioClient = createMinioClient();
  const s3Client = createS3Client();

  // Get all report templates from DB
  const templates = await prisma.tb_report_template.findMany({
    where: { deleted_at: null },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${templates.length} report templates.\n`);

  // Show folder mapping for ALL reports
  console.log('=== Folder Mapping (All 64 reports) ===');
  const folderMap = new Map<string, string[]>();
  for (const t of templates) {
    const folder = getReportFolder(t.name);
    if (!folderMap.has(folder)) folderMap.set(folder, []);
    folderMap.get(folder)!.push(t.name);
  }
  for (const [folder, names] of [...folderMap.entries()].sort()) {
    console.log(`  ${folder}/ (${names.length})`);
    names.forEach((n) => console.log(`    - ${n}`));
  }
  console.log('');

  // Migrate files from MinIO to S3
  const withFile = templates.filter((t) => t.template_file_token);
  const withoutFile = templates.filter((t) => !t.template_file_token);

  console.log(`=== Migrating ${withFile.length} files from MinIO → AWS S3 ===\n`);

  let migratedCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const template of withFile) {
    const folder = getReportFolder(template.name);
    const sanitizedName = sanitizeFileName(template.name);
    const s3Key = `${folder}/${sanitizedName}.fpx`;
    const newToken = `${folder}/${sanitizedName}`;

    // Check if already exists in S3
    const exists = await existsInS3(s3Client, s3Key);
    if (exists) {
      // Update DB token to new path
      if (template.template_file_token !== newToken) {
        await prisma.tb_report_template.update({
          where: { id: template.id },
          data: { template_file_token: newToken },
        });
      }
      console.log(`  SKIP (exists in S3): [${folder}/] ${template.name}`);
      skipCount++;
      continue;
    }

    try {
      // Download from MinIO
      const minioObjectName = `${template.template_file_token}.fpx`;
      console.log(`  Downloading from MinIO: ${minioObjectName}`);
      const buffer = await downloadFromMinio(minioClient, minioObjectName);
      console.log(`    ${(buffer.length / 1024).toFixed(1)} KB`);

      // Upload to S3
      console.log(`  Uploading to S3: ${s3Key}`);
      await uploadToS3(s3Client, s3Key, buffer, {
        'x-report-name': encodeURIComponent(template.name),
        'x-report-type': template.report_type,
      });

      // Update DB with new S3 path
      await prisma.tb_report_template.update({
        where: { id: template.id },
        data: { template_file_token: newToken },
      });

      console.log(`    OK -> ${newToken}`);
      migratedCount++;
    } catch (err) {
      console.log(`  FAILED: ${(err as Error).message}`);
      failCount++;
    }
  }

  // Update folder paths for reports WITHOUT files (set expected S3 path)
  console.log(`\n=== Setting S3 paths for ${withoutFile.length} pending reports ===\n`);

  let updatedCount = 0;
  for (const template of withoutFile) {
    const folder = getReportFolder(template.name);
    const sanitizedName = sanitizeFileName(template.name);
    const expectedToken = `${folder}/${sanitizedName}`;

    await prisma.tb_report_template.update({
      where: { id: template.id },
      data: { template_file_token: expectedToken },
    });

    console.log(`  [${folder}/] ${template.name} -> ${expectedToken}`);
    updatedCount++;
  }

  console.log(`\n==================== Summary ====================`);
  console.log(`Files migrated to S3: ${migratedCount}`);
  console.log(`Files skipped (exists): ${skipCount}`);
  console.log(`Files failed: ${failCount}`);
  console.log(`Paths updated (no file): ${updatedCount}`);
  console.log(`S3 Bucket: s3://${AWS_S3_BUCKET}/`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
