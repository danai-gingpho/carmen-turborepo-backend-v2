import { join, dirname } from 'node:path';
import { mkdir, rename, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { BruFile } from '../types';
import { BRUNO_ARCHIVE_DIR, BRUNO_ROOT } from '../config';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function archiveOrphans(
  orphans: BruFile[],
  dryRun: boolean,
): Promise<{ moved: string[]; note: string }> {
  const date = todayIso();
  const baseDir = join(BRUNO_ARCHIVE_DIR, date);
  const moved: string[] = [];
  if (dryRun) {
    return {
      moved: orphans.map((o) => o.relativePath),
      note: `would move ${orphans.length} file(s) to ${baseDir}`,
    };
  }
  if (orphans.length === 0) return { moved: [], note: 'no orphans' };
  await mkdir(baseDir, { recursive: true });
  const readmeLines: string[] = [];
  readmeLines.push(`## ${date}`);
  for (const o of orphans) {
    const target = join(baseDir, o.relativePath);
    await mkdir(dirname(target), { recursive: true });
    await rename(o.path, target);
    moved.push(o.relativePath);
    readmeLines.push(`- \`${o.relativePath}\` — endpoint not found in gateway controllers`);
  }
  const readmePath = join(BRUNO_ROOT, '_archived', 'README.md');
  const header = `# Archived Bruno Requests\n\nFiles moved by bruno-sync when the corresponding gateway endpoint could not be found. Review periodically and delete when confirmed obsolete.\n\n`;
  const prev = existsSync(readmePath) ? await readFile(readmePath, 'utf8') : header;
  await writeFile(readmePath, prev + readmeLines.join('\n') + '\n\n');
  return { moved, note: `moved ${moved.length} file(s) to ${baseDir}` };
}
