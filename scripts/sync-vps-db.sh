#!/usr/bin/env bash
# =============================================================================
# sync-vps-db.sh — Castles of Light · VPS → Local MySQL Migration
# =============================================================================
# Dumps the NerveCenter MySQL database from the production VPS and imports it
# into your local MySQL instance.  Supports three modes:
#
#   --schema-only   Import DDL only (no row data)
#   --data-only     Import row data only (tables must already exist locally)
#   --full          Import schema + data  [DEFAULT]
#
# Usage:
#   chmod +x sync-vps-db.sh
#   ./sync-vps-db.sh [--schema-only | --data-only | --full]
#
# Requirements (local machine):
#   • sshpass      — brew install sshpass  /  sudo apt install sshpass
#   • mysql client — brew install mysql    /  sudo apt install mysql-client
#   • ssh          — standard on macOS / Linux
# =============================================================================

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; exit 1; }

# ── Configuration ─────────────────────────────────────────────────────────────
VPS_HOST="100.116.144.24" # Tailscale IP
VPS_USER="root"
VPS_PASS="N8NR0ck&12345"
VPS_SSH_PORT="22"

VPS_DB_NAME="nervecenter"
VPS_DB_USER="nervecenter"
VPS_DB_PASS="castles-nc-db-2026"
VPS_DB_PORT="3306"

LOCAL_DB_NAME="castlesoflight"
LOCAL_DB_USER="root"          # ← change to your local MySQL user if different
LOCAL_DB_PASS=""              # ← change to your local MySQL password if set
LOCAL_DB_HOST="127.0.0.1"
LOCAL_DB_PORT="3306"

# Detect DBngin MySQL client if global one is missing
if ! command -v mysql &>/dev/null; then
  DBNGIN_MYSQL="/Users/Shared/DBngin/mysql/8.0.27/bin/mysql"
  if [ -f "$DBNGIN_MYSQL" ]; then
    export PATH="/Users/Shared/DBngin/mysql/8.0.27/bin:$PATH"
  fi
fi

DUMP_FILE="/tmp/nervecenter_vps_dump_$(date +%Y%m%d_%H%M%S).sql"

# ── Parse arguments ───────────────────────────────────────────────────────────
MODE="full"
for arg in "$@"; do
  case "$arg" in
    --schema-only) MODE="schema" ;;
    --data-only)   MODE="data"   ;;
    --full)        MODE="full"   ;;
    --help|-h)
      sed -n '/^# Usage:/,/^# ====/p' "$0" | head -n 10
      exit 0
      ;;
    *) warn "Unknown argument: $arg — ignoring." ;;
  esac
done

# ── Dependency checks ─────────────────────────────────────────────────────────
for cmd in sshpass ssh mysql; do
  command -v "$cmd" &>/dev/null || error "'$cmd' is not installed. See script header for install instructions."
done

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║   Castles of Light — VPS → Local DB Sync             ║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""
info "Mode        : ${BOLD}${MODE}${RESET}"
info "VPS         : ${VPS_USER}@${VPS_HOST}:${VPS_SSH_PORT}"
info "VPS DB      : ${VPS_DB_NAME} (user: ${VPS_DB_USER})"
info "Local DB    : ${LOCAL_DB_NAME} @ ${LOCAL_DB_HOST}:${LOCAL_DB_PORT}"
info "Dump file   : ${DUMP_FILE}"
echo ""

# ── Build mysqldump flags ─────────────────────────────────────────────────────
DUMP_FLAGS="--no-tablespaces --single-transaction --set-gtid-purged=OFF"
case "$MODE" in
  schema) DUMP_FLAGS="$DUMP_FLAGS --no-data"               ;;
  data)   DUMP_FLAGS="$DUMP_FLAGS --no-create-info"        ;;
  full)   DUMP_FLAGS="$DUMP_FLAGS"                         ;;
esac

# ── Step 1: Dump from VPS ─────────────────────────────────────────────────────
info "Step 1/3 — Dumping database from VPS …"
sshpass -p "${VPS_PASS}" \
  ssh -o StrictHostKeyChecking=no \
      -o ConnectTimeout=15 \
      -p "${VPS_SSH_PORT}" \
      "${VPS_USER}@${VPS_HOST}" \
  "mysqldump ${DUMP_FLAGS} \
     -u '${VPS_DB_USER}' \
     -p'${VPS_DB_PASS}' \
     -h 127.0.0.1 \
     -P ${VPS_DB_PORT} \
     '${VPS_DB_NAME}'" \
  > "${DUMP_FILE}"

DUMP_SIZE=$(du -sh "${DUMP_FILE}" 2>/dev/null | cut -f1)
success "Dump complete — ${DUMP_SIZE} written to ${DUMP_FILE}"

# ── Step 2: Ensure local database exists ─────────────────────────────────────
info "Step 2/3 — Ensuring local database '${LOCAL_DB_NAME}' exists …"

# Build mysql auth string (handle blank password)
if [ -n "${LOCAL_DB_PASS}" ]; then
  MYSQL_AUTH="-u '${LOCAL_DB_USER}' -p'${LOCAL_DB_PASS}'"
else
  MYSQL_AUTH="-u '${LOCAL_DB_USER}'"
fi

eval "mysql ${MYSQL_AUTH} \
  -h '${LOCAL_DB_HOST}' \
  -P '${LOCAL_DB_PORT}' \
  -e \"CREATE DATABASE IF NOT EXISTS \\\`${LOCAL_DB_NAME}\\\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\"" \
|| error "Could not connect to local MySQL. Check LOCAL_DB_USER / LOCAL_DB_PASS in this script."

success "Local database ready."

# ── Step 3: Import dump ───────────────────────────────────────────────────────
info "Step 3/3 — Importing dump into local '${LOCAL_DB_NAME}' …"
eval "mysql ${MYSQL_AUTH} \
  -h '${LOCAL_DB_HOST}' \
  -P '${LOCAL_DB_PORT}' \
  '${LOCAL_DB_NAME}'" \
  < "${DUMP_FILE}"

success "Import complete."

# ── Cleanup ───────────────────────────────────────────────────────────────────
rm -f "${DUMP_FILE}"
info "Temporary dump file removed."

echo ""
echo -e "${GREEN}${BOLD}✔  Sync finished successfully!${RESET}"
echo ""
echo -e "  Next steps:"
echo -e "  1. ${CYAN}cd ~/Learn/AI/CastlesOfLight/castlesoflight${RESET}"
echo -e "  2. ${CYAN}pnpm drizzle-kit push${RESET}   ← applies any pending schema migrations"
echo -e "  3. Inject local admin credentials if not already present:"
echo -e "     ${CYAN}node scripts/seed-admin.js${RESET}  (or run the SQL below)"
echo ""
echo -e "  Admin seed SQL:"
echo -e "  ${YELLOW}INSERT INTO users (email, password, role) VALUES${RESET}"
echo -e "  ${YELLOW}  ('chriscotton@castlesoflight.com',${RESET}"
echo -e "  ${YELLOW}   '\$2b\$10\$<bcrypt_hash_here>',${RESET}"
echo -e "  ${YELLOW}   'admin')${RESET}"
echo -e "  ${YELLOW}ON DUPLICATE KEY UPDATE role='admin';${RESET}"
echo ""
