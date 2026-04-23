#!/usr/bin/env bash
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/dev-server.log"
PORT=3000   # Express server port (Vite proxies through it)

# Ensure local node_modules/.bin is on PATH so tsx/vite are found
export PATH="$SCRIPT_DIR/node_modules/.bin:$PATH"

# ─── Helpers ─────────────────────────────────────────────────────────────────
show_help() {
  cat << 'EOF'
Usage: ./restart-dev.sh [OPTIONS]
Options:
  -b, --background    Run dev server in background (script exits, server continues)
  -f, --follow        Restart server and tail the server log file
  -F, --full-restart  Kill ALL servers, restart in background, and tail logs
  -k, --kill          Kill running server processes and exit
  -s, --status        Show running server processes without restarting
  -h, --help          Show this help message

Default Action (no options):
  Run dev server in foreground (stopping script stops server)
EOF
}

kill_servers() {
  echo "⏳ Killing existing dev server processes..."
  pkill -f "tsx watch server" 2>/dev/null && echo "   ✓ tsx processes killed" || echo "   — No tsx processes found"
  pkill -f "node.*vite" 2>/dev/null && echo "   ✓ vite processes killed" || true
  pkill -f "npm run dev" 2>/dev/null || true
  sleep 1
  echo "✅ Server cleanup complete."
}

show_status() {
  echo "─── Running Dev Server Processes ───"
  pgrep -fl "tsx watch" 2>/dev/null || echo "  [No tsx processes]"
  pgrep -fl "vite" 2>/dev/null | grep -v grep || echo "  [No vite processes]"
  echo "────────────────────────────────────"
}

wait_for_server() {
  local max_wait=30
  local waited=0
  echo -n "⏳ Waiting for server on port $PORT"
  while ! lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; do
    sleep 1
    waited=$((waited + 1))
    echo -n "."
    if [ "$waited" -ge "$max_wait" ]; then
      echo ""
      echo "⚠️  Server didn't start within ${max_wait}s. Check $LOG_FILE for errors."
      return 1
    fi
  done
  echo ""
  echo ""
  echo "╔════════════════════════════════════════════════════════╗"
  echo "║  🏰  Castles of Light — Dev Server Running            ║"
  echo "║                                                        ║"
  echo "║  Local:   http://localhost:$PORT                       ║"
  echo "║  Logs:    $LOG_FILE     ║"
  echo "╚════════════════════════════════════════════════════════╝"
  echo ""
}

run_background() {
  echo "🚀 Starting dev server in background..."
  nohup npm run dev > "$LOG_FILE" 2>&1 &
  echo "   PID: $!"
  wait_for_server
}

run_foreground() {
  echo "🚀 Starting dev server in foreground (Ctrl+C to stop)..."
  echo ""
  npm run dev
}

# ─── Parse Arguments ─────────────────────────────────────────────────────────
ACTION="foreground"  # default

while [[ "$#" -gt 0 ]]; do
  case $1 in
    -b|--background)   ACTION="background" ;;
    -f|--follow)       ACTION="follow" ;;
    -F|--full-restart) ACTION="full-restart" ;;
    -k|--kill)         ACTION="kill" ;;
    -s|--status)       ACTION="status" ;;
    -h|--help)         show_help; exit 0 ;;
    *) echo "Unknown option: $1"; echo ""; show_help; exit 1 ;;
  esac
  shift
done

# ─── Execute ─────────────────────────────────────────────────────────────────
case "$ACTION" in
  status)
    show_status
    ;;
  kill)
    kill_servers
    ;;
  full-restart)
    kill_servers
    run_background
    echo "📜 Tailing logs (Ctrl+C to stop tailing — server keeps running):"
    tail -f "$LOG_FILE"
    ;;
  follow)
    kill_servers
    run_background
    echo "📜 Tailing logs (Ctrl+C to stop tailing — server keeps running):"
    tail -f "$LOG_FILE"
    ;;
  background)
    kill_servers
    run_background
    ;;
  foreground)
    kill_servers
    run_foreground
    ;;
esac
