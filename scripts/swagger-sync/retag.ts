import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadMapping } from './tag-mapping';

const API_TAGS_RE = /@ApiTags\(\s*([^)]*)\s*\)/s;
const IMPORT_RE = /import\s+\{([^}]*)\}\s+from\s+['"]@nestjs\/swagger['"];?/;
const CONTROLLER_RE = /^@Controller\(/m;

export function applyRetagToContent(content: string, newTag: string): string {
  const desired = `@ApiTags('${newTag}')`;
  let out = content;

  if (API_TAGS_RE.test(out)) {
    out = out.replace(API_TAGS_RE, desired);
  } else {
    out = insertApiTags(out, desired);
    out = ensureApiTagsImport(out);
  }

  return out;
}

function insertApiTags(content: string, desired: string): string {
  const m = content.match(CONTROLLER_RE);
  if (!m || m.index === undefined) return content;
  const before = content.slice(0, m.index);
  const after = content.slice(m.index);
  return `${before}${desired}\n${after}`;
}

function ensureApiTagsImport(content: string): string {
  const imp = content.match(IMPORT_RE);
  if (imp) {
    const names = imp[1].split(',').map((s) => s.trim()).filter(Boolean);
    if (names.includes('ApiTags')) return content;
    const merged = [...names, 'ApiTags'].sort().join(', ');
    return content.replace(IMPORT_RE, `import { ${merged} } from '@nestjs/swagger';`);
  }
  const commonRe = /(import\s+\{[^}]*\}\s+from\s+['"]@nestjs\/common['"];?)/;
  const cm = content.match(commonRe);
  if (cm && cm.index !== undefined) {
    const insertPos = cm.index + cm[0].length;
    return `${content.slice(0, insertPos)}\nimport { ApiTags } from '@nestjs/swagger';${content.slice(insertPos)}`;
  }
  return `import { ApiTags } from '@nestjs/swagger';\n${content}`;
}

type RunOptions = { apply: boolean };

async function main(): Promise<void> {
  const opts: RunOptions = { apply: process.argv.includes('--apply') };
  const mapping = loadMapping();
  const repoRoot = join(import.meta.dir, '..', '..');

  let changed = 0;
  let unchanged = 0;
  const failures: string[] = [];

  for (const [relPath, tag] of Object.entries(mapping)) {
    const abs = join(repoRoot, relPath);
    let original: string;
    try {
      original = readFileSync(abs, 'utf8');
    } catch (e) {
      failures.push(`${relPath}: ${(e as Error).message}`);
      continue;
    }
    const next = applyRetagToContent(original, tag);
    if (next === original) {
      unchanged++;
      continue;
    }
    changed++;
    if (opts.apply) {
      writeFileSync(abs, next);
    } else {
      console.log(`~ ${relPath}  →  ${tag}`);
    }
  }

  console.log(
    `\n${opts.apply ? 'applied' : 'dry-run'}: changed=${changed} unchanged=${unchanged} failed=${failures.length}`,
  );
  if (failures.length) {
    for (const f of failures) console.error(`! ${f}`);
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
