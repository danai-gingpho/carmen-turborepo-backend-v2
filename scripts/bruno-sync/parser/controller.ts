import { Project, type ClassDeclaration, type MethodDeclaration } from 'ts-morph';
import type { EndpointMeta, HttpMethod } from '../types';

const HTTP_DECORATORS: Record<string, HttpMethod> = {
  Get: 'GET',
  Post: 'POST',
  Patch: 'PATCH',
  Put: 'PUT',
  Delete: 'DELETE',
};

function getDecoratorStringArg(callArgs: string[]): string {
  if (callArgs.length === 0) return '';
  const first = callArgs[0].trim();
  if (first.startsWith("'") || first.startsWith('"') || first.startsWith('`')) {
    return first.slice(1, -1);
  }
  return '';
}

function joinPaths(...parts: string[]): string {
  const joined = parts
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter((p) => p.length > 0)
    .join('/');
  return '/' + joined;
}

function moduleFromPath(filePath: string): { module: string; moduleSlug: string } {
  const marker = 'apps/backend-gateway/src/';
  const idx = filePath.indexOf(marker);
  if (idx < 0) return { module: filePath, moduleSlug: '' };
  const rel = filePath.slice(idx + marker.length);
  const parts = rel.split('/');
  const module = parts.slice(0, 2).join('/');
  const moduleSlug = parts[1] ?? '';
  return { module, moduleSlug };
}

function splitTopLevelArgs(argsText: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of argsText) {
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--;
    } else if (ch === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

function extractDecoratorArgs(decoratorText: string): string[] {
  const match = decoratorText.match(/^@[A-Za-z0-9_]+\((.*)\)$/s);
  if (!match) return [];
  return splitTopLevelArgs(match[1]);
}

function parseMethod(
  _cls: ClassDeclaration,
  method: MethodDeclaration,
  controllerPath: string,
  filePath: string,
  globalPrefix: string,
): EndpointMeta | null {
  let httpMethod: HttpMethod | null = null;
  let methodPath = '';
  let isPublic = false;

  for (const dec of method.getDecorators()) {
    const name = dec.getName();
    if (name in HTTP_DECORATORS) {
      httpMethod = HTTP_DECORATORS[name];
      const args = extractDecoratorArgs(dec.getText());
      methodPath = getDecoratorStringArg(args);
    } else if (name === 'Public') {
      isPublic = true;
    }
  }
  if (!httpMethod) return null;

  const pathParams: string[] = [];
  const queryParams: string[] = [];
  let bodyDto: string | undefined;

  for (const param of method.getParameters()) {
    for (const dec of param.getDecorators()) {
      const name = dec.getName();
      const args = extractDecoratorArgs(dec.getText());
      const key = getDecoratorStringArg(args);
      if (name === 'Param' && key) {
        pathParams.push(key);
      } else if (name === 'Query' && key) {
        queryParams.push(key);
      } else if (name === 'Body') {
        const typeNode = param.getTypeNode();
        if (typeNode) {
          bodyDto = typeNode.getText().replace(/\[\]$/, '');
        }
      }
    }
  }

  const { module, moduleSlug } = moduleFromPath(filePath);

  return {
    module,
    moduleSlug,
    controllerPath,
    method: httpMethod,
    methodPath,
    fullPath: joinPaths(globalPrefix, controllerPath, methodPath),
    methodName: method.getName(),
    pathParams,
    queryParams,
    bodyDto,
    isPublic,
    sourceFile: filePath,
  };
}

export function parseControllerSource(
  sourceText: string,
  filePath: string,
  globalPrefix: string,
): EndpointMeta[] {
  const project = new Project({ useInMemoryFileSystem: true });
  const sf = project.createSourceFile(filePath, sourceText, { overwrite: true });
  const endpoints: EndpointMeta[] = [];
  for (const cls of sf.getClasses()) {
    const controllerDec = cls.getDecorator('Controller');
    if (!controllerDec) continue;
    const args = extractDecoratorArgs(controllerDec.getText());
    const controllerPath = getDecoratorStringArg(args);
    for (const method of cls.getMethods()) {
      const ep = parseMethod(cls, method, controllerPath, filePath, globalPrefix);
      if (ep) endpoints.push(ep);
    }
  }
  return endpoints;
}

export async function parseControllerFile(
  filePath: string,
  globalPrefix: string,
): Promise<EndpointMeta[]> {
  const text = await Bun.file(filePath).text();
  return parseControllerSource(text, filePath, globalPrefix);
}
