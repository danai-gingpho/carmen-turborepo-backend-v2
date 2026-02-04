FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
# RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
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
COPY apps/micro-file ./apps/micro-file

# Install dependencies and build
RUN bun install
WORKDIR /app/apps/micro-file
RUN npm run build

FROM node:22-slim AS runner

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install bun for runtime
RUN npm install -g bun

# Copy root package files
COPY package.json .
COPY bun.lock .
COPY tsconfig.json .

# Copy built packages from builder (including their dist folders)
COPY --from=builder /app/packages ./packages

# Copy app tsconfig for path resolution
COPY --from=builder /app/apps/micro-file/tsconfig.json ./apps/micro-file/
COPY --from=builder /app/apps/micro-file/package.json ./apps/micro-file/
COPY --from=builder /app/apps/micro-file/dist ./apps/micro-file/dist

# Install production dependencies
ENV NODE_ENV=production
RUN bun install --no-save --ignore-scripts

WORKDIR /app/apps/micro-file

EXPOSE 5007
EXPOSE 6007

CMD ["bun", "start:prod"]
