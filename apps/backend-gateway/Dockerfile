# ============================================================
# Stage 1: Prune monorepo
# ============================================================
FROM node:22-bookworm-slim AS pruner
WORKDIR /app
RUN npm install -g turbo@2
COPY . .
RUN turbo prune backend-gateway --docker

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
WORKDIR /app/apps/backend-gateway
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

# Copy built packages (Prisma clients + shared dist)
COPY --from=builder /app/packages ./packages

# Copy built gateway
COPY --from=builder /app/apps/backend-gateway/dist ./apps/backend-gateway/dist
COPY --from=builder /app/apps/backend-gateway/package.json ./apps/backend-gateway/

# Copy x-app-id.json for API access control
COPY apps/backend-gateway/x-app-id.json ./apps/backend-gateway/

# Copy proto definitions for gRPC services
COPY apps/backend-gateway/proto ./apps/backend-gateway/proto

# Copy SSL certificates (.prod versions)
COPY apps/backend-gateway/src/cert/key.pem.prod ./apps/backend-gateway/src/cert/key.pem
COPY apps/backend-gateway/src/cert/cert.pem.prod ./apps/backend-gateway/src/cert/cert.pem

WORKDIR /app/apps/backend-gateway

EXPOSE 4000
EXPOSE 4001

CMD ["bun", "run", "start:prod"]
