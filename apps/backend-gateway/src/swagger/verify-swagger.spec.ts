import {
  runInvariants,
  extractApiTag,
  buildSyntheticDoc,
  type OpenApiDocLite,
} from '../../scripts/verify-swagger';
import { SWAGGER_TAGS, SWAGGER_TAG_GROUPS } from './tag-groups';

const declaredTagNames = SWAGGER_TAGS.map((t) => t.name);

function baseDoc(tagsOnOp: string[]): OpenApiDocLite {
  return {
    paths: {
      '/a': { get: { tags: tagsOnOp } },
    },
    'x-tagGroups': SWAGGER_TAG_GROUPS,
  };
}

describe('runInvariants', () => {
  it('passes for a document that uses a declared tag inside a group', () => {
    const doc: OpenApiDocLite = {
      paths: Object.fromEntries(
        declaredTagNames.map((name, i) => [`/op${i}`, { get: { tags: [name] } }]),
      ),
      'x-tagGroups': SWAGGER_TAG_GROUPS,
    };
    const result = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
    expect(result.failures).toEqual([]);
  });

  it('fails when an operation has no tags', () => {
    const doc = baseDoc([]);
    const result = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
    expect(result.failures.some((f) => /untagged/i.test(f))).toBe(true);
  });

  it('fails when an operation uses an undeclared tag', () => {
    const doc = baseDoc(['Nonexistent Tag']);
    const result = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
    expect(result.failures.some((f) => /undeclared/i.test(f))).toBe(true);
  });

  it('fails when a declared tag is not used by any operation', () => {
    const doc: OpenApiDocLite = { paths: {}, 'x-tagGroups': SWAGGER_TAG_GROUPS };
    const result = runInvariants(doc, SWAGGER_TAGS, SWAGGER_TAG_GROUPS);
    expect(result.failures.some((f) => /unused/i.test(f))).toBe(true);
  });

  it('fails when x-tagGroups references a tag not in SWAGGER_TAGS', () => {
    const doc: OpenApiDocLite = {
      paths: Object.fromEntries(
        declaredTagNames.map((name, i) => [`/op${i}`, { get: { tags: [name] } }]),
      ),
      'x-tagGroups': [{ name: 'Bogus', tags: ['Nope'] }, ...SWAGGER_TAG_GROUPS],
    };
    const result = runInvariants(doc, SWAGGER_TAGS, [
      { name: 'Bogus', tags: ['Nope'] },
      ...SWAGGER_TAG_GROUPS,
    ]);
    expect(result.failures.some((f) => /group.*Bogus.*Nope/i.test(f))).toBe(true);
  });

  it('fails when a declared tag is not part of any group', () => {
    const reducedGroups = SWAGGER_TAG_GROUPS.map((g) =>
      g.name === 'Getting Started' ? { ...g, tags: ['Authentication'] } : g,
    );
    const doc: OpenApiDocLite = {
      paths: Object.fromEntries(
        declaredTagNames.map((name, i) => [`/op${i}`, { get: { tags: [name] } }]),
      ),
      'x-tagGroups': reducedGroups,
    };
    const result = runInvariants(doc, SWAGGER_TAGS, reducedGroups);
    expect(result.failures.some((f) => /App Info.*not in any group/i.test(f))).toBe(true);
  });
});

describe('extractApiTag', () => {
  it('extracts single-quoted tag', () => {
    expect(extractApiTag(`@ApiTags('Procurement: Purchase Orders')`)).toBe(
      'Procurement: Purchase Orders',
    );
  });

  it('extracts double-quoted tag', () => {
    expect(extractApiTag(`@ApiTags("App Info")`)).toBe('App Info');
  });

  it('returns null when no @ApiTags present', () => {
    expect(extractApiTag(`@Controller('api') class X {}`)).toBeNull();
  });

  it('extracts first tag when multiple args (legacy)', () => {
    expect(extractApiTag(`@ApiTags('A', 'B')`)).toBe('A');
  });
});

describe('buildSyntheticDoc', () => {
  it('builds a path per controller with the extracted tag', () => {
    const mapping = { 'a.controller.ts': 'App Info' };
    const { doc, mismatches } = buildSyntheticDoc(mapping, () => `@ApiTags('App Info')\nclass X {}`);
    expect(mismatches).toEqual([]);
    expect(doc.paths['a.controller.ts'].get.tags).toEqual(['App Info']);
  });

  it('reports a mismatch when source tag differs from mapping', () => {
    const mapping = { 'a.controller.ts': 'App Info' };
    const { mismatches } = buildSyntheticDoc(mapping, () => `@ApiTags('Stale')\nclass X {}`);
    expect(mismatches.length).toBe(1);
    expect(mismatches[0]).toContain('Stale');
    expect(mismatches[0]).toContain('App Info');
  });

  it('reports a mismatch when @ApiTags is missing', () => {
    const mapping = { 'a.controller.ts': 'App Info' };
    const { mismatches } = buildSyntheticDoc(mapping, () => `class X {}`);
    expect(mismatches.length).toBe(1);
    expect(mismatches[0]).toContain('no @ApiTags');
  });
});
