import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { buildBodySkeletonFromSource } from './dto';
import type { BodySchema } from '../types';

async function findDtoFile(startDir: string, dtoName: string, maxUp = 4): Promise<string | null> {
  let dir = startDir;
  for (let i = 0; i <= maxUp; i++) {
    const hits = await grepDir(dir, dtoName);
    if (hits.length > 0) return hits[0];
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

async function grepDir(dir: string, dtoName: string, results: string[] = []): Promise<string[]> {
  let entries: Awaited<ReturnType<typeof readdir>> = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.turbo' || entry.name === 'dist') continue;
      await grepDir(full, dtoName, results);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts'))) {
      const text = await Bun.file(full).text();
      if (text.includes(`class ${dtoName}`) || text.includes(`${dtoName} extends createZodDto`)) {
        results.push(full);
      }
    }
  }
  return results;
}

export async function resolveBodySkeleton(
  controllerFile: string,
  dtoName: string | undefined,
): Promise<BodySchema> {
  if (!dtoName) return { kind: 'unknown', dtoName: '', skeleton: {}, warnings: [] };
  const dir = dirname(controllerFile);
  const found = await findDtoFile(dir, dtoName);
  if (!found) {
    return {
      kind: 'unknown',
      dtoName,
      skeleton: {},
      warnings: [`DTO '${dtoName}' not found within 4 parent dirs of ${controllerFile}`],
    };
  }
  const source = await Bun.file(found).text();
  return buildBodySkeletonFromSource(source, dtoName);
}
