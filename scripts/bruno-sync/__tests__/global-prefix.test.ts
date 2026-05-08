import { describe, it, expect } from 'bun:test';
import { extractGlobalPrefixFromSource } from '../parser/global-prefix';

describe('extractGlobalPrefixFromSource', () => {
  it('returns empty string when no setGlobalPrefix call exists', () => {
    const source = `
      import { NestFactory } from '@nestjs/core';
      const app = await NestFactory.create(AppModule);
      await app.listen(3000);
    `;
    expect(extractGlobalPrefixFromSource(source)).toBe('');
  });

  it('returns the literal prefix when setGlobalPrefix uses a string literal', () => {
    const source = `
      const app = await NestFactory.create(AppModule);
      app.setGlobalPrefix('api');
    `;
    expect(extractGlobalPrefixFromSource(source)).toBe('api');
  });

  it('strips leading and trailing slashes from prefix', () => {
    const source = `app.setGlobalPrefix('/api/v1/');`;
    expect(extractGlobalPrefixFromSource(source)).toBe('api/v1');
  });

  it('returns empty string for non-literal argument (flagged as unsupported)', () => {
    const source = `app.setGlobalPrefix(process.env.PREFIX);`;
    expect(extractGlobalPrefixFromSource(source)).toBe('');
  });
});
