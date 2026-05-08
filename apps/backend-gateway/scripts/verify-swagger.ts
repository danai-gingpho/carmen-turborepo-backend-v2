import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SWAGGER_TAGS,
  SWAGGER_TAG_GROUPS,
  type SwaggerTag,
  type SwaggerTagGroup,
} from '../src/swagger/tag-groups';

export type OpenApiOperation = { tags?: string[] };
export type OpenApiDocLite = {
  paths: Record<string, Record<string, OpenApiOperation>>;
  'x-tagGroups'?: Array<{ name: string; tags: string[] }>;
};

export type InvariantResult = { failures: string[] };

export function runInvariants(
  doc: OpenApiDocLite,
  tags: SwaggerTag[],
  groups: SwaggerTagGroup[],
): InvariantResult {
  const failures: string[] = [];
  const declared = new Set(tags.map((t) => t.name));
  const usedOnOps = new Set<string>();

  for (const [p, methods] of Object.entries(doc.paths ?? {})) {
    for (const [m, op] of Object.entries(methods ?? {})) {
      const t = op.tags ?? [];
      if (t.length === 0) {
        failures.push(`untagged operation: ${m.toUpperCase()} ${p}`);
        continue;
      }
      for (const name of t) {
        if (!declared.has(name)) {
          failures.push(`undeclared tag '${name}' on ${m.toUpperCase()} ${p}`);
        }
        usedOnOps.add(name);
      }
    }
  }

  for (const t of tags) {
    if (!usedOnOps.has(t.name)) failures.push(`unused declared tag: ${t.name}`);
  }

  for (const g of groups) {
    for (const name of g.tags) {
      if (!declared.has(name)) {
        failures.push(
          `group '${g.name}' references undeclared tag: ${name}`,
        );
      }
    }
  }

  const inGroupCount = new Map<string, number>();
  for (const g of groups) {
    for (const n of g.tags) inGroupCount.set(n, (inGroupCount.get(n) ?? 0) + 1);
  }
  for (const t of tags) {
    const c = inGroupCount.get(t.name) ?? 0;
    if (c === 0) failures.push(`declared tag '${t.name}' is not in any group`);
    if (c > 1) failures.push(`declared tag '${t.name}' is in ${c} groups`);
  }

  return { failures };
}

const API_TAGS_RE = /@ApiTags\(\s*['"]([^'"]+)['"]/;

export function extractApiTag(source: string): string | null {
  const m = source.match(API_TAGS_RE);
  return m ? m[1] : null;
}

type TagMapping = Record<string, string>;

export function buildSyntheticDoc(
  mapping: TagMapping,
  readSource: (relPath: string) => string,
): { doc: OpenApiDocLite; mismatches: string[] } {
  const paths: OpenApiDocLite['paths'] = {};
  const mismatches: string[] = [];

  for (const [relPath, expectedTag] of Object.entries(mapping)) {
    const src = readSource(relPath);
    const actualTag = extractApiTag(src);
    if (actualTag === null) {
      mismatches.push(`${relPath}: no @ApiTags decorator found`);
      paths[relPath] = { get: { tags: [] } };
      continue;
    }
    if (actualTag !== expectedTag) {
      mismatches.push(
        `${relPath}: @ApiTags('${actualTag}') does not match mapping '${expectedTag}'`,
      );
    }
    paths[relPath] = { get: { tags: [actualTag] } };
  }

  return {
    doc: { paths, 'x-tagGroups': SWAGGER_TAG_GROUPS },
    mismatches,
  };
}

function main(): void {
  const repoRoot = join(__dirname, '..', '..', '..');
  const mappingPath = join(
    repoRoot,
    'scripts',
    'swagger-sync',
    'tag-mapping.json',
  );
  const mapping = JSON.parse(
    readFileSync(mappingPath, 'utf8'),
  ) as TagMapping;

  const { doc, mismatches } = buildSyntheticDoc(mapping, (rel) =>
    readFileSync(join(repoRoot, rel), 'utf8'),
  );

  const { failures } = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);

  const allIssues = [...mismatches, ...failures];
  if (allIssues.length === 0) {
    console.log(
      `swagger-verify: PASS (${Object.keys(mapping).length} controllers, ${SWAGGER_TAGS.length} tags, ${SWAGGER_TAG_GROUPS.length} groups)`,
    );
    process.exit(0);
  }

  console.error(`swagger-verify: FAIL (${allIssues.length} issues)`);
  for (const i of allIssues) console.error(`  - ${i}`);
  process.exit(1);
}

if (typeof require !== 'undefined' && require.main === module) {
  main();
}
