import { Project, type ClassDeclaration } from 'ts-morph';
import type { BodySchema } from '../types';
import { DTO_MAX_DEPTH } from '../config';

/**
 * Returns the primitive zero-value for a given TypeScript type text.
 * Arrays return [], objects return {}, strings return '', numbers 0, booleans false.
 */
function primitiveFor(typeText: string): unknown {
  const t = typeText.replace(/\s+/g, '');
  if (t.endsWith('[]') || t.startsWith('Array<')) return [];
  if (t === 'string' || t === 'String') return '';
  if (t === 'number' || t === 'Number') return 0;
  if (t === 'boolean' || t === 'Boolean') return false;
  if (t === 'Date') return '';
  if (t.startsWith('Record<') || t === 'object' || t === 'Object') return {};
  return '';
}

/**
 * Returns true when the class extends createZodDto(...), indicating a Zod-based DTO.
 */
function isZodDto(cls: ClassDeclaration): boolean {
  const ext = cls.getExtends();
  if (!ext) return false;
  const text = ext.getText();
  return text.includes('createZodDto');
}

/**
 * Converts a class declaration's properties into a skeleton object with zero-values.
 * Respects a maximum recursion depth defined by DTO_MAX_DEPTH.
 */
function classToSkeleton(cls: ClassDeclaration, depth: number): Record<string, unknown> {
  if (depth > DTO_MAX_DEPTH) return {};
  const out: Record<string, unknown> = {};
  for (const prop of cls.getProperties()) {
    const name = prop.getName();
    const typeNode = prop.getTypeNode();
    const typeText = typeNode ? typeNode.getText() : 'any';
    out[name] = primitiveFor(typeText);
  }
  return out;
}

/**
 * Parses a TypeScript source string and builds a BodySchema skeleton for the named DTO class.
 * Returns kind 'unknown' if the class is not found, 'zod' if it extends createZodDto,
 * or 'class' with property-derived zero-values.
 */
export function buildBodySkeletonFromSource(
  sourceText: string,
  dtoName: string,
): BodySchema {
  const warnings: string[] = [];
  const project = new Project({ useInMemoryFileSystem: true });
  const sf = project.createSourceFile('dto.ts', sourceText, { overwrite: true });
  const cls = sf.getClass(dtoName);
  if (!cls) {
    warnings.push(`DTO class '${dtoName}' not found in source`);
    return { kind: 'unknown', dtoName, skeleton: {}, warnings };
  }
  if (isZodDto(cls)) {
    warnings.push(`DTO '${dtoName}' uses zod schema; skeleton left empty`);
    return { kind: 'zod', dtoName, skeleton: {}, warnings };
  }
  const skeleton = classToSkeleton(cls, 0);
  return { kind: 'class', dtoName, skeleton, warnings };
}
