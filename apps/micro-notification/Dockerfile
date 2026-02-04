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
COPY apps/micro-notification ./apps/micro-notification

# Install dependencies and build
RUN bun install
WORKDIR /app/apps/micro-notification
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

# Copy packages
COPY packages ./packages

# Copy app
COPY --from=builder /app/apps/micro-notification/tsconfig.json ./apps/micro-notification/
COPY --from=builder /app/apps/micro-notification/package.json ./apps/micro-notification/
COPY --from=builder /app/apps/micro-notification/dist ./apps/micro-notification/dist

# Install production dependencies
ENV NODE_ENV=production
RUN bun install --no-save --ignore-scripts

WORKDIR /app/apps/micro-notification

# Service ports
ENV NOTIFICATION_SERVICE_HOST=0.0.0.0
ENV NOTIFICATION_SERVICE_PORT=5006
ENV NOTIFICATION_SERVICE_HTTP_PORT=6006

EXPOSE 5006
EXPOSE 6006

CMD ["bun", "run", "start:prod"]
