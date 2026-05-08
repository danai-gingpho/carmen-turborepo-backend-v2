import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseControllerFile } from './controller';
import { readGlobalPrefix } from './global-prefix';
import { GATEWAY_SRC, GATEWAY_MAIN, GATEWAY_SCAN_DIRS } from '../config';
import type { EndpointMeta } from '../types';

async function walkControllers(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkControllers(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.controller.ts') && !entry.name.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}

export async function scanGatewayEndpoints(): Promise<{
  endpoints: EndpointMeta[];
  parseErrors: string[];
}> {
  const prefix = await readGlobalPrefix(GATEWAY_MAIN);
  const endpoints: EndpointMeta[] = [];
  const parseErrors: string[] = [];

  for (const sub of GATEWAY_SCAN_DIRS) {
    const dir = join(GATEWAY_SRC, sub);
    const files = await walkControllers(dir).catch(() => [] as string[]);
    for (const file of files) {
      try {
        const parsed = await parseControllerFile(file, prefix);
        endpoints.push(...parsed);
      } catch (err) {
        parseErrors.push(`${file}: ${(err as Error).message}`);
      }
    }
  }

  return { endpoints, parseErrors };
}
