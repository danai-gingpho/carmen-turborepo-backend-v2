import { mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { MissingService, RenderedService } from './types';

export interface WriteResult {
  written: string[];
  skipped: string[];
}

/**
 * Write the 3 generated files for a service. Idempotent: skips files that already exist.
 *
 *   microBusinessSrcDir = apps/micro-business/src
 */
export function writeServiceFiles(
  service: MissingService,
  rendered: RenderedService,
  microBusinessSrcDir: string,
  options: { dryRun: boolean },
): WriteResult {
  const dir = join(microBusinessSrcDir, service.domain, service.kebabFull);
  const targets: Array<[string, string]> = [
    [join(dir, `${service.kebabFull}.controller.ts`), rendered.controller],
    [join(dir, `${service.kebabFull}.service.ts`), rendered.service],
    [join(dir, `${service.kebabFull}.module.ts`), rendered.module],
  ];

  const written: string[] = [];
  const skipped: string[] = [];

  for (const [path, content] of targets) {
    if (existsSync(path)) {
      skipped.push(path);
      continue;
    }
    if (!options.dryRun) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, 'utf8');
    }
    written.push(path);
  }

  return { written, skipped };
}
