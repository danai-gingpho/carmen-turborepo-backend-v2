#!/usr/bin/env bun
import { scanGatewayEndpoints } from './parser/gateway-scanner';
import { scanBrunoFiles } from './generator/bru-scanner';
import { buildModuleLocationIndex } from './generator/folder-mapper';
import { diffEndpoints } from './reconciler/diff';
import { applyCreatesAndUpdates } from './reconciler/apply';
import { archiveOrphans } from './reconciler/archiver';

interface CliFlags {
  dryRun: boolean;
  verbose: boolean;
}

function parseArgs(argv: string[]): CliFlags {
  return {
    dryRun: argv.includes('--dry-run'),
    verbose: argv.includes('--verbose'),
  };
}

function formatSection(title: string, items: string[]): string {
  if (items.length === 0) return `${title}: none`;
  return `${title} (${items.length}):\n  - ${items.join('\n  - ')}`;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  console.log(`bruno-sync ${flags.dryRun ? '(DRY RUN)' : ''}`);

  const { endpoints, parseErrors } = await scanGatewayEndpoints();
  const bruFiles = await scanBrunoFiles();
  const locationIndex = buildModuleLocationIndex(bruFiles);
  const diff = diffEndpoints({ endpoints, bruFiles, locationIndex });

  console.log(`Scanned: ${endpoints.length} gateway endpoints, ${bruFiles.length} existing .bru files`);
  if (parseErrors.length) {
    console.log(`Parse errors: ${parseErrors.length}`);
    if (flags.verbose) for (const e of parseErrors) console.log(`  ${e}`);
  }

  const applyResult = await applyCreatesAndUpdates(diff, flags.dryRun);
  const archiveResult = await archiveOrphans(diff.orphaned, flags.dryRun);

  console.log('');
  console.log(formatSection('Added', applyResult.added));
  console.log('');
  console.log(formatSection('Updated', applyResult.updated));
  console.log('');
  console.log(formatSection('Archived', archiveResult.moved));
  console.log('');
  console.log(formatSection('Warnings', [...applyResult.warnings, ...diff.warnings]));
  console.log('');
  console.log(archiveResult.note);

  if (parseErrors.length > 0) process.exitCode = 0; // non-fatal
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
