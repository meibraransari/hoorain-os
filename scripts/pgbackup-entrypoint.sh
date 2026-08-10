#!/bin/bash
# ============================================================
# FinanceOS — pgbackup entrypoint
# Runs inside the pgbackup Docker service on a daily cron schedule
# ============================================================
set -euo pipefail

BACKUP_DIR="/backups"
RETAIN_DAYS="${BACKUP_RETAIN_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

run_backup() {
  DATE=$(date +%Y%m%d_%H%M%S)
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Starting scheduled backup..."

  pg_dump \
    -h postgres \
    -U "$POSTGRES_USER" \
    --format=plain \
    --clean \
    "$POSTGRES_DB" \
    | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

  SIZE=$(du -sh "$BACKUP_DIR/db_$DATE.sql.gz" | cut -f1)
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Backup saved: db_$DATE.sql.gz ($SIZE)"

  # Prune old backups
  find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime +"$RETAIN_DAYS" -delete
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Pruned backups older than $RETAIN_DAYS days."
}

# Run immediately on start, then every 24 hours
run_backup

while true; do
  sleep 86400
  run_backup
done
