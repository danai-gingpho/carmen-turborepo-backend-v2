import { readFileSync, writeFileSync } from 'node:fs';
import type { MissingService } from './types';

export interface RegistrarResult {
  addedImports: string[];   // 'PurchaseOrderCommentModule', ...
  addedRefs: string[];       // same list (entries appended to imports[])
  alreadyPresent: string[];  // symbols already registered
}

/**
 * Patch app.module.ts: add `import { XCommentModule } from '...'` and append `XCommentModule,`
 * to the imports array.
 *
 * Strategy: text-based edits, not AST. Locate insertion points via stable anchors:
 *   - imports: insert after the last existing line matching `from '...comment.module'`
 *   - imports[]: insert after the last existing line matching `*CommentModule,` inside the array
 */
export function registerModules(
  appModulePath: string,
  services: MissingService[],
  options: { dryRun: boolean },
): RegistrarResult {
  const original = readFileSync(appModulePath, 'utf8');

  const result: RegistrarResult = {
    addedImports: [],
    addedRefs: [],
    alreadyPresent: [],
  };

  // Filter services already registered.
  const toAdd = services.filter((s) => {
    const symbol = s.names.pascalFull + 'Module';
    if (original.includes(symbol)) {
      result.alreadyPresent.push(symbol);
      return false;
    }
    return true;
  });

  if (toAdd.length === 0) {
    return result;
  }

  // Build new import lines.
  const newImportLines = toAdd
    .map((s) => {
      const sym = `${s.names.pascalFull}Module`;
      const path = `./${s.domain}/${s.kebabFull}/${s.kebabFull}.module`;
      return `import { ${sym} } from '${path}';`;
    })
    .join('\n');

  // Find anchor: last line matching `from './...comment.module';` (any domain)
  const importRegex = /^import \{ \w+CommentModule \} from '\.\/[^']+comment\.module';$/gm;
  let lastImportEnd = -1;
  for (const match of original.matchAll(importRegex)) {
    lastImportEnd = match.index! + match[0].length;
  }
  if (lastImportEnd === -1) {
    throw new Error('Could not find existing CommentModule import anchor in app.module.ts');
  }

  // Build new array entries (indented to match existing).
  const newRefLines = toAdd
    .map((s) => `    ${s.names.pascalFull}Module,`)
    .join('\n');

  // Find anchor: last line matching `    XCommentModule,` inside imports[]
  const refRegex = /^( {4})\w+CommentModule,$/gm;
  let lastRefEnd = -1;
  for (const match of original.matchAll(refRegex)) {
    lastRefEnd = match.index! + match[0].length;
  }
  if (lastRefEnd === -1) {
    throw new Error('Could not find existing CommentModule reference anchor in app.module.ts');
  }

  // Insert imports first, then refs. Since `lastRefEnd` was computed against the
  // original file, when we insert imports earlier the ref offset shifts; recompute.
  const insertedImports = original.slice(0, lastImportEnd) + '\n' + newImportLines + original.slice(lastImportEnd);
  const shift = ('\n' + newImportLines).length;
  const newRefAnchor = lastRefEnd + shift;
  const finalText = insertedImports.slice(0, newRefAnchor) + '\n' + newRefLines + insertedImports.slice(newRefAnchor);

  if (!options.dryRun) {
    writeFileSync(appModulePath, finalText, 'utf8');
  }

  result.addedImports = toAdd.map((s) => `${s.names.pascalFull}Module`);
  result.addedRefs = result.addedImports.slice();
  return result;
}
