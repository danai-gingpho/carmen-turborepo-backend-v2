FROM node:22-slim AS builder

WORKDIR /app

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

# Install dependencies and build
RUN bun install
WORKDIR /app/apps/backend-gateway
RUN npm run build

FROM node:22-slim AS runner

WORKDIR /app

# Install bun for runtime
RUN npm install -g bun

# Copy root package files
COPY package.json .
COPY bun.lock .

# Copy packages
COPY packages ./packages

# Copy app
COPY --from=builder /app/apps/backend-gateway/package.json ./apps/backend-gateway/
COPY --from=builder /app/apps/backend-gateway/dist ./apps/backend-gateway/dist

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

# Reports service
ENV REPORT_SERVICE_HOST=api-micro-reports
ENV REPORT_SERVICE_PORT=5004
ENV REPORT_SERVICE_HTTP_PORT=6004

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

EXPOSE 4000
EXPOSE 4001

CMD ["bun", "start"]
