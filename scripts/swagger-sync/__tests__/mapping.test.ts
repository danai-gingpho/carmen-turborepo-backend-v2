import { describe, it, expect } from 'bun:test';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { loadMapping } from '../tag-mapping';
import { SWAGGER_TAGS } from '../../../apps/backend-gateway/src/swagger/tag-groups';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
const GATEWAY_SRC = join(REPO_ROOT, 'apps', 'backend-gateway', 'src');

function walkControllers(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walkControllers(full));
    } else if (entry.endsWith('.controller.ts') && !entry.endsWith('.spec.ts')) {
      out.push(relative(REPO_ROOT, full));
    }
  }
  return out;
}

const actual = walkControllers(GATEWAY_SRC).sort();
const mapping = loadMapping();
const mapped = Object.keys(mapping).sort();
const declaredTags = new Set(SWAGGER_TAGS.map((t) => t.name));

describe('tag-mapping.json', () => {
  it('contains exactly 144 entries', () => {
    expect(mapped.length).toBe(144);
  });

  it('covers every controller in apps/backend-gateway/src', () => {
    const missing = actual.filter((p) => !mapping[p]);
    expect(missing).toEqual([]);
  });

  it('has no entries pointing to non-existent files', () => {
    const ghosts = mapped.filter((p) => !actual.includes(p));
    expect(ghosts).toEqual([]);
  });

  it('every mapping value is a declared tag', () => {
    const invalid = mapped.filter((p) => !declaredTags.has(mapping[p]));
    expect(invalid).toEqual([]);
  });
});
