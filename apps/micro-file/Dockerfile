# ============================================================
# Stage 1: Prune monorepo
# ============================================================
FROM node:22-bookworm-slim AS pruner
WORKDIR /app
RUN npm install -g turbo@2
COPY . .
RUN turbo prune micro-file --docker

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
WORKDIR /app/apps/micro-file
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
COPY --from=builder /app/apps/micro-file/dist ./apps/micro-file/dist
COPY --from=builder /app/apps/micro-file/package.json ./apps/micro-file/
COPY --from=builder /app/apps/micro-file/tsconfig.json ./apps/micro-file/

WORKDIR /app/apps/micro-file

EXPOSE 5007
EXPOSE 6007

CMD ["bun", "start:prod"]
