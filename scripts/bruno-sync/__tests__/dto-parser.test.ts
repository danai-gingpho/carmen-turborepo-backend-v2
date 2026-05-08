import { describe, it, expect } from 'bun:test';
import { buildBodySkeletonFromSource } from '../parser/dto';

describe('buildBodySkeletonFromSource', () => {
  it('returns {} with warning when DTO class not found', () => {
    const result = buildBodySkeletonFromSource('', 'CreateXDto');
    expect(result.kind).toBe('unknown');
    expect(result.skeleton).toEqual({});
    expect(result.warnings[0]).toContain('CreateXDto');
  });

  it('generates skeleton for simple class DTO with primitive props', () => {
    const src = `
      export class CreateXDto {
        name!: string;
        count!: number;
        active!: boolean;
      }
    `;
    const result = buildBodySkeletonFromSource(src, 'CreateXDto');
    expect(result.kind).toBe('class');
    expect(result.skeleton).toEqual({ name: '', count: 0, active: false });
  });

  it('handles optional properties same as required (skeleton purposes)', () => {
    const src = `
      export class CreateXDto {
        required!: string;
        optional?: string;
      }
    `;
    const result = buildBodySkeletonFromSource(src, 'CreateXDto');
    expect(result.skeleton).toEqual({ required: '', optional: '' });
  });

  it('generates array placeholder for array typed props', () => {
    const src = `
      export class CreateXDto {
        tags!: string[];
      }
    `;
    const result = buildBodySkeletonFromSource(src, 'CreateXDto');
    expect(result.skeleton).toEqual({ tags: [] });
  });

  it('detects createZodDto pattern and returns zod kind with warning', () => {
    const src = `
      import { createZodDto } from 'nestjs-zod';
      export class CreateXDto extends createZodDto(someSchema) {}
    `;
    const result = buildBodySkeletonFromSource(src, 'CreateXDto');
    expect(result.kind).toBe('zod');
    expect(result.warnings.some((w) => w.includes('zod'))).toBe(true);
  });
});
