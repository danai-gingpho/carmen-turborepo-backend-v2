# micro-file

> Part of [Carmen Backend](../../README.md).

File storage microservice — uploads, downloads, object storage backing.

## Overview

Handles binary file persistence for Carmen. Gateway forwards upload requests over TCP; files are streamed to an object store (MinIO or S3 depending on env). The HTTP side serves downloads and can issue presigned URLs for direct client access.

## Dev

```bash
cd apps/micro-file
bun run start:dev
```

Ports (from `src/main.ts`):
- TCP: `:5007` (microservice RPC)
- HTTP: `:6007` (direct access, health checks, binary streams)

## Interface

- **TCP MessagePatterns** handle file CRUD (upload / get metadata / delete).
- **HTTP** serves binary streams and health endpoints.

## Env

Key variables (see [`apps/micro-file/.env.example`](.env.example) for the full list):
- `FILE_SERVICE_HOST` / `FILE_SERVICE_TCP_PORT` / `FILE_SERVICE_HTTP_PORT` — binding address and ports.
- `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` — object store credentials.
- `MINIO_BUCKET` — target bucket name.

## Test

```bash
bun run test
bun run test:watch
bun run test:cov
bun run test:e2e
```

## Links

- Root: [`README.md`](../../README.md) · [`CLAUDE.md`](../../CLAUDE.md)
- Architecture: [`docs/architecture-system.md`](../../docs/architecture-system.md)

## Notes for agents

- Storage backend is env-driven (MinIO vs S3); code should not hardcode the provider.
- Binary streams are served over HTTP, not TCP — the TCP channel carries metadata only.
- Presigned URL generation lives on this service; consumers should request via TCP MessagePattern.
- Upload size limits come from env / middleware; adjust centrally, not per-route.
