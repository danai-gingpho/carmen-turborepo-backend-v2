# ============================================================
# Stage 1: Prune monorepo — เฉพาะ dependencies ที่ service นี้ต้องการ
# ============================================================
FROM node:22-bookworm-slim AS pruner
WORKDIR /app
RUN npm install -g turbo@2
COPY . .
RUN turbo prune micro-business --docker

# ============================================================
# Stage 2: Install dependencies + build
# ============================================================
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

# Copy only package.json + lockfile (cached unless deps change)
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
RUN bun install --ignore-scripts || true

# Copy full source (only pruned subset)
COPY --from=pruner /app/out/full/ .
COPY tsconfig.json .

# Generate Prisma + build shared packages + build service
RUN bun run db:generate && bun run build:package
WORKDIR /app/apps/micro-business
RUN npm run build

# ============================================================
# Stage 3: Production runner (minimal)
# ============================================================
FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*
RUN npm install -g bun

# Copy pruned package.json files for production install
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/bun.lock ./bun.lock
ENV NODE_ENV=production
RUN bun install --ignore-scripts || true

# Copy built packages (Prisma clients + shared dist)
COPY --from=builder /app/packages ./packages

# Copy built service
COPY --from=builder /app/apps/micro-business/dist ./apps/micro-business/dist
COPY --from=builder /app/apps/micro-business/package.json ./apps/micro-business/
COPY --from=builder /app/apps/micro-business/tsconfig.json ./apps/micro-business/

WORKDIR /app/apps/micro-business

EXPOSE 5020
EXPOSE 6020

CMD ["bun", "start:prod"]
