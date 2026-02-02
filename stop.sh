#!/bin/bash

# Stop script for carmen-turborepo-backend
# Kills all dev:prod related processes

echo "=== Stopping application ==="

# Find and kill all dev:prod processes
PIDS=$(pgrep -f "dev:prod" 2>/dev/null)

if [ -z "$PIDS" ]; then
    echo "No dev:prod processes found."
    exit 0
fi

echo "Found processes: $PIDS"
echo "Killing processes..."

pkill -f "dev:prod"

sleep 1

# Verify processes are stopped
REMAINING=$(pgrep -f "dev:prod" 2>/dev/null)
if [ -z "$REMAINING" ]; then
    echo "=== Application stopped successfully ==="
else
    echo "Some processes still running, force killing..."
    pkill -9 -f "dev:prod"
    echo "=== Application force stopped ==="
fi
