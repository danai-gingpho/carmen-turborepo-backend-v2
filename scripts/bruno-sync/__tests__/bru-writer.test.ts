import { describe, it, expect } from 'bun:test';
import { writeBruText, fileNameForEndpoint } from '../generator/bru-writer';
import type { EndpointMeta } from '../types';

const baseEndpoint: EndpointMeta = {
  module: 'application/good-received-note',
  moduleSlug: 'good-received-note',
  controllerPath: 'good-received-note',
  method: 'GET',
  methodPath: '',
  fullPath: '/good-received-note',
  methodName: 'findAll',
  pathParams: [],
  queryParams: ['limit'],
  isPublic: false,
  sourceFile: '/x/grn.controller.ts',
};

describe('fileNameForEndpoint', () => {
  it('maps findAll to GET-list.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'findAll', method: 'GET' })).toBe('GET-list.bru');
  });
  it('maps findOne to GET-by-id.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'findOne', method: 'GET' })).toBe('GET-by-id.bru');
  });
  it('maps createOne to POST-create.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'createOne', method: 'POST' })).toBe('POST-create.bru');
  });
  it('maps update to PATCH-update.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'update', method: 'PATCH' })).toBe('PATCH-update.bru');
  });
  it('maps remove to DELETE-remove.bru', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'remove', method: 'DELETE' })).toBe('DELETE-remove.bru');
  });
  it('falls back to method-name kebab for unknown verbs', () => {
    expect(fileNameForEndpoint({ ...baseEndpoint, methodName: 'approveBatch', method: 'POST' })).toBe('POST-approve-batch.bru');
  });
});

describe('writeBruText', () => {
  it('emits meta, verb, headers, auth blocks for authenticated GET', () => {
    const text = writeBruText({
      endpoint: baseEndpoint,
      seq: 1,
      bodySkeleton: {},
    });
    expect(text).toContain('meta {');
    expect(text).toContain('name: List good-received-note');
    expect(text).toContain('seq: 1');
    expect(text).toContain('get {');
    expect(text).toContain('url: {{host}}/good-received-note');
    expect(text).toContain('auth:bearer');
    expect(text).toContain('{{access_token}}');
    expect(text).toContain('x-app-id: {{x_app_id}}');
  });

  it('emits body:json block for POST with DTO skeleton', () => {
    const ep: EndpointMeta = { ...baseEndpoint, method: 'POST', methodName: 'createOne', methodPath: '', bodyDto: 'CreateGrnDto' };
    const text = writeBruText({ endpoint: ep, seq: 2, bodySkeleton: { name: '', items: [] } });
    expect(text).toContain('post {');
    expect(text).toContain('body: json');
    expect(text).toContain('"name": ""');
    expect(text).toContain('"items": []');
  });

  it('omits auth block for @Public endpoints', () => {
    const ep: EndpointMeta = { ...baseEndpoint, isPublic: true };
    const text = writeBruText({ endpoint: ep, seq: 1, bodySkeleton: {} });
    expect(text).not.toContain('auth:bearer');
    expect(text).toContain('auth: none');
  });

  it('leaves :id path params unchanged (non-env-var)', () => {
    const ep: EndpointMeta = {
      ...baseEndpoint,
      method: 'GET',
      methodName: 'findOne',
      fullPath: '/good-received-note/:id',
      pathParams: ['id'],
    };
    const text = writeBruText({ endpoint: ep, seq: 1, bodySkeleton: {} });
    expect(text).toContain('/good-received-note/:id');
    expect(text).not.toContain('{{id}}');
  });

  it('keeps :bu_code mapped to {{bu_code}} (env var)', () => {
    const ep: EndpointMeta = {
      ...baseEndpoint,
      fullPath: '/bu/:bu_code/good-received-note',
      pathParams: ['bu_code'],
    };
    const text = writeBruText({ endpoint: ep, seq: 1, bodySkeleton: {} });
    expect(text).toContain('{{bu_code}}');
  });
});
