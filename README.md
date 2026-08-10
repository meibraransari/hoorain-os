# 💸 FinanceOS

<div align="center">

**A self-hosted, open-source personal finance platform**  
_Track everything. Own your data. Never pay a subscription._

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)](https://postgresql.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-red)](https://nestjs.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://typescriptlang.org)

</div>

---

## ✨ Features

| Category | Capabilities |
|---|---|
| 💰 **Accounts** | Checking, savings, credit cards, investment, cash, crypto |
| 📊 **Transactions** | Income, expenses, transfers, splits, multi-currency |
| 🏷️ **Categories** | Hierarchical categories, custom sub-categories, tags |
| 📅 **Budgets** | Period-based budgets, per-category allocation, rollover |
| 🎯 **Goals** | Savings goals with progress tracking and target dates |
| 🔁 **Recurring** | Auto-create recurring bills, income, and subscriptions |
| 📤 **Import** | Import from Cashew ObjectBox export (JSON/CSV) |
| 📎 **Attachments** | Upload receipts and statements per transaction |
| 🌍 **Multi-currency** | Historical exchange rates, base-currency conversion |
| 📈 **Reports** | Spending by category, trends, net worth over time |
| 🔔 **Notifications** | Budget alerts, bill reminders, unusual spending |
| 🔒 **Self-hosted** | Your data stays on your server — no third parties |
| 🐳 **Docker** | One-command deploy with Docker Compose |
| 📖 **API Docs** | Full OpenAPI / Swagger documentation at `/api/docs` |

---

## 📸 Screenshots

> Screenshots will be added after the initial release.
>
> ```
> [ Dashboard ]   [ Transactions ]   [ Budget Overview ]   [ Reports ]
> ```

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         NGINX (port 80/443)                 │
│              SSL termination · Reverse proxy · Gzip         │
└───────────────────────────┬─────────────────┬───────────────┘
                            │                 │
              ┌─────────────▼──┐    ┌─────────▼──────────┐
              │  Frontend      │    │  Backend API        │
              │  Next.js 15    │    │  NestJS 10          │
              │  App Router    │    │  REST + WebSocket   │
              │  Tailwind CSS  │    │  OpenAPI/Swagger     │
              │  shadcn/ui     │    │  Bull Queue          │
              └────────────────┘    └──────┬──────┬───────┘
                                          │      │
                              ┌───────────▼┐   ┌─▼─────────────┐
                              │ PostgreSQL  │   │ Redis          │
                              │ 17-alpine   │   │ 7-alpine       │
                              │ Schema +    │   │ Sessions +     │
                              │ Triggers    │   │ Job Queue      │
                              └────────────┘   └───────────────┘
                                    │
                              ┌─────▼──────────┐
                              │  pgbackup       │
                              │  Daily dumps    │
                              │  to /backups    │
                              └────────────────┘
```

---

## 🚀 Quick Start

**5 commands to get FinanceOS running:**

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/financeos.git && cd financeos

# 2. Configure environment
cp .env.example .env
# Edit .env with your passwords and secrets

# 3. Start all services
docker compose up -d

# 4. Wait for healthy state (~30 seconds)
docker compose ps

# 5. Open the app
open http://localhost:8080
```

> **Default port:** `8080` — configurable via `APP_PORT` in `.env`

---

## 🐳 Docker Setup

### Development

```bash
# Start all services in background
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down

# Rebuild after code changes
docker compose up -d --build backend frontend
```

### Production (with SSL)

```bash
# Copy production compose file
docker compose -f docker-compose.prod.yml up -d

# View production logs
docker compose -f docker-compose.prod.yml logs -f nginx backend
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full SSL + Cloudflare setup.

---

## ⚙️ Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `APP_PORT` | `8080` | No | External port for Nginx |
| `NODE_ENV` | `production` | No | `production` or `development` |
| `POSTGRES_USER` | `financeos` | No | Database username |
| `POSTGRES_PASSWORD` | — | **Yes** | Database password (change!) |
| `POSTGRES_DB` | `financeos` | No | Database name |
| `POSTGRES_PORT` | `5432` | No | Dev-only exposed port |
| `REDIS_PASSWORD` | — | **Yes** | Redis password (change!) |
| `REDIS_PORT` | `6379` | No | Dev-only exposed port |
| `JWT_SECRET` | — | **Yes** | Access token secret (64+ chars) |
| `JWT_REFRESH_SECRET` | — | **Yes** | Refresh token secret (64+ chars) |
| `JWT_EXPIRY` | `15m` | No | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `30d` | No | Refresh token lifetime |
| `DATA_FOLDER` | `./data` | No | Persistent storage root |
| `BACKUP_PATH` | `./backups` | No | Backup output directory |
| `MAX_UPLOAD_SIZE` | `50mb` | No | Max file upload size |
| `BACKUP_RETAIN_DAYS` | `30` | No | Days to keep old backups |
| `DOMAIN` | — | Prod | Your domain name for SSL |
| `SSL_CERT_PATH` | `./ssl` | Prod | Path to Let's Encrypt certs |
| `NEXT_PUBLIC_API_URL` | `/api` | No | Frontend API base URL |

> 🔐 **Security note:** Generate strong secrets with:
> ```bash
> openssl rand -hex 64
> ```

---

## 📤 Import from Cashew

FinanceOS can import your existing data from the [Cashew](https://cashewapp.web.app/) personal finance app.

### Step 1 — Export from Cashew
1. Open Cashew → Settings → Export Data
2. Choose **ObjectBox / JSON** format
3. Save the export file

### Step 2 — Import to FinanceOS
```bash
# Get your auth token first
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

# Run the import script
./scripts/import-cashew.sh /path/to/cashew_export.json "$TOKEN"
```

### Step 3 — Check Import Status
```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/v1/import/cashew/{importId} | python3 -m json.tool
```

See [docs/DATABASE.md](docs/DATABASE.md) for the full field mapping table.

---

## 💾 Backup & Restore

### Create a Backup
```bash
# Backs up database + uploads
./scripts/backup.sh

# Custom output directory
./scripts/backup.sh /mnt/external/financeos-backups

# Or use Make
make backup
```

### Restore from Backup
```bash
# Restores database (creates safety backup first, requires confirmation)
./scripts/restore.sh ./backups/db_20240901_120000.sql.gz

# Or use Make
make restore FILE=./backups/db_20240901_120000.sql.gz
```

### Automated Backups (Production)
The `pgbackup` service in `docker-compose.prod.yml` runs daily backups automatically and prunes backups older than `BACKUP_RETAIN_DAYS` (default: 30 days).

---

## 📖 API Documentation

Full interactive API docs are available at:

```
http://localhost:8080/api/docs
```

(Swagger UI with try-it-out support)

For a static reference, see [docs/API.md](docs/API.md).

---

## ⬆️ Upgrading

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild images
docker compose build

# 3. Apply any new migrations
docker compose exec backend npm run migration:run

# 4. Restart with new images
docker compose up -d

# 5. Verify health
docker compose ps
```

> Always back up before upgrading: `make backup`

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) and ensure TypeScript compiles without errors.

---

## 🗺 Roadmap

- [ ] Mobile-responsive PWA
- [ ] Plaid / Open Banking integration
- [ ] AI-powered transaction categorization
- [ ] Multi-user household sharing
- [ ] Email/webhook notifications
- [ ] CSV import from any bank
- [ ] Dark mode
- [ ] Annual tax report export

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ❤️ for the self-hosting community

**[Documentation](docs/) · [API Reference](docs/API.md) · [Deployment Guide](docs/DEPLOYMENT.md)**

</div>
