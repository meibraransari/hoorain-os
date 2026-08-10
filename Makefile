# ============================================================
# FinanceOS Makefile
# ============================================================

.PHONY: help start stop restart logs ps build pull \
        backup restore import-cashew \
        dev-backend dev-frontend \
        db-shell redis-shell backend-shell \
        migrate seed lint test clean

# Default target — show help
help:
	@echo ""
	@echo "  FinanceOS — Available Commands"
	@echo "  ================================"
	@echo ""
	@echo "  🐳 Docker:"
	@echo "    make start              Start all services (detached)"
	@echo "    make stop               Stop all services"
	@echo "    make restart            Restart all services"
	@echo "    make logs               Follow all logs"
	@echo "    make ps                 Show service status"
	@echo "    make build              Rebuild Docker images"
	@echo "    make pull               Pull latest base images"
	@echo ""
	@echo "  💾 Data:"
	@echo "    make backup             Create database + uploads backup"
	@echo "    make restore FILE=...   Restore from a backup file"
	@echo "    make import-cashew FILE=... Import Cashew export"
	@echo ""
	@echo "  💻 Development:"
	@echo "    make dev-backend        Run backend in dev mode (hot-reload)"
	@echo "    make dev-frontend       Run frontend in dev mode (hot-reload)"
	@echo "    make db-shell           Open PostgreSQL shell"
	@echo "    make redis-shell        Open Redis CLI"
	@echo "    make backend-shell      Open shell in backend container"
	@echo ""
	@echo "  🛠  Maintenance:"
	@echo "    make migrate            Run pending database migrations"
	@echo "    make seed               Apply database seeds"
	@echo "    make lint               Run linters in all packages"
	@echo "    make test               Run all tests"
	@echo "    make clean              Remove build artifacts"
	@echo ""

# ============================================================
# Docker Operations
# ============================================================

## Start all services in detached mode
start:
	docker compose up -d
	@echo ""
	@echo "✅ FinanceOS is starting..."
	@echo "   App: http://localhost:$$(grep APP_PORT .env 2>/dev/null | cut -d= -f2 || echo 8080)"
	@echo "   API: http://localhost:3001/api/docs"
	@echo ""
	@$(MAKE) ps

## Stop all services
stop:
	docker compose down

## Restart all services
restart:
	docker compose restart

## Follow logs for all services (Ctrl+C to exit)
logs:
	docker compose logs -f

## Show status of all services
ps:
	docker compose ps

## Rebuild Docker images
build:
	docker compose build --no-cache

## Pull latest base images
pull:
	docker compose pull

## Production start
start-prod:
	docker compose -f docker-compose.prod.yml up -d

## Production stop
stop-prod:
	docker compose -f docker-compose.prod.yml down

## Production logs
logs-prod:
	docker compose -f docker-compose.prod.yml logs -f

# ============================================================
# Backup & Restore
# ============================================================

## Create a database + uploads backup
backup:
	@chmod +x ./scripts/backup.sh
	@./scripts/backup.sh

## Restore from a backup file. Usage: make restore FILE=./backups/db_YYYYMMDD_HHMMSS.sql.gz
restore:
ifndef FILE
	@echo "❌ Error: FILE is required. Usage: make restore FILE=./backups/db_*.sql.gz"
	@exit 1
endif
	@chmod +x ./scripts/restore.sh
	@./scripts/restore.sh $(FILE)

# ============================================================
# Cashew Import
# ============================================================

## Import a Cashew export file. Usage: make import-cashew FILE=/path/to/cashew_export.json
import-cashew:
ifndef FILE
	@echo "❌ Error: FILE is required. Usage: make import-cashew FILE=/path/to/cashew_export.json"
	@exit 1
endif
	@chmod +x ./scripts/import-cashew.sh
	@./scripts/import-cashew.sh $(FILE)

# ============================================================
# Development (local, no Docker)
# ============================================================

## Run NestJS backend in development mode with hot-reload
dev-backend:
	cd backend && npm run start:dev

## Run Next.js frontend in development mode with hot-reload
dev-frontend:
	cd frontend && npm run dev

## Install all dependencies
install:
	cd backend && npm install
	cd frontend && npm install

# ============================================================
# Database & Shell Access
# ============================================================

## Open a PostgreSQL interactive shell
db-shell:
	docker compose exec postgres psql -U $$(grep POSTGRES_USER .env 2>/dev/null | cut -d= -f2 || echo financeos) $$(grep POSTGRES_DB .env 2>/dev/null | cut -d= -f2 || echo financeos)

## Open Redis CLI
redis-shell:
	docker compose exec redis redis-cli -a $$(grep REDIS_PASSWORD .env 2>/dev/null | cut -d= -f2 || echo redis_secret_2024)

## Open a shell inside the backend container
backend-shell:
	docker compose exec backend sh

## Open a shell inside the frontend container
frontend-shell:
	docker compose exec frontend sh

# ============================================================
# Database Migrations & Seeds
# ============================================================

## Run pending TypeORM migrations
migrate:
	docker compose exec backend npm run migration:run

## Apply database seeds
seed:
	docker compose exec postgres psql -U $$(grep POSTGRES_USER .env 2>/dev/null | cut -d= -f2 || echo financeos) \
	  $$(grep POSTGRES_DB .env 2>/dev/null | cut -d= -f2 || echo financeos) \
	  -f /docker-entrypoint-initdb.d/001_default_categories.sql

# ============================================================
# Code Quality
# ============================================================

## Run ESLint in all packages
lint:
	cd backend && npm run lint
	cd frontend && npm run lint

## Run all tests
test:
	cd backend && npm run test
	cd frontend && npm run test

## Run backend tests with coverage
test-cov:
	cd backend && npm run test:cov

# ============================================================
# Cleanup
# ============================================================

## Remove all build artifacts
clean:
	rm -rf backend/dist backend/.next
	rm -rf frontend/.next frontend/out
	@echo "✅ Build artifacts cleaned."

## Remove everything including Docker volumes (⚠️ DESTROYS ALL DATA)
nuke:
	@echo "⚠️  WARNING: This will destroy ALL data including the database!"
	@read -p "Type 'destroy' to confirm: " confirm && [ "$$confirm" = "destroy" ] || exit 1
	docker compose down -v --remove-orphans
	rm -rf data/ backups/
	@echo "✅ Everything removed."
