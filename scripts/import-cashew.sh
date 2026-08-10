#!/bin/bash
# ============================================================
# FinanceOS — Import Cashew ObjectBox Export
# Usage: ./scripts/import-cashew.sh <cashew-export-file>
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
IMPORTS_DIR="$PROJECT_ROOT/imports"

# Load .env if present
if [ -f "$PROJECT_ROOT/.env" ]; then
  # shellcheck disable=SC1090
  source "$PROJECT_ROOT/.env"
fi

APP_PORT="${APP_PORT:-8080}"
BASE_URL="http://localhost:${APP_PORT}"

if [ -z "${1:-}" ]; then
  echo "Hoorain — Mobile App & Database Import Tool"
  echo "============================================"
  echo "Usage: $0 <export-file> [auth-token]"
  echo ""
  echo "  <export-file>  Path to the .json, .sqlite or .sql export file"
  echo "  [auth-token]   Optional JWT token (or set TOKEN env var)"
  echo ""
  echo "Examples:"
  echo "  TOKEN=\$(cat .token) $0 database_export_2026.json"
  echo "  $0 /path/to/backup.json eyJhbGci..."
  exit 1
fi

SOURCE_FILE="$1"
AUTH_TOKEN="${2:-${TOKEN:-}}"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "❌ Error: File not found: $SOURCE_FILE"
  exit 1
fi

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ Error: Authentication token required."
  echo "   Set TOKEN env var or pass it as the second argument."
  echo "   Get a token by logging in first:"
  echo "   curl -s -X POST $BASE_URL/api/v1/auth/login -H 'Content-Type: application/json' \\"
  echo "        -d '{\"username\":\"admin\",\"password\":\"yourpassword\"}' | python3 -m json.tool"
  exit 1
fi

FILE_NAME=$(basename "$SOURCE_FILE")
DEST="$IMPORTS_DIR/$FILE_NAME"
mkdir -p "$IMPORTS_DIR"

echo "============================================"
echo "  Hoorain — Database Data Import"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "============================================"
echo "  Source: $SOURCE_FILE"
echo "  Size  : $(du -sh "$SOURCE_FILE" | cut -f1)"
echo ""

# Copy file to imports staging directory
echo "[1/3] Staging file to imports directory..."
cp "$SOURCE_FILE" "$DEST"
echo "      Copied to: $DEST"

# Upload and trigger import
echo "[2/3] Uploading to FinanceOS API..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$BASE_URL/api/v1/import/cashew" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@$DEST" \
  2>&1)

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo "[3/3] API Response (HTTP $HTTP_CODE):"
echo "$HTTP_BODY" | python3 -m json.tool 2>/dev/null || echo "$HTTP_BODY"

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
  IMPORT_ID=$(echo "$HTTP_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('importId', 'unknown'))" 2>/dev/null || echo "unknown")
  echo ""
  echo "✅ Import job started! Import ID: $IMPORT_ID"
  echo ""
  echo "📊 Check import status:"
  echo "   curl -s -H \"Authorization: Bearer \$TOKEN\" $BASE_URL/api/v1/import/cashew/$IMPORT_ID | python3 -m json.tool"
  echo ""
  echo "📚 API Docs: $BASE_URL/api/docs"
else
  echo ""
  echo "❌ Import failed with HTTP $HTTP_CODE"
  echo "   Check the API logs: docker compose logs backend --tail=50"
  exit 1
fi
