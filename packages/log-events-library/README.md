# @repo/log-events-library

> Part of [Carmen Backend](../../README.md).

Audit logging library — interceptors, Zod schemas, and writers for structured event records.

## Overview

Services consume this library to emit audit events (access, create, update, delete, login, logout). The library provides a NestJS interceptor that captures execution context, validates events against Zod schemas, and writes JSON-serialized events to file or database storage. Consumer services register the `LogEventsModule` once; each endpoint decorated with audit context contributes to the event log.

## Interface

Import as `@repo/log-events-library`. Main exports:

**Schemas & Types**
- `AuditActionSchema` — Zod enum for audit actions: `'access' | 'create' | 'update' | 'delete' | 'login' | 'logout'`
- `LogEventEntrySchema` — Full audit event record schema (validates before writing)
- `LogEventsConfigSchema` — Configuration schema for the module
- `AuditContextSchema` — Schema for request-level audit metadata
- Inferred types: `LogEventEntryModel`, `LogEventsConfigModel`, `AuditContextModel`

**Interceptor**
- `AuditContextInterceptor` — NestJS `NestInterceptor` that wraps handler execution and populates audit context from request metadata

**Context**
- `auditContextStorage` — `AsyncLocalStorage<AuditContext>` for thread-safe context isolation per request

**Writers**
- `AuditFileWriter` — Appends JSON-line audit events to a per-service log file
- `BufferManager` — In-memory buffer with flushing strategy
- Database writer support for persistent audit storage

**Service**
- `LogEventsService` — Orchestrates event validation and routing to configured writers

**Module**
- `LogEventsModule` — NestJS module (use `forRoot()` / `forFeature()` to register; respects `OnModuleDestroy`)
- `LOG_EVENTS_OPTIONS` — Injection token for module config
- `AUDIT_BUFFER_MANAGER` — Injection token for buffer manager singleton

## Links

- Root: [`README.md`](../../README.md) · [`CLAUDE.md`](../../CLAUDE.md)
- Shared packages overview: [`CLAUDE.md`](../../CLAUDE.md#shared-packages)

## Notes for agents

- The interceptor captures user ID and request metadata from the NestJS execution context. Ensure `KeycloakGuard` or equivalent authentication guard runs *before* `AuditContextInterceptor` in the middleware/guard chain.
- Event shape is strict Zod-validated — adding or removing audit fields requires updating schemas *first*, then consumers.
- `BufferManager` flushes on module destroy; if the process exits unexpectedly, buffered events may be lost. Consider tuning buffer size and flush interval for your SLA.
- File writer appends JSON lines (one event per line). Log rotation and cleanup are the responsibility of the deployment environment (e.g., `logrotate` or Docker log drivers).
- Do not log PII (passwords, SSNs, credit cards) in audit events. Sanitize at the call site or in a custom writer.
- Async context (`AsyncLocalStorage`) is not propagated to spawned child processes or worker threads; audit context is isolated per request thread.
