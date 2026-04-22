#!/bin/bash
set -e

APP_DIR="/opt/cfs"
KEEP_RELEASES=5

echo "=== Deploying CFS ==="

cd $APP_DIR

# Pull latest code
git fetch origin main
git reset --hard origin/main

# Install dependencies
pnpm install --frozen-lockfile

# Build client
pnpm build

# Build server
pnpm -C server build || pnpm --dir server build || echo "Server build skipped (may not need separate build)"

# Initialize database if needed
if [ ! -f database/cfs.db ]; then
    pnpm exec tsx database/init.ts
fi

# Restart services
sudo systemctl restart cfs-server || true
sudo systemctl restart cfs-client || true

echo "=== Deploy complete ==="
