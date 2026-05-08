import { describe, it, expect } from 'bun:test';
import { resolveTargetFolder, buildModuleLocationIndex } from '../generator/folder-mapper';
import type { EndpointMeta, BruFile } from '../types';

const ep = (overrides: Partial<EndpointMeta> = {}): EndpointMeta => ({
  module: 'application/good-received-note',
  moduleSlug: 'good-received-note',
  controllerPath: 'good-received-note',
  method: 'GET',
  methodPath: '',
  fullPath: '/good-received-note',
  methodName: 'findAll',
  pathParams: [],
  queryParams: [],
  isPublic: false,
  sourceFile: '',
  ...overrides,
});

const bru = (relativePath: string, urlPath: string): BruFile => ({
  path: `/abs/${relativePath}`,
  relativePath,
  sections: {
    unknown: {},
    method: { verb: 'get', body: `  url: {{base_url}}${urlPath}\n  body: none` },
  },
});

describe('buildModuleLocationIndex', () => {
  it('maps moduleSlug from first path segment of URL', () => {
    const files = [
      bru('procurement/good-received-note/GET-list.bru', '/good-received-note'),
      bru('procurement/good-received-note/POST-create.bru', '/good-received-note'),
    ];
    const idx = buildModuleLocationIndex(files);
    expect(idx['good-received-note']).toBe('procurement/good-received-note');
  });

  it('chooses folder with most files when slug appears in multiple', () => {
    const files = [
      bru('procurement/good-received-note/GET-list.bru', '/good-received-note'),
      bru('procurement/good-received-note/POST-create.bru', '/good-received-note'),
      bru('old/good-received-note/GET-list.bru', '/good-received-note'),
    ];
    const idx = buildModuleLocationIndex(files);
    expect(idx['good-received-note']).toBe('procurement/good-received-note');
  });

  it('strips /api/ prefix when mapping slug', () => {
    const files = [bru('procurement/grn/GET-list.bru', '/api/grn')];
    const idx = buildModuleLocationIndex(files);
    expect(idx['grn']).toBe('procurement/grn');
  });
});

describe('resolveTargetFolder', () => {
  it('uses existing folder from location index when slug matches', () => {
    const index = { 'good-received-note': 'procurement/good-received-note' };
    expect(resolveTargetFolder(ep(), index)).toBe('procurement/good-received-note');
  });

  it('maps config_<name> to config/<name> when no existing location', () => {
    const index = {};
    expect(
      resolveTargetFolder(
        ep({
          module: 'config/config_products',
          moduleSlug: 'config_products',
        }),
        index,
      ),
    ).toBe('config/products');
  });

  it('maps platform_<name> to platform/<name>', () => {
    const index = {};
    expect(
      resolveTargetFolder(
        ep({
          module: 'platform/platform_cluster',
          moduleSlug: 'platform_cluster',
        }),
        index,
      ),
    ).toBe('platform/cluster');
  });

  it('maps plain config/<name> (no prefix) to config/<name>', () => {
    const index = {};
    expect(
      resolveTargetFolder(
        ep({ module: 'config/recipe', moduleSlug: 'recipe' }),
        index,
      ),
    ).toBe('config/recipe');
  });

  it('falls back to _uncategorized/<slug> for application modules with no existing location', () => {
    const index = {};
    expect(resolveTargetFolder(ep(), index)).toBe('_uncategorized/good-received-note');
  });
});
