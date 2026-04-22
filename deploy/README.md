# CFS Deployment Guide

## Server Requirements

- Ubuntu 22.04 LTS
- 2 GB RAM
- 20 GB SSD
- Domain: seno.didtor.dev

## Initial Setup

1. SSH to server as root
2. Run: `bash <(curl -sL https://raw.githubusercontent.com/YOUR_USER/cfs/main/deploy/setup-server.sh)`
3. Add SSH key for deploy user
4. Configure DNS: `seno.didtor.dev` → server IP

## Deploy

Push to main branch → GitHub Actions deploys automatically.

Or manual deploy:
```bash
ssh deploy@seno.didtor.dev
cd /opt/cfs
./deploy.sh
```

## GitHub Secrets

Add these to repository:
- `SERVER_HOST`: Server IP
- `SERVER_USER`: deploy
- `SERVER_SSH_KEY`: Private SSH key

## Services

```bash
# Check status
systemctl status cfs-server
systemctl status cfs-client

# Restart
systemctl restart cfs-server
systemctl restart cfs-client

# Logs
journalctl -u cfs-server -f
journalctl -u cfs-client -f
```

## Database

SQLite database at: `/opt/cfs/database/cfs.db`

Backup: `cp database/cfs.db database/backups/$(date +%Y%m%d_%H%M%S).db`
