#!/usr/bin/env bun
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { findMissingServices } from './service-discovery';
import { loadTemplate } from './template-loader';
import { render } from './template-renderer';
import { writeServiceFiles } from './file-writer';
import { registerModules } from './module-registrar';
import { formatReport, type RunStats } from './reporter';

const ROOT = process.cwd();
const GATEWAY_APP_DIR = join(ROOT, 'apps/backend-gateway/src/application');
const MICRO_BUSINESS_SRC = join(ROOT, 'apps/micro-business/src');
const APP_MODULE_PATH = join(MICRO_BUSINESS_SRC, 'app.module.ts');

const dryRun = process.argv.includes('--dry-run');

function countAlreadyScaffolded(): number {
  const entries = readdirSync(GATEWAY_APP_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith('-comment'))
    .map((d) => d.name);

  let n = 0;
  for (const kebabFull of entries) {
    for (const domain of ['master', 'procurement', 'inventory']) {
      const controllerPath = join(MICRO_BUSINESS_SRC, domain, kebabFull, `${kebabFull}.controller.ts`);
      if (existsSync(controllerPath)) {
        n += 1;
        break;
      }
    }
  }
  return n;
}

async function main(): Promise<void> {
  const discoveredCount = readdirSync(GATEWAY_APP_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith('-comment')).length;

  const { missing, warnings } = findMissingServices(GATEWAY_APP_DIR, MICRO_BUSINESS_SRC);
  const alreadyScaffolded = countAlreadyScaffolded();

  const template = loadTemplate(ROOT);

  const filesWritten: string[] = [];
  const filesSkipped: string[] = [];

  for (const service of missing) {
    const rendered = render(template, service.names);
    const result = writeServiceFiles(service, rendered, MICRO_BUSINESS_SRC, { dryRun });
    filesWritten.push(...result.written);
    filesSkipped.push(...result.skipped);
  }

  const reg = registerModules(APP_MODULE_PATH, missing, { dryRun });

  const stats: RunStats = {
    discovered: discoveredCount,
    alreadyScaffolded,
    missing,
    filesWritten,
    filesSkipped,
    modulesAdded: reg.addedImports,
    modulesAlreadyPresent: reg.alreadyPresent,
    warnings,
    dryRun,
  };

  console.log(formatReport(stats));
}

main().catch((err) => {
  console.error('scaffold-comments failed:', err);
  process.exit(1);
});
