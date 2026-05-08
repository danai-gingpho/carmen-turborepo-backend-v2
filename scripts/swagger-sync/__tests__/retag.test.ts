import { describe, it, expect } from 'bun:test';
import { applyRetagToContent } from '../retag';

describe('applyRetagToContent', () => {
  it('replaces a single-arg @ApiTags', () => {
    const input = `
@Controller('api')
@ApiTags('Procurement')
export class Foo {}
`;
    const out = applyRetagToContent(input, 'Procurement: Purchase Orders');
    expect(out).toContain(`@ApiTags('Procurement: Purchase Orders')`);
    expect(out).not.toContain(`@ApiTags('Procurement')`);
  });

  it('replaces a multi-arg @ApiTags with single arg', () => {
    const input = `@ApiTags('Configuration', 'Recipe Equipment Category')\nclass X {}`;
    const out = applyRetagToContent(input, 'Config: Recipes');
    expect(out).toBe(`@ApiTags('Config: Recipes')\nclass X {}`);
  });

  it('handles multi-line @ApiTags', () => {
    const input = `@ApiTags(\n  'Old',\n  'Other',\n)\nclass X {}`;
    const out = applyRetagToContent(input, 'New');
    expect(out).toBe(`@ApiTags('New')\nclass X {}`);
  });

  it('handles double-quoted tag', () => {
    const input = `@ApiTags("Procurement")\nclass X {}`;
    const out = applyRetagToContent(input, 'Procurement: Purchase Orders');
    expect(out).toBe(`@ApiTags('Procurement: Purchase Orders')\nclass X {}`);
  });

  it('inserts @ApiTags if missing, before @Controller', () => {
    const input = `import { Controller } from '@nestjs/common';\nimport { ApiTags } from '@nestjs/swagger';\n\n@Controller('api')\nexport class Foo {}\n`;
    const out = applyRetagToContent(input, 'App Info');
    expect(out).toContain(`@ApiTags('App Info')\n@Controller('api')`);
  });

  it('adds missing import for ApiTags', () => {
    const input = `import { Controller } from '@nestjs/common';\n\n@Controller('api')\nexport class Foo {}\n`;
    const out = applyRetagToContent(input, 'App Info');
    expect(out).toContain(`import { ApiTags } from '@nestjs/swagger'`);
    expect(out).toContain(`@ApiTags('App Info')\n@Controller('api')`);
  });

  it('is idempotent — running twice produces same result', () => {
    const input = `@ApiTags('Procurement')\nclass X {}`;
    const once = applyRetagToContent(input, 'Procurement: Purchase Orders');
    const twice = applyRetagToContent(once, 'Procurement: Purchase Orders');
    expect(twice).toBe(once);
  });

  it('returns unchanged string when already correct', () => {
    const input = `@ApiTags('Procurement: Purchase Orders')\nclass X {}`;
    const out = applyRetagToContent(input, 'Procurement: Purchase Orders');
    expect(out).toBe(input);
  });
});
