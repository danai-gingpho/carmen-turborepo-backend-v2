import { PrismaClient } from "@repo/prisma-shared-schema-tenant";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function seed_tb_purchase_request_detail() {
  const dataPath = path.join(__dirname, "..", "seed-data-a01", "tb_purchase_request_detail.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log(`Seeding tb_purchase_request_detail (${data.length} records)...`);

  let successCount = 0;
  let errorCount = 0;

  for (const record of data) {
    try {
      await prisma.tb_purchase_request_detail.upsert({
        where: { id: record.id },
        update: record,
        create: record,
      });
      successCount++;
    } catch (error: any) {
      console.error(`Error seeding record ${record.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`✓ tb_purchase_request_detail seeded: ${successCount} successful, ${errorCount} errors`);
}

async function main() {
  console.log("Seeding tb_purchase_request_detail...");
  await seed_tb_purchase_request_detail();
  console.log("✓ Done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
