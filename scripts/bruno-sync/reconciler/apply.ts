import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { writeBruText } from '../generator/bru-writer';
import { mergeGeneratedWithExisting } from './merger';
import { resolveBodySkeleton } from '../parser/dto-resolver';
import { BRUNO_ROOT } from '../config';
import type { DiffResult } from '../types';

async function nextSeq(folderAbs: string): Promise<number> {
  if (!existsSync(folderAbs)) return 1;
  const entries = await readdir(folderAbs).catch(() => [] as string[]);
  let max = 0;
  for (const name of entries) {
    if (!name.endsWith('.bru')) continue;
    const path = join(folderAbs, name);
    const text = await Bun.file(path).text();
    const m = text.match(/seq:\s*(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

export async function applyCreatesAndUpdates(
  diff: DiffResult,
  dryRun: boolean,
): Promise<{ added: string[]; updated: string[]; warnings: string[] }> {
  const added: string[] = [];
  const updatedPaths: string[] = [];
  const warnings: string[] = [];

  for (const item of diff.created) {
    const targetAbs = join(BRUNO_ROOT, item.targetPath);
    const folderAbs = dirname(targetAbs);
    const seq = await nextSeq(folderAbs);
    const body = await resolveBodySkeleton(item.endpoint.sourceFile, item.endpoint.bodyDto);
    for (const w of body.warnings) warnings.push(`${item.targetPath}: ${w}`);
    const text = writeBruText({ endpoint: item.endpoint, seq, bodySkeleton: body.skeleton });
    added.push(item.targetPath);
    if (!dryRun) {
      await mkdir(folderAbs, { recursive: true });
      await writeFile(targetAbs, text);
    }
  }

  for (const item of diff.updated) {
    const existingText = await Bun.file(item.bru.path).text();
    const body = await resolveBodySkeleton(item.endpoint.sourceFile, item.endpoint.bodyDto);
    for (const w of body.warnings) warnings.push(`${item.bru.relativePath}: ${w}`);
    const seq = Number(item.bru.sections.meta?.seq ?? '1');
    const generated = writeBruText({ endpoint: item.endpoint, seq, bodySkeleton: body.skeleton });
    const merged = mergeGeneratedWithExisting(generated, existingText);
    if (merged !== existingText) {
      updatedPaths.push(item.bru.relativePath);
      if (!dryRun) await writeFile(item.bru.path, merged);
    }
  }

  return { added, updated: updatedPaths, warnings };
}
