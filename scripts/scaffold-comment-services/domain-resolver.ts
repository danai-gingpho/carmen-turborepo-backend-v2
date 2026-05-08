import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DOMAINS = ['master', 'procurement', 'inventory'] as const;
export type Domain = (typeof DOMAINS)[number];

/**
 * Resolve which micro-business domain folder owns a given comment kebab name.
 * Looks for an existing dto folder at apps/micro-business/src/{domain}/{kebabFull}/dto/.
 * Returns null if no domain matches (caller should warn and skip).
 */
export function resolveDomain(
  kebabFull: string,
  microBusinessSrcDir: string,
): Domain | null {
  for (const domain of DOMAINS) {
    const dtoPath = join(microBusinessSrcDir, domain, kebabFull, 'dto');
    if (existsSync(dtoPath)) return domain;
  }
  return null;
}

export const ALL_DOMAINS = DOMAINS;
