import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { parseBruFile } from './bru-parser';
import type { BruFile } from '../types';
import { BRUNO_ROOT, BRUNO_PRESERVED_DIRS } from '../config';

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const rel = relative(BRUNO_ROOT, full);
      if (BRUNO_PRESERVED_DIRS.some((p) => rel === p || rel.startsWith(p + '/'))) continue;
      await walk(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.bru') && entry.name !== 'folder.bru') {
      out.push(full);
    }
  }
  return out;
}

export async function scanBrunoFiles(): Promise<BruFile[]> {
  const paths = await walk(BRUNO_ROOT);
  const files: BruFile[] = [];
  for (const p of paths) {
    const sections = await parseBruFile(p);
    files.push({
      path: p,
      relativePath: relative(BRUNO_ROOT, p),
      sections,
    });
  }
  return files;
}
