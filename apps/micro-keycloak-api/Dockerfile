# ============================================================
# Stage 1: Prune monorepo
# ============================================================
FROM node:22-bookworm-slim AS pruner
WORKDIR /app
RUN npm install -g turbo@2
COPY . .
RUN turbo prune micro-keycloak-api --docker

# ============================================================
# Stage 2: Install dependencies + build
# ============================================================
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --ignore-scripts || true

COPY --from=pruner /app/out/full/ .
COPY tsconfig.json .

RUN bun run db:generate && bun run build:package
WORKDIR /app/apps/micro-keycloak-api
RUN npm run build

# ============================================================
# Stage 3: Production runner
# ============================================================
FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
ENV NODE_ENV=production
RUN bun install --ignore-scripts || true

COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/micro-keycloak-api/dist ./apps/micro-keycloak-api/dist
COPY --from=builder /app/apps/micro-keycloak-api/package.json ./apps/micro-keycloak-api/
COPY --from=builder /app/apps/micro-keycloak-api/tsconfig.json ./apps/micro-keycloak-api/

WORKDIR /app/apps/micro-keycloak-api

EXPOSE 5013
EXPOSE 6013

CMD ["bun", "start:prod"]
