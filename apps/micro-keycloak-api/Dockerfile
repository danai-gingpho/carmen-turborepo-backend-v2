FROM node:22-slim AS builder

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
COPY apps/micro-keycloak-api ./apps/micro-keycloak-api

# Install dependencies and build
RUN bun install
WORKDIR /app/apps/micro-keycloak-api
RUN npm run build

FROM node:22-slim AS runner

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
COPY --from=builder /app/apps/micro-keycloak-api/tsconfig.json ./apps/micro-keycloak-api/
COPY --from=builder /app/apps/micro-keycloak-api/package.json ./apps/micro-keycloak-api/
COPY --from=builder /app/apps/micro-keycloak-api/dist ./apps/micro-keycloak-api/dist

# Install production dependencies
ENV NODE_ENV=production
RUN bun install --no-save --ignore-scripts

WORKDIR /app/apps/micro-keycloak-api

EXPOSE 5013
EXPOSE 6013

CMD ["bun", "start:prod"]
