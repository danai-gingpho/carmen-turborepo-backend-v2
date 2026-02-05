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
COPY apps/micro-reports ./apps/micro-reports

# Install dependencies and build
RUN bun install
WORKDIR /app/apps/micro-reports
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
COPY --from=builder /app/apps/micro-reports/tsconfig.json ./apps/micro-reports/
COPY --from=builder /app/apps/micro-reports/package.json ./apps/micro-reports/
COPY --from=builder /app/apps/micro-reports/dist ./apps/micro-reports/dist

# Install production dependencies
ENV NODE_ENV=production
RUN bun install --no-save --ignore-scripts

# Generate Prisma client for ARM64
RUN cd /app && bunx prisma generate --schema=packages/prisma-shared-schema-platform/prisma/schema.prisma
RUN cd /app && bunx prisma generate --schema=packages/prisma-shared-schema-tenant/prisma/schema.prisma

WORKDIR /app/apps/micro-reports

EXPOSE 5004
EXPOSE 6004

CMD ["bun", "start:prod"]
