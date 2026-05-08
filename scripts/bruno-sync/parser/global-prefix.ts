import { Project, SyntaxKind } from 'ts-morph';

export function extractGlobalPrefixFromSource(sourceText: string): string {
  const project = new Project({ useInMemoryFileSystem: true });
  const sf = project.createSourceFile('main.ts', sourceText, { overwrite: true });
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression);
  for (const call of calls) {
    const expr = call.getExpression().getText();
    if (!expr.endsWith('.setGlobalPrefix')) continue;
    const [arg] = call.getArguments();
    if (!arg) return '';
    if (arg.getKind() !== SyntaxKind.StringLiteral) return '';
    const raw = arg.getText().slice(1, -1);
    return raw.replace(/^\/+|\/+$/g, '');
  }
  return '';
}

export async function readGlobalPrefix(mainTsPath: string): Promise<string> {
  const file = Bun.file(mainTsPath);
  if (!(await file.exists())) return '';
  const source = await file.text();
  return extractGlobalPrefixFromSource(source);
}
