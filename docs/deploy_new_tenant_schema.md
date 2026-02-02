# Deploy new tenant schema

``` bash

cd packages/prisma-shared-schema-tenant

echo "DATABASE_URL=postgresql://developer:123456@dev.blueledgers.com:6432?schema=B01" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy

echo "DATABASE_URL=postgresql://postgres.mfhdnmxqjiplmpfjmxbh:8wzw8O77O0VAGDnt@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?schema=A01" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy

echo "DATABASE_URL=postgresql://postgres:postgres@www.semapru.com:5432/postgres?schema=A01" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy


```

``` bash

echo "SYSTEM_DATABASE_URL=postgresql://developer:123456@dev.blueledgers.com:5432/postgres?schema=CARMEN_SYSTEM
SYSTEM_DIRECT_URL=postgresql://developer:123456@dev.blueledgers.com:5432/postgres?schema=CARMEN_SYSTEM" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy


echo "SYSTEM_DATABASE_URL=postgresql://postgres:postgres@www.semapru.com:5432/postgres?schema=CARMEN_SYSTEM
SYSTEM_DIRECT_URL=postgresql://postgres:postgres@www.semapru.com:5432/postgres?schema=CARMEN_SYSTEM" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy


echo "SYSTEM_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=CARMEN_SYSTEM
SYSTEM_DIRECT_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=CARMEN_SYSTEM" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy

```


deploy script

echo "DATABASE_URL=postgresql://developer:123456@dev.blueledgers.com:6432?schema=A01" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy
echo "DATABASE_URL=postgresql://developer:123456@dev.blueledgers.com:6432?schema=A02" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy
echo "DATABASE_URL=postgresql://developer:123456@dev.blueledgers.com:6432?schema=C01" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy
echo "DATABASE_URL=postgresql://developer:123456@dev.blueledgers.com:6432?schema=C02" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy
echo "DATABASE_URL=postgresql://developer:123456@dev.blueledgers.com:6432?schema=T01" > .env.production & dotenvx run --env-file=.env.production -- bun run db:deploy
