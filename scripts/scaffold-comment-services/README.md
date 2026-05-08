# scaffold-comment-services

Generates `*.controller.ts` / `*.service.ts` / `*.module.ts` files in
`apps/micro-business/src/{domain}/{kebab-comment}/` for every gateway
`*-comment` route that lacks a backing handler, using
`purchase-request-comment` as the template.

## Usage

```bash
bun run scaffold:comments:dry   # preview only
bun run scaffold:comments       # apply changes
```

The codemod is idempotent — files that already exist are not overwritten,
and modules already imported in `app.module.ts` are not re-added.

## What it does

1. Lists every `apps/backend-gateway/src/application/*-comment/` directory.
2. For each, finds the matching `apps/micro-business/src/{domain}/{kebab}/dto/` folder
   to determine domain.
3. Skips ones that already have `{kebab}.controller.ts` in micro-business.
4. Renders 3 files per missing service from the template, substituting
   every form of the entity name.
5. Patches `app.module.ts` with the new imports + array entries.

## Limitations

- Generated code is a 1:1 copy of the template. Bugs in the template are inherited.
- Template requires a `dto/` folder to already exist in the target domain — the codemod
  will warn and skip services without one.
