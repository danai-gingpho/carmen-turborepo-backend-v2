FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*

# Install bun for dependency management
RUN npm install -g bun

# Copy root package files
COPY package.json .
COPY bun.lock .
COPY tsconfig.json .
COPY turbo.json .

# Copy all packages
COPY packages ./packages

# Copy app
COPY apps/micro-cronjob ./apps/micro-cronjob

# Install dependencies and build
RUN bun install

# Generate Prisma clients in builder stage (has all dependencies)
RUN bunx prisma generate --schema=packages/prisma-shared-schema-platform/prisma/schema.prisma
RUN bunx prisma generate --schema=packages/prisma-shared-schema-tenant/prisma/schema.prisma
RUN bunx prisma generate --schema=apps/micro-cronjob/prisma/schema.prisma

WORKDIR /app/apps/micro-cronjob
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl libssl3 && rm -rf /var/lib/apt/lists/*

# Install bun for runtime
RUN npm install -g bun

# Copy root package files
COPY package.json .
COPY bun.lock .
COPY tsconfig.json .

# Copy built packages from builder (including their dist folders)
COPY --from=builder /app/packages ./packages

# Copy app tsconfig for path resolution
COPY --from=builder /app/apps/micro-cronjob/tsconfig.json ./apps/micro-cronjob/
COPY --from=builder /app/apps/micro-cronjob/package.json ./apps/micro-cronjob/
COPY --from=builder /app/apps/micro-cronjob/dist ./apps/micro-cronjob/dist
COPY --from=builder /app/apps/micro-cronjob/generated ./apps/micro-cronjob/generated

# Install production dependencies
ENV NODE_ENV=production
RUN bun install --no-save --ignore-scripts

WORKDIR /app/apps/micro-cronjob

EXPOSE 5012
EXPOSE 6012

CMD ["bun", "start:prod"]
