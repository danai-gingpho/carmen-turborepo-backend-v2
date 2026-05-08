/**
 * apply-tenant-views.ts
 *
 * Applies every `migrations/tenant/*.<up|down>.sql` file to every active
 * business unit's schema. Each migration is idempotent (CREATE OR REPLACE
 * VIEW), so re-runs are safe.
 *
 * Usage:
 *   pnpm db:tenant-views:apply
 *   pnpm db:tenant-views:apply -- --bu T03
 *   pnpm db:tenant-views:apply -- --down
 *   pnpm db:tenant-views:apply -- --only 001_v_operational_product_list
 *
 * The script connects to the platform DB via Prisma to enumerate active BUs
 * (reading `tb_business_unit.db_connection`), then shells out to `psql` to
 * apply each .sql file against the BU's schema. `psql` must be on PATH.
 */

import { PrismaClient } from "@repo/prisma-shared-schema-platform";
import { execFileSync } from "child_process";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

interface DbConnection {
  host: string;
  port: number;
  schema: string;
  database: string;
  username: string;
  password: string;
  provider?: string;
}

interface BU {
  code: string;
  conn: DbConnection;
}

const TENANT_MIGRATIONS_DIR = path.resolve(__dirname, "../migrations/tenant");

function parseArgs(): {
  filterBU: string | null;
  direction: "up" | "down";
  onlyPrefix: string | null;
} {
  const args = process.argv.slice(2);
  const get = (flag: string) =>
    args.includes(flag) ? args[args.indexOf(flag) + 1] ?? null : null;
  return {
    filterBU: get("--bu"),
    direction: args.includes("--down") ? "down" : "up",
    onlyPrefix: get("--only"),
  };
}

async function loadTenants(
  prisma: PrismaClient,
  filterBU: string | null,
): Promise<BU[]> {
  const where: any = {
    is_active: true,
    deleted_at: null,
    db_connection: { not: null },
  };
  if (filterBU) where.code = filterBU;

  const rows = await prisma.tb_business_unit.findMany({
    where,
    select: { code: true, db_connection: true },
    orderBy: { code: "asc" },
  });

  const tenants: BU[] = [];
  for (const row of rows) {
    if (!row.db_connection || typeof row.db_connection !== "object") continue;
    const conn = row.db_connection as unknown as DbConnection;
    if (!conn.host || !conn.schema || !conn.database) {
      console.warn(`  [skip] ${row.code}: incomplete db_connection`);
      continue;
    }
    tenants.push({ code: row.code, conn });
  }
  return tenants;
}

function listSqlFiles(direction: "up" | "down", onlyPrefix: string | null): string[] {
  const all = fs
    .readdirSync(TENANT_MIGRATIONS_DIR)
    .filter((f) => f.endsWith(`.${direction}.sql`))
    .sort();

  if (!onlyPrefix) return all;
  return all.filter((f) => f.startsWith(onlyPrefix));
}

function applyToTenant(
  bu: BU,
  files: string[],
): { applied: number; failed: { file: string; err: string }[] } {
  const failed: { file: string; err: string }[] = [];
  let applied = 0;

  const url = `postgresql://${encodeURIComponent(bu.conn.username)}@${bu.conn.host}:${bu.conn.port}/${bu.conn.database}?sslmode=require&connect_timeout=30`;
  const env = { ...process.env, PGPASSWORD: bu.conn.password };

  for (const file of files) {
    const sqlPath = path.join(TENANT_MIGRATIONS_DIR, file);
    try {
      execFileSync(
        "psql",
        [
          url,
          "-v",
          "ON_ERROR_STOP=1",
          "-q",
          "-c",
          `SET search_path TO "${bu.conn.schema}";`,
          "-f",
          sqlPath,
        ],
        { stdio: ["ignore", "pipe", "pipe"], env },
      );
      applied++;
    } catch (e: any) {
      const errBuf = e.stderr ? e.stderr.toString() : e.message ?? "";
      const tail = errBuf.trim().split("\n").slice(-3).join(" | ");
      failed.push({ file, err: tail });
    }
  }
  return { applied, failed };
}

async function main() {
  const { filterBU, direction, onlyPrefix } = parseArgs();

  const platformURL =
    process.env.SYSTEM_DIRECT_URL ?? process.env.PLATFORM_DATABASE_URL;
  if (!platformURL) {
    console.error(
      "Set SYSTEM_DIRECT_URL or PLATFORM_DATABASE_URL in env to point at the platform DB.",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: platformURL } },
  });

  try {
    const tenants = await loadTenants(prisma, filterBU);
    if (tenants.length === 0) {
      console.error(
        `No active tenants found${filterBU ? ` matching --bu=${filterBU}` : ""}.`,
      );
      process.exit(1);
    }

    const files = listSqlFiles(direction, onlyPrefix);
    if (files.length === 0) {
      console.error(
        `No *.${direction}.sql files in ${TENANT_MIGRATIONS_DIR}${onlyPrefix ? ` matching --only=${onlyPrefix}` : ""}.`,
      );
      process.exit(1);
    }

    console.log(
      `Applying ${files.length} ${direction}.sql file(s) to ${tenants.length} tenant(s)…`,
    );

    let totalApplied = 0;
    let totalFailed = 0;
    const tenantsWithFailures: string[] = [];

    for (const bu of tenants) {
      const { applied, failed } = applyToTenant(bu, files);
      totalApplied += applied;
      totalFailed += failed.length;

      const status = failed.length === 0 ? "✓" : `✗ ${failed.length} failed`;
      console.log(
        `  [${bu.code.padEnd(8)}] schema=${bu.conn.schema.padEnd(15)} applied=${applied}/${files.length}  ${status}`,
      );
      for (const f of failed) {
        console.log(`     - ${f.file}: ${f.err}`);
      }
      if (failed.length > 0) tenantsWithFailures.push(bu.code);
    }

    console.log(
      `\nDone: applied=${totalApplied} failed=${totalFailed} across ${tenants.length} tenant(s)` +
        (tenantsWithFailures.length > 0
          ? ` (failures in: ${tenantsWithFailures.join(", ")})`
          : ""),
    );
    process.exit(totalFailed === 0 ? 0 : 1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
