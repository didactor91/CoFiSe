#!/bin/bash
set -e

echo "=== CFS Server Setup ==="

# Update
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Caddy
apt install -y caddy

# Create deploy user (optional)
useradd -m -s /bin/bash deploy || true
usermod -aG sudo deploy

# Create app directory
mkdir -p /opt/cfs
chown deploy:deploy /opt/cfs

echo "=== Server setup complete ==="
