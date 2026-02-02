#!/bin/bash

# Start script for carmen-turborepo-backend
# Runs git pull, bun install, bun build, and starts dev:prod in background
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Starting application setup ==="

# Step 1: Git pull
echo "[1/4] Pulling latest changes..."
if ! git pull; then
    echo "ERROR: Git pull failed. Stopping."
    exit 1
fi

# Step 2: Install dependencies
echo "[2/4] Installing dependencies..."
if ! bun install; then
    echo "ERROR: Bun install failed. Stopping."
    exit 1
fi

# Step 3: Build
echo "[3/4] Building project..."
if ! bun run build; then
    echo "ERROR: Build failed. Stopping."
    exit 1
fi

echo "=== Build successful ==="

# Step 4: Stop existing service and start new one (only if build succeeded)
echo "[4/4] Stopping existing service and starting new one..."

"$SCRIPT_DIR/stop.sh"
echo "Existing service stopped."

nohup bun run dev:prod --concurrency 20 > dev-prod.log 2>&1 &

echo "=== Application started in background ==="
echo "PID: $!"
echo "Log file: dev-prod.log"
echo "Use 'tail -f dev-prod.log' to view logs"
