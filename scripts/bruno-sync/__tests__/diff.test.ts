import { describe, it, expect } from 'bun:test';
import { diffEndpoints } from '../reconciler/diff';
import type { EndpointMeta, BruFile } from '../types';

const ep = (o: Partial<EndpointMeta> = {}): EndpointMeta => ({
  module: 'application/grn',
  moduleSlug: 'grn',
  controllerPath: 'grn',
  method: 'GET',
  methodPath: '',
  fullPath: '/grn',
  methodName: 'findAll',
  pathParams: [],
  queryParams: [],
  isPublic: false,
  sourceFile: '',
  ...o,
});

const bru = (relativePath: string, url: string, verb = 'get'): BruFile => ({
  path: `/abs/${relativePath}`,
  relativePath,
  sections: {
    unknown: {},
    method: { verb, body: `  url: {{base_url}}${url}\n  body: none` },
  },
});

describe('diffEndpoints', () => {
  it('classifies an endpoint with no matching .bru as NEW', () => {
    const result = diffEndpoints({
      endpoints: [ep({ fullPath: '/grn', method: 'GET' })],
      bruFiles: [],
      locationIndex: {},
    });
    expect(result.created).toHaveLength(1);
    expect(result.updated).toHaveLength(0);
    expect(result.orphaned).toHaveLength(0);
  });

  it('classifies a matching endpoint + .bru as UPDATE', () => {
    const result = diffEndpoints({
      endpoints: [ep({ fullPath: '/grn', method: 'GET' })],
      bruFiles: [bru('procurement/grn/GET-list.bru', '/grn', 'get')],
      locationIndex: { grn: 'procurement/grn' },
    });
    expect(result.updated).toHaveLength(1);
    expect(result.created).toHaveLength(0);
    expect(result.orphaned).toHaveLength(0);
  });

  it('classifies a .bru with no matching endpoint as ORPHAN', () => {
    const result = diffEndpoints({
      endpoints: [],
      bruFiles: [bru('old/obsolete/GET-list.bru', '/obsolete', 'get')],
      locationIndex: {},
    });
    expect(result.orphaned).toHaveLength(1);
    expect(result.created).toHaveLength(0);
    expect(result.updated).toHaveLength(0);
  });

  it('matches by normalized path + method (ignoring trailing slash)', () => {
    const result = diffEndpoints({
      endpoints: [ep({ fullPath: '/grn', method: 'GET' })],
      bruFiles: [bru('procurement/grn/GET-list.bru', '/grn/', 'get')],
      locationIndex: { grn: 'procurement/grn' },
    });
    expect(result.updated).toHaveLength(1);
  });

  it('matches endpoint :param paths to .bru {{param}} paths', () => {
    const result = diffEndpoints({
      endpoints: [ep({ fullPath: '/api/:bu_code/grn', method: 'GET', moduleSlug: 'grn' })],
      bruFiles: [bru('procurement/grn/GET-list.bru', '/api/{{bu_code}}/grn', 'get')],
      locationIndex: { grn: 'procurement/grn' },
    });
    expect(result.updated).toHaveLength(1);
    expect(result.created).toHaveLength(0);
    expect(result.orphaned).toHaveLength(0);
  });

  it('matches mixed :param and {{envvar}} paths via normalization', () => {
    const result = diffEndpoints({
      endpoints: [ep({ fullPath: '/api/:bu_code/grn/:id', method: 'GET', moduleSlug: 'grn' })],
      bruFiles: [bru('procurement/grn/GET-by-id.bru', '/api/{{bu_code}}/grn/:id', 'get')],
      locationIndex: { grn: 'procurement/grn' },
    });
    expect(result.updated).toHaveLength(1);
  });

  it('ignores query string on .bru URL when matching endpoint path', () => {
    const result = diffEndpoints({
      endpoints: [ep({ fullPath: '/api/:bu_code/products', method: 'GET', moduleSlug: 'products' })],
      bruFiles: [bru('config/products/GET-list.bru', '/api/{{bu_code}}/products?filter=x|string:abc&perpage=-1', 'get')],
      locationIndex: { products: 'config/products' },
    });
    expect(result.updated).toHaveLength(1);
    expect(result.orphaned).toHaveLength(0);
  });

  it('two endpoints same path but different method are distinct', () => {
    const result = diffEndpoints({
      endpoints: [
        ep({ fullPath: '/grn', method: 'GET', methodName: 'findAll' }),
        ep({ fullPath: '/grn', method: 'POST', methodName: 'createOne' }),
      ],
      bruFiles: [bru('procurement/grn/GET-list.bru', '/grn', 'get')],
      locationIndex: { grn: 'procurement/grn' },
    });
    expect(result.updated).toHaveLength(1);
    expect(result.created).toHaveLength(1);
    expect(result.created[0].endpoint.method).toBe('POST');
  });
});
