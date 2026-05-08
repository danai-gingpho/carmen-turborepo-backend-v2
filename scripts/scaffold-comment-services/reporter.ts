import type { MissingService } from './types';

export interface RunStats {
  discovered: number;
  alreadyScaffolded: number;
  missing: MissingService[];
  filesWritten: string[];
  filesSkipped: string[];
  modulesAdded: string[];
  modulesAlreadyPresent: string[];
  warnings: string[];
  dryRun: boolean;
}

export function formatReport(s: RunStats): string {
  const lines: string[] = [];
  lines.push(s.dryRun ? '=== DRY RUN ===' : '=== APPLY ===');
  lines.push(`Discovered: ${s.discovered} *-comment dirs in gateway`);
  lines.push(`Already scaffolded in micro-business: ${s.alreadyScaffolded}`);
  lines.push(`Missing: ${s.missing.length}`);

  const byDomain = new Map<string, number>();
  for (const m of s.missing) byDomain.set(m.domain, (byDomain.get(m.domain) ?? 0) + 1);
  for (const [d, n] of byDomain) lines.push(`  ${d}: ${n}`);

  lines.push('');
  lines.push(`Files written: ${s.filesWritten.length}`);
  lines.push(`Files skipped (already exist): ${s.filesSkipped.length}`);
  lines.push(`Modules registered: ${s.modulesAdded.length}`);
  lines.push(`Modules already in app.module.ts: ${s.modulesAlreadyPresent.length}`);

  if (s.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const w of s.warnings) lines.push(`  - ${w}`);
  }
  return lines.join('\n');
}
