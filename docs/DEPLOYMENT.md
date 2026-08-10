# 🚀 FinanceOS Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Clone & Configure](#clone--configure)
- [Docker Compose Deployment](#docker-compose-deployment)
- [SSL Setup with Let's Encrypt](#ssl-setup-with-lets-encrypt)
- [Cloudflare Reverse Proxy](#cloudflare-reverse-proxy)
- [Backup Strategy](#backup-strategy)
- [Monitoring](#monitoring)
- [Upgrading](#upgrading)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 22.04 / Debian 12 | Ubuntu 24.04 LTS |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB | 50+ GB |
| CPU | 1 core | 2+ cores |
| Docker | 24.0+ | Latest |
| Docker Compose | v2.20+ | Latest |
| Open Ports | 80, 443 | — |

### Install Docker on Ubuntu

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version         # Verify install
docker compose version   # Verify compose v2
```

---

## Clone & Configure

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/financeos.git
cd financeos

# 2. Copy environment template
cp .env.example .env

# 3. Generate strong secrets
echo "JWT_SECRET=$(openssl rand -hex 64)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)"

# 4. Edit .env with your values
nano .env
```

### Critical `.env` settings

```env
# CHANGE THESE — never leave defaults in production
POSTGRES_PASSWORD=your_strong_db_password_here
REDIS_PASSWORD=your_strong_redis_password_here
JWT_SECRET=<64-char-hex-from-above>
JWT_REFRESH_SECRET=<64-char-hex-from-above>
DOMAIN=finance.yourdomain.com
```

---

## Docker Compose Deployment

### Development (with exposed ports)

```bash
docker compose up -d
docker compose ps       # Check health status
docker compose logs -f  # Follow logs
```

Access at: `http://localhost:8080`

### Production (SSL + resource limits)

```bash
# Use production compose file
docker compose -f docker-compose.prod.yml up -d

# Check all services are healthy
docker compose -f docker-compose.prod.yml ps
```

### First-time Database Initialization

The schema and seeds are automatically applied on first start via the `./database/migrations` volume mount. To manually apply seeds:

```bash
docker compose exec postgres psql -U financeos financeos \
  -f /docker-entrypoint-initdb.d/001_default_categories.sql
```

---

## SSL Setup with Let's Encrypt

### Step 1 — Install Certbot

```bash
sudo apt install certbot -y
```

### Step 2 — Obtain Certificate

Temporarily expose port 80 for the ACME challenge:

```bash
sudo certbot certonly --standalone \
  -d finance.yourdomain.com \
  --email admin@yourdomain.com \
  --agree-tos \
  --non-interactive
```

### Step 3 — Copy Certificates

```bash
mkdir -p ./ssl
sudo cp /etc/letsencrypt/live/finance.yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/finance.yourdomain.com/privkey.pem   ./ssl/
sudo cp /etc/letsencrypt/live/finance.yourdomain.com/chain.pem     ./ssl/
sudo chown $USER:$USER ./ssl/*.pem
chmod 600 ./ssl/privkey.pem
```

### Step 4 — Update `.env`

```env
DOMAIN=finance.yourdomain.com
SSL_CERT_PATH=./ssl
```

### Step 5 — Start with Production Config

```bash
docker compose -f docker-compose.prod.yml up -d nginx
```

### Step 6 — Auto-renew Certificates

```bash
# Add to crontab
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/finance.yourdomain.com/*.pem /path/to/financeos/ssl/ && docker compose -f /path/to/financeos/docker-compose.prod.yml exec nginx nginx -s reload") | crontab -
```

---

## Cloudflare Reverse Proxy

Using Cloudflare in front of FinanceOS provides DDoS protection, global CDN, and free SSL.

### Setup

1. **Add your domain to Cloudflare** and update your registrar nameservers.

2. **Add DNS Record:**
   - Type: `A`
   - Name: `finance` (or `@` for root)
   - Content: Your server's public IP
   - Proxy: ☁️ **Proxied** (orange cloud)

3. **SSL/TLS Settings:**
   - In Cloudflare dashboard → SSL/TLS → set mode to **Full (strict)**

4. **Configure FinanceOS for Cloudflare:**
   ```env
   # .env — use port 80 since Cloudflare handles SSL
   APP_PORT=80
   ```

5. **Firewall Rules** — Only allow Cloudflare IPs to reach your server:
   ```bash
   # Allow Cloudflare IPv4 ranges only
   for ip in $(curl -s https://www.cloudflare.com/ips-v4); do
     ufw allow from $ip to any port 80
     ufw allow from $ip to any port 443
   done
   ufw enable
   ```

### Cloudflare Page Rules (optional)

| URL Pattern | Setting |
|---|---|
| `finance.yourdomain.com/api/*` | Cache Level: Bypass |
| `finance.yourdomain.com/_next/static/*` | Cache Level: Cache Everything, Edge TTL: 1 year |

---

## Backup Strategy

### Automated (Production)

The `pgbackup` service runs daily at container startup and every 24 hours thereafter.

**Backup location:** `./backups/` (mapped to `BACKUP_PATH`)

**Retention:** `BACKUP_RETAIN_DAYS` (default: 30 days)

### Manual Backups

```bash
# Create backup now
./scripts/backup.sh

# Backup to specific directory
./scripts/backup.sh /mnt/nas/financeos-backups
```

### Off-site Backup Recommendation

Use `rclone` to sync backups to cloud storage:

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure (example: Backblaze B2)
rclone config

# Add to crontab — sync daily at 4 AM
echo "0 4 * * * rclone sync /path/to/financeos/backups remote:financeos-backups --log-file /var/log/rclone.log" | crontab -
```

### Restore

```bash
./scripts/restore.sh ./backups/db_20240901_120000.sql.gz
```

---

## Monitoring

### Built-in Health Endpoints

```bash
# Backend health
curl http://localhost:8080/api/health

# All services
docker compose ps
```

### Docker Stats

```bash
# Live resource usage
docker stats

# Specific container
docker stats financeos-backend
```

### Log Monitoring

```bash
# All logs
docker compose logs -f

# Backend only
docker compose logs -f backend --tail=100

# Nginx access logs
tail -f ./data/nginx/logs/access.log
```

### Uptime Monitoring (recommended)

Consider [Uptime Kuma](https://github.com/louislam/uptime-kuma) (self-hosted) or similar to monitor:

- `http://your-server:8080/api/health`
- Alert via Telegram/Email/Slack on downtime

---

## Upgrading

```bash
# 1. Always backup first!
./scripts/backup.sh

# 2. Pull latest code
git pull origin main

# 3. Rebuild Docker images
docker compose build

# 4. Apply database migrations (if any)
docker compose exec backend npm run migration:run

# 5. Restart with new images (zero-downtime rolling restart)
docker compose up -d --remove-orphans

# 6. Verify all services are healthy
docker compose ps
docker compose logs --tail=50 backend
```

---

## Troubleshooting

### Services not starting

```bash
# Check logs for errors
docker compose logs postgres
docker compose logs redis
docker compose logs backend
```

### Database connection refused

```bash
# Check Postgres is healthy
docker compose exec postgres pg_isready -U financeos

# Check env vars
docker compose exec backend env | grep DATABASE
```

### Port already in use

```bash
# Find what's using port 8080
lsof -i :8080    # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Change port in .env
APP_PORT=9000
```

### Reset everything (⚠️ data loss!)

```bash
docker compose down -v
rm -rf ./data
docker compose up -d
```

### Backend out of memory

Increase the memory limit in `docker-compose.prod.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G  # increase from 1G
```
