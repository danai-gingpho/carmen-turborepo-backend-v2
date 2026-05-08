#!/usr/bin/env bun
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'apps/backend-gateway/src';
const dryRun = process.argv.includes('--dry');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'node_modules') continue;
      walk(full, out);
    } else if (full.endsWith('.controller.ts')) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(ROOT);

const ownLineRe = /^\s*tags:\s*\[[^\]]*\]\s*,?\s*$/gm;
const inlineLeadingRe = /\btags:\s*\[[^\]]*\]\s*,\s*/g;
const inlineTrailingRe = /\s*,\s*tags:\s*\[[^\]]*\]/g;
const inlineSoloRe = /\{\s*tags:\s*\[[^\]]*\]\s*\}/g;

let totalRemoved = 0;
let filesChanged = 0;

for (const file of files) {
  const original = readFileSync(file, 'utf8');
  let next = original;

  next = next.replace(ownLineRe, '');
  next = next.replace(inlineLeadingRe, '');
  next = next.replace(inlineTrailingRe, '');
  next = next.replace(inlineSoloRe, '{}');

  if (next !== original) {
    const removed =
      original.split('tags: [').length - next.split('tags: [').length;
    totalRemoved += removed;
    filesChanged++;
    if (!dryRun) writeFileSync(file, next);
    console.log(`${dryRun ? '[dry] ' : ''}${file}: removed ${removed}`);
  }
}

console.log(
  `\n${dryRun ? '[dry] ' : ''}Files changed: ${filesChanged}, lines removed: ${totalRemoved}`,
);
