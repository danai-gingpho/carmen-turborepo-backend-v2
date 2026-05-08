import type { EndpointMeta, BruFile, DiffResult } from '../types';
import { resolveTargetFolder } from '../generator/folder-mapper';
import { fileNameForEndpoint } from '../generator/bru-writer';
import { join } from 'node:path';

function normalizePath(p: string): string {
  return '/' + p.replace(/^\/+|\/+$/g, '');
}

function extractUrlPath(verbBody: string): string {
  const m = verbBody.match(/url:\s*(\S+)/);
  if (!m) return '';
  const raw = m[1]
    .replace(/^\{\{[a-zA-Z0-9_]+\}\}/, '')  // strip leading {{base_url}}, {{host}}, etc.
    .replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, ':$1')  // convert remaining Bruno path vars to NestJS style
    .split('?')[0];  // drop query string
  return normalizePath(raw);
}

function bruKey(relPath: string, method: string, urlPath: string): string {
  return `${method.toUpperCase()}::${normalizePath(urlPath)}`;
}

export interface DiffInput {
  endpoints: EndpointMeta[];
  bruFiles: BruFile[];
  locationIndex: Record<string, string>;
}

export function diffEndpoints(input: DiffInput): DiffResult {
  const { endpoints, bruFiles, locationIndex } = input;
  const warnings: string[] = [];

  const bruIndex = new Map<string, BruFile>();
  for (const b of bruFiles) {
    if (!b.sections.method) continue;
    const url = extractUrlPath(b.sections.method.body);
    if (!url) continue;
    const key = bruKey(b.relativePath, b.sections.method.verb, url);
    bruIndex.set(key, b);
  }

  const created: DiffResult['created'] = [];
  const updated: DiffResult['updated'] = [];
  const matchedKeys = new Set<string>();

  for (const ep of endpoints) {
    const key = bruKey('', ep.method, ep.fullPath);
    const match = bruIndex.get(key);
    if (match) {
      matchedKeys.add(key);
      updated.push({ endpoint: ep, bru: match });
    } else {
      const folder = resolveTargetFolder(ep, locationIndex);
      const fileName = fileNameForEndpoint(ep);
      created.push({ endpoint: ep, targetPath: join(folder, fileName) });
    }
  }

  const orphaned: BruFile[] = [];
  for (const [key, bru] of bruIndex) {
    if (matchedKeys.has(key)) continue;
    orphaned.push(bru);
  }

  return { created, updated, orphaned, warnings };
}
