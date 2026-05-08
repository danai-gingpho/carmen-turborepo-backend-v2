export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface EndpointMeta {
  module: string;          // e.g. "application/good-received-note"
  moduleSlug: string;      // e.g. "good-received-note" (used for folder resolution)
  controllerPath: string;
  method: HttpMethod;
  methodPath: string;
  fullPath: string;        // normalized: "/api/good-received-note/:id"
  methodName: string;      // e.g. "findOne"
  pathParams: string[];
  queryParams: string[];
  bodyDto?: string;
  isPublic: boolean;
  sourceFile: string;      // absolute path of .controller.ts
}

export interface BodySchema {
  kind: 'class' | 'zod' | 'unknown';
  dtoName: string;
  skeleton: Record<string, unknown> | unknown[];
  warnings: string[];
}

export interface BruSections {
  meta?: Record<string, string>;
  method?: { verb: string; body: string };
  headers?: string;
  auth?: Record<string, string>;
  query?: string;
  body_json?: string;
  vars_pre_request?: string;
  vars_post_response?: string;
  script_pre_request?: string;
  script_post_response?: string;
  tests?: string;
  docs?: string;
  unknown: Record<string, string>; // preserve unrecognized sections
}

export interface BruFile {
  path: string;            // absolute
  relativePath: string;    // relative to Bruno collection root
  sections: BruSections;
}

export interface DiffResult {
  created: { endpoint: EndpointMeta; targetPath: string }[];
  updated: { endpoint: EndpointMeta; bru: BruFile }[];
  orphaned: BruFile[];
  warnings: string[];
}

export interface SyncReport {
  addedCount: number;
  updatedCount: number;
  archivedCount: number;
  warnings: string[];
  parseErrors: string[];
  dryRun: boolean;
}

// ───────────────────────────────────────────────────────────────────────────
// Payload Sync types
// ───────────────────────────────────────────────────────────────────────────

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export interface OpenApiSchema {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';
  format?: string;
  example?: JsonValue;
  default?: JsonValue;
  enum?: JsonValue[];
  nullable?: boolean;
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
  items?: OpenApiSchema;
  $ref?: string;
  allOf?: OpenApiSchema[];
  oneOf?: OpenApiSchema[];
  anyOf?: OpenApiSchema[];
  additionalProperties?: boolean | OpenApiSchema;
}

export interface OpenApiMediaType {
  schema?: OpenApiSchema;
  example?: JsonValue;
}

export interface OpenApiRequestBody {
  required?: boolean;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiOperation {
  operationId?: string;
  tags?: string[];
  requestBody?: OpenApiRequestBody;
}

export interface OpenApiPathItem {
  get?: OpenApiOperation;
  post?: OpenApiOperation;
  put?: OpenApiOperation;
  patch?: OpenApiOperation;
  delete?: OpenApiOperation;
  head?: OpenApiOperation;
  options?: OpenApiOperation;
}

export interface OpenApiDocument {
  openapi?: string;
  paths: Record<string, OpenApiPathItem>;
  components?: {
    schemas?: Record<string, OpenApiSchema>;
  };
}

export type PayloadSyncStatus =
  | 'UPDATED'
  | 'SKIPPED_NOT_EMPTY'
  | 'SKIPPED_NO_BODY'
  | 'SKIPPED_NON_JSON_BODY'
  | 'NO_MATCH'
  | 'NO_REQUEST_BODY'
  | 'WARNING';

export interface PayloadSyncResult {
  filePath: string;
  relativePath: string;
  status: PayloadSyncStatus;
  warnings: string[];
  before?: string;
  after?: string;
}

export interface PayloadSyncReport {
  results: PayloadSyncResult[];
  staleOpenapi: boolean;
  dryRun: boolean;
}
