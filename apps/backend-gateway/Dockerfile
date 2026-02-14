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
COPY apps/backend-gateway ./apps/backend-gateway

# Install dependencies (turbo postinstall generates Prisma clients)
RUN bun install

WORKDIR /app/apps/backend-gateway
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

# Copy package source and Prisma generated clients from builder
COPY packages ./packages
COPY --from=builder /app/packages/prisma-shared-schema-platform/generated ./packages/prisma-shared-schema-platform/generated
COPY --from=builder /app/packages/prisma-shared-schema-platform/dist ./packages/prisma-shared-schema-platform/dist
COPY --from=builder /app/packages/prisma-shared-schema-tenant/generated ./packages/prisma-shared-schema-tenant/generated
COPY --from=builder /app/packages/prisma-shared-schema-tenant/dist ./packages/prisma-shared-schema-tenant/dist

# Copy app
COPY --from=builder /app/apps/backend-gateway/package.json ./apps/backend-gateway/
COPY --from=builder /app/apps/backend-gateway/dist ./apps/backend-gateway/dist

# Copy x-app-id.json for API access control
COPY apps/backend-gateway/x-app-id.json ./apps/backend-gateway/

# Copy SSL certificates (use .prod versions)
COPY apps/backend-gateway/src/cert/key.pem.prod ./apps/backend-gateway/src/cert/key.pem
COPY apps/backend-gateway/src/cert/cert.pem.prod ./apps/backend-gateway/src/cert/cert.pem

# Install production dependencies
ENV NODE_ENV=production
RUN bun install --no-save --ignore-scripts

WORKDIR /app/apps/backend-gateway

# Service ports
ENV GATEWAY_SERVICE_HOST=0.0.0.0
ENV GATEWAY_SERVICE_PORT=4000
ENV GATEWAY_SERVICE_HTTP_PORT=4001

# Business service (consolidated microservices)
ENV BUSINESS_SERVICE_HOST=api-micro-business
ENV BUSINESS_SERVICE_PORT=5020
ENV BUSINESS_SERVICE_HTTP_PORT=6020

# Legacy aliases - all point to micro-business
ENV AUTH_SERVICE_HOST=api-micro-business
ENV AUTH_SERVICE_PORT=5020
ENV AUTH_SERVICE_HTTP_PORT=6020

ENV CLUSTER_SERVICE_HOST=api-micro-business
ENV CLUSTER_SERVICE_PORT=5020
ENV CLUSTER_SERVICE_HTTP_PORT=6020

ENV LICENSE_SERVICE_HOST=api-micro-business
ENV LICENSE_SERVICE_PORT=5020
ENV LICENSE_SERVICE_HTTP_PORT=6020

ENV INVENTORY_SERVICE_HOST=api-micro-business
ENV INVENTORY_SERVICE_PORT=5020
ENV INVENTORY_SERVICE_HTTP_PORT=6020

ENV PROCUREMENT_SERVICE_HOST=api-micro-business
ENV PROCUREMENT_SERVICE_PORT=5020
ENV PROCUREMENT_SERVICE_HTTP_PORT=6020

ENV RECIPE_SERVICE_HOST=api-micro-business
ENV RECIPE_SERVICE_PORT=5020
ENV RECIPE_SERVICE_HTTP_PORT=6020

ENV MASTER_SERVICE_HOST=api-micro-business
ENV MASTER_SERVICE_PORT=5020
ENV MASTER_SERVICE_HTTP_PORT=6020

ENV LOG_SERVICE_HOST=api-micro-business
ENV LOG_SERVICE_PORT=5020
ENV LOG_SERVICE_HTTP_PORT=6020

# File service
ENV FILE_SERVICE_HOST=api-micro-file
ENV FILE_SERVICE_PORT=5007
ENV FILE_SERVICE_HTTP_PORT=6007

# Cronjob service
ENV CRONJOB_SERVICE_HOST=api-micro-cronjob
ENV CRONJOB_SERVICE_PORT=5012
ENV CRONJOB_SERVICE_HTTP_PORT=6012

# Keycloak API service
ENV KEYCLOAK_API_SERVICE_HOST=api-micro-keycloak-api
ENV KEYCLOAK_API_SERVICE_PORT=5013
ENV KEYCLOAK_API_SERVICE_HTTP_PORT=6013

# Notification service
ENV NOTIFICATION_SERVICE_HOST=api-micro-notification
ENV NOTIFICATION_SERVICE_PORT=5006
ENV NOTIFICATION_SERVICE_HTTP_PORT=6006

EXPOSE 4000
EXPOSE 4001

CMD ["bun", "run", "start:prod"]
