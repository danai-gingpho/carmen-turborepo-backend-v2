import { describe, it, expect } from 'bun:test';
import { mergeGeneratedWithExisting } from '../reconciler/merger';
import { parseBruText } from '../generator/bru-parser';

const existingWithScript = `meta {
  name: Old Name
  type: http
  seq: 7
}

get {
  url: {{base_url}}/wrong/path
  body: none
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

script:post-response {
  bru.setVar('grn_id', res.body.data.id);
}

tests {
  test('status 200', () => expect(res.status).to.equal(200));
}

docs {
  manually written docs
}
`;

const generatedFresh = `meta {
  name: List good-received-note
  type: http
  seq: 1
}

get {
  url: {{base_url}}/good-received-note
  body: none
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}
`;

describe('mergeGeneratedWithExisting', () => {
  it('keeps existing seq from meta', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    const parsed = parseBruText(out);
    expect(parsed.meta?.seq).toBe('7');
  });

  it('overwrites url with generated path', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    expect(out).toContain('{{base_url}}/good-received-note');
    expect(out).not.toContain('/wrong/path');
  });

  it('preserves script:post-response block', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    expect(out).toContain("bru.setVar('grn_id'");
  });

  it('preserves tests block', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    expect(out).toContain("test('status 200'");
  });

  it('preserves existing docs block', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    expect(out).toContain('manually written docs');
  });

  it('uses generated name even if existing name differed', () => {
    const out = mergeGeneratedWithExisting(generatedFresh, existingWithScript);
    const parsed = parseBruText(out);
    expect(parsed.meta?.name).toBe('List good-received-note');
  });
});
