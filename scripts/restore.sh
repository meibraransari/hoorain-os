#!/bin/bash
# ============================================================
# FinanceOS Restore Script
# Usage: ./scripts/restore.sh <backup_file.sql.gz>
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load .env if present
if [ -f "$PROJECT_ROOT/.env" ]; then
  # shellcheck disable=SC1090
  source "$PROJECT_ROOT/.env"
fi

POSTGRES_USER="${POSTGRES_USER:-financeos}"
POSTGRES_DB="${POSTGRES_DB:-financeos}"

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lht "${BACKUP_PATH:-./backups}"/db_*.sql.gz 2>/dev/null || echo "  (none found)"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: File not found: $BACKUP_FILE"
  exit 1
fi

echo "============================================"
echo "  FinanceOS Restore — $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo "  Backup file : $BACKUP_FILE"
echo "  Database    : $POSTGRES_DB"
echo ""
echo "⚠️  WARNING: This will OVERWRITE all data in '$POSTGRES_DB'."
echo "   A fresh backup will be created first."
echo ""
read -r -p "Type 'yes' to continue: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

# Safety backup before restoring
echo ""
echo "[1/3] Creating safety backup before restore..."
SAFETY_DIR="${BACKUP_PATH:-./backups}/pre-restore"
mkdir -p "$SAFETY_DIR"
SAFETY_DATE=$(date +%Y%m%d_%H%M%S)
docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" --format=plain --clean "$POSTGRES_DB" \
  | gzip > "$SAFETY_DIR/pre_restore_$SAFETY_DATE.sql.gz"
echo "      Saved to: $SAFETY_DIR/pre_restore_$SAFETY_DATE.sql.gz"

# Restore
echo "[2/3] Restoring from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB"

echo "[3/3] Verifying restore..."
docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres \
  psql -U "$POSTGRES_USER" "$POSTGRES_DB" \
  -c "SELECT COUNT(*) AS transactions FROM transactions; SELECT COUNT(*) AS accounts FROM accounts;" \
  2>/dev/null || true

echo ""
echo "✅ Restore complete!"
echo "   If anything looks wrong, the pre-restore backup is at:"
echo "   $SAFETY_DIR/pre_restore_$SAFETY_DATE.sql.gz"
