# Deploy new platform schema

``` bash

cd packages/prisma-shared-schema-platform

echo "SYSTEM_DATABASE_URL=postgresql://developer:123456@dev.blueledgers.com:6432?schema=CARMEN_SYSTEM
SYSTEM_DIRECT_URL=postgresql://developer:123456@dev.blueledgers.com:6432?schema=CARMEN_SYSTEM_X" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy

```
