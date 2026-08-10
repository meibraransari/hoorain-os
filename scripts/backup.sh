#!/bin/bash
# ============================================================
# FinanceOS Backup Script
# Usage: ./scripts/backup.sh [output_dir]
# ============================================================
set -euo pipefail

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=${1:-./backups}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load .env if present
if [ -f "$PROJECT_ROOT/.env" ]; then
  # shellcheck disable=SC1090
  source "$PROJECT_ROOT/.env"
fi

POSTGRES_USER="${POSTGRES_USER:-financeos}"
POSTGRES_DB="${POSTGRES_DB:-financeos}"
DATA_FOLDER="${DATA_FOLDER:-$PROJECT_ROOT/data}"

mkdir -p "$BACKUP_DIR"

echo "============================================"
echo "  FinanceOS Backup — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo "  Destination : $BACKUP_DIR"
echo "  Database    : $POSTGRES_DB"
echo ""

# ---- Database Backup ----
echo "[1/3] Backing up PostgreSQL database..."
docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" --format=plain --clean "$POSTGRES_DB" \
  | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"
echo "      Saved: db_$DATE.sql.gz ($(du -sh "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1))"

# ---- Uploads Backup ----
echo "[2/3] Backing up uploaded files..."
if [ -d "$DATA_FOLDER/uploads" ]; then
  tar czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$DATA_FOLDER" uploads 2>/dev/null
  echo "      Saved: uploads_$DATE.tar.gz ($(du -sh "$BACKUP_DIR/uploads_$DATE.tar.gz" | cut -f1))"
else
  echo "      Skipped (no uploads directory found)"
fi

# ---- Manifest ----
echo "[3/3] Writing backup manifest..."
cat > "$BACKUP_DIR/manifest_$DATE.txt" << EOF
FinanceOS Backup Manifest
=========================
Created:    $(date -u '+%Y-%m-%d %H:%M:%S UTC')
Hostname:   $(hostname)
Database:   $POSTGRES_DB
Files:
  - db_$DATE.sql.gz
  - uploads_$DATE.tar.gz
EOF
echo "      Saved: manifest_$DATE.txt"

echo ""
echo "✅ Backup complete!"
echo ""
ls -lh "$BACKUP_DIR/"*"$DATE"* 2>/dev/null || true

# ---- Prune old backups (keep last 30 days by default) ----
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-30}"
echo ""
echo "🧹 Pruning backups older than $RETAIN_DAYS days..."
find "$BACKUP_DIR" -name "db_*.sql.gz"        -mtime +"$RETAIN_DAYS" -delete -print
find "$BACKUP_DIR" -name "uploads_*.tar.gz"   -mtime +"$RETAIN_DAYS" -delete -print
find "$BACKUP_DIR" -name "manifest_*.txt"     -mtime +"$RETAIN_DAYS" -delete -print
echo "Done."
