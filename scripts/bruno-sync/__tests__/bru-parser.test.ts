import { describe, it, expect } from 'bun:test';
import { parseBruText } from '../generator/bru-parser';

const sample = `meta {
  name: List GRNs
  type: http
  seq: 3
}

get {
  url: {{base_url}}/api/good-received-note
  body: none
  auth: bearer
}

headers {
  x-app-id: {{x_app_id}}
}

auth:bearer {
  token: {{access_token}}
}

body:json {
  {
    "foo": "bar"
  }
}

script:post-response {
  bru.setVar('last_id', res.body.data.id);
}

docs {
  list GRNs
}
`;

describe('parseBruText', () => {
  it('parses meta block into key-value map', () => {
    const s = parseBruText(sample);
    expect(s.meta?.name).toBe('List GRNs');
    expect(s.meta?.seq).toBe('3');
  });

  it('captures HTTP verb section and body', () => {
    const s = parseBruText(sample);
    expect(s.method?.verb).toBe('get');
    expect(s.method?.body).toContain('{{base_url}}/api/good-received-note');
  });

  it('preserves script:post-response block verbatim', () => {
    const s = parseBruText(sample);
    expect(s.script_post_response).toContain("bru.setVar('last_id'");
  });

  it('captures body:json block content', () => {
    const s = parseBruText(sample);
    expect(s.body_json).toContain('"foo": "bar"');
  });

  it('captures docs block', () => {
    const s = parseBruText(sample);
    expect(s.docs).toContain('list GRNs');
  });
});
