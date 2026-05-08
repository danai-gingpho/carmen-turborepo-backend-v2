import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveNames } from './name-resolver';
import { resolveDomain } from './domain-resolver';
import type { MissingService } from './types';

/**
 * Find comment services that exist in the gateway but lack a controller in micro-business.
 *   gatewayAppDir       = apps/backend-gateway/src/application
 *   microBusinessSrcDir = apps/micro-business/src
 */
export function findMissingServices(
  gatewayAppDir: string,
  microBusinessSrcDir: string,
): { missing: MissingService[]; warnings: string[] } {
  const warnings: string[] = [];
  const entries = readdirSync(gatewayAppDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith('-comment'))
    .map((d) => d.name)
    .sort();

  const missing: MissingService[] = [];

  for (const kebabFull of entries) {
    const domain = resolveDomain(kebabFull, microBusinessSrcDir);
    if (!domain) {
      warnings.push(`No dto folder for ${kebabFull} in any of master/procurement/inventory — skipped`);
      continue;
    }

    const controllerPath = join(
      microBusinessSrcDir,
      domain,
      kebabFull,
      `${kebabFull}.controller.ts`,
    );
    if (existsSync(controllerPath)) continue; // already scaffolded

    missing.push({
      kebabFull,
      domain,
      names: resolveNames(kebabFull),
    });
  }

  return { missing, warnings };
}
