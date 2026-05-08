import { SWAGGER_TAGS, SWAGGER_TAG_GROUPS } from './tag-groups';

describe('SWAGGER_TAGS', () => {
  it('has 52 entries', () => {
    expect(SWAGGER_TAGS).toHaveLength(52);
  });

  it('has no duplicate names', () => {
    const names = SWAGGER_TAGS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every tag has a non-empty description', () => {
    for (const t of SWAGGER_TAGS) {
      expect(t.description.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('SWAGGER_TAG_GROUPS', () => {
  it('has 9 groups', () => {
    expect(SWAGGER_TAG_GROUPS).toHaveLength(9);
  });

  it('group names are unique', () => {
    const names = SWAGGER_TAG_GROUPS.map((g) => g.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('every group tag exists in SWAGGER_TAGS', () => {
    const declared = new Set(SWAGGER_TAGS.map((t) => t.name));
    for (const g of SWAGGER_TAG_GROUPS) {
      for (const tagName of g.tags) {
        expect(declared.has(tagName)).toBe(true);
      }
    }
  });

  it('every declared tag appears in exactly one group', () => {
    const counts = new Map<string, number>();
    for (const g of SWAGGER_TAG_GROUPS) {
      for (const tagName of g.tags) {
        counts.set(tagName, (counts.get(tagName) ?? 0) + 1);
      }
    }
    for (const t of SWAGGER_TAGS) {
      expect(counts.get(t.name)).toBe(1);
    }
  });

  it('groups are in documented order', () => {
    expect(SWAGGER_TAG_GROUPS.map((g) => g.name)).toEqual([
      'Getting Started',
      'Platform Administration',
      'Business Unit Configuration',
      'Procurement',
      'Inventory',
      'Workflow & Approval',
      'Reporting & Insights',
      'Notifications',
      'User Profile & Access',
    ]);
  });
});
