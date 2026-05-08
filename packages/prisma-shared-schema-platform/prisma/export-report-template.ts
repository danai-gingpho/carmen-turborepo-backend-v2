import { PrismaClient } from '@repo/prisma-shared-schema-platform';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.SYSTEM_DIRECT_URL },
  },
});

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-_()]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

async function main() {
  const dataDir = join(__dirname, 'data', 'report-templates');
  mkdirSync(dataDir, { recursive: true });

  const templates = await prisma.tb_report_template.findMany({
    where: { deleted_at: null },
    orderBy: [{ report_group: 'asc' }, { name: 'asc' }],
  });

  console.log(`Found ${templates.length} report templates.\n`);

  // Build seed data JSON (metadata only, dialog/content go to files)
  const seedData: Array<{
    id: string;
    name: string;
    description: string | null;
    report_group: string;
    is_standard: boolean;
    is_active: boolean;
  }> = [];

  for (const t of templates) {
    const safeName = sanitizeFileName(t.name);

    // Write dialog XML
    if (t.dialog && t.dialog.length > 0) {
      writeFileSync(join(dataDir, `${safeName}.dialog.xml`), t.dialog, 'utf-8');
    }

    // Write content XML
    if (t.content && t.content.length > 0) {
      writeFileSync(join(dataDir, `${safeName}.content.xml`), t.content, 'utf-8');
    }

    seedData.push({
      id: t.id,
      name: t.name,
      description: t.description,
      report_group: t.report_group,
      is_standard: t.is_standard,
      is_active: t.is_active,
    });

    const dialogSize = t.dialog ? (t.dialog.length / 1024).toFixed(1) : '0';
    const contentSize = t.content ? (t.content.length / 1024).toFixed(1) : '0';
    console.log(
      `  ${t.report_group} | ${t.name} -> ${safeName} (dialog: ${dialogSize} KB, content: ${contentSize} KB)`,
    );
  }

  // Write metadata JSON
  writeFileSync(
    join(dataDir, '_metadata.json'),
    JSON.stringify(seedData, null, 2),
    'utf-8',
  );

  console.log(`\nExported ${templates.length} templates to ${dataDir}`);
  console.log(`Metadata: _metadata.json`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
