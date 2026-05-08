# apps/bruno

> Part of [Carmen Backend](../../README.md).

Bruno API test collections for Carmen endpoints.

## Overview

Not a runtime — a test artifact. Collections live under
[`carmen-inventory/`](carmen-inventory/) organized by domain (auth,
inventory, procurement, master data, config, etc.). Use Bruno's
CLI (`bru run`) or the Bruno desktop app to execute them against a
gateway instance.

## Dev

```bash
# Run a single request
bru run apps/bruno/carmen-inventory/auth/login/01\ -\ Login.bru

# Run an entire folder
bru run apps/bruno/carmen-inventory/inventory/ --env localhost-4000
```

Environments live in `carmen-inventory/environments/`. Login scripts
auto-populate `{{access_token}}` / `{{refresh_token}}` for subsequent
requests.

## Interface

- **Environments:** `environments/localhost-4000.bru`, `environments/dev.blueledgers.com-4001.bru`.
- **Auth chain:** login endpoints under `auth/login/` (with tenant domain variants under `domain blueledgers.com/` and `domain zebra.com/`) set `access_token` via post-response script.
- **Multi-tenant paths:** endpoints use `{{bu_code}}` for the business-unit path segment.
- **Domain folders:** `auth/`, `inventory/`, `procurement/`, `master-data/`, `config/`, `platform/`, `user-management/`, `documents-and-reports/`, `my-pending/`.

## Links

- Root: [`README.md`](../../README.md)
- API conventions: [`CLAUDE.md`](../../CLAUDE.md) "Bruno API Collections"

## Notes for agents

- Every request sends `x-app-id: {{x_app_id}}` — set this in the environment before running.
- Bearer auth uses `{{access_token}}`; login scripts refresh it automatically.
- Response wrapper: `{ data, status, success, message, timestamp }` — parse `data` for payloads.
- When adding a new endpoint, copy an existing `.bru` as a template and keep the auth + header setup intact.
