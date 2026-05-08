# micro-notification

> Part of [Carmen Backend](../../README.md).

Real-time notification microservice — Socket.io push channel plus optional email dispatch.

## Overview

Services emit notification events over TCP; this service fans them out
to connected clients via Socket.io (relayed through the gateway at
`/ws`) and optionally sends email. Client connection state
is held here; gateway proxies maintain the Socket.io handshake.

## Dev

```bash
cd apps/micro-notification
bun run start:dev
```

Ports (from `src/main.ts`):
- TCP: `:5006` — inter-service RPC
- HTTP: `:6006` — also hosts Socket.io server (gateway proxies at `/ws`)

## Interface

- **TCP MessagePatterns** — emit events (notifications)
- **Socket.io** — client push (rooms scoped per user/business unit)

## Env

See [`apps/micro-notification/.env.example`](.env.example). Key variables:

- `NOTIFICATION_SERVICE_HOST` / `NOTIFICATION_SERVICE_TCP_PORT` / `NOTIFICATION_SERVICE_HTTP_PORT` — Service host and port pair

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

- Socket.io connections live on this service; scale horizontally with Redis adapter if deployed with multiple replicas.
- Gateway WS proxy maintains the client connection at `/ws` — clients should not hit this service's HTTP port directly.
- Email dispatch is handled by `src/email/email.service.ts` (optional channel; emission happens per event type in the handler).
