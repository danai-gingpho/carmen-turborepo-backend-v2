import { PrismaClient } from "@repo/prisma-shared-schema-tenant";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function seed_tb_config_running_code() {
  const dataPath = path.join(__dirname, "..", "seed-data-a01", "tb_config_running_code.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log(`Seeding tb_config_running_code (${data.length} records)...`);

  let successCount = 0;
  let errorCount = 0;

  for (const record of data) {
    try {
      await prisma.tb_config_running_code.upsert({
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

  console.log(`✓ tb_config_running_code seeded: ${successCount} successful, ${errorCount} errors`);
}

async function main() {
  console.log("Seeding tb_config_running_code...");
  await seed_tb_config_running_code();
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
