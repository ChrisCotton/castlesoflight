#!/usr/bin/env bash
set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="demo.mp4"
COMPOSITION="Walkthrough"

# ─── Helpers ─────────────────────────────────────────────────────────────────
show_help() {
  cat << EOF
Usage: ./nc.sh [OPTIONS]

A utility script for managing, editing, and rendering the NerveCenter CRM demo video.

Options:
  -e, --edit        Start the Remotion Studio in the browser for real-time editing.
                    (Runs 'npm run dev' to preview animations, text, and timing)
                    
  -r, --render      Render the final video to an MP4 file.
                    (Outputs to: $OUTPUT_FILE)
                    
  -i, --install     Install or repair npm dependencies for the video project.
  
  -s, --capture [URL] Use Puppeteer to take fresh screenshots of your app.
                      Pass an optional URL to capture from production or staging.
                      (Default: http://localhost:3000)
                    
  -c, --clean       Clean up generated files (removes rendered videos and out/ directory).
  
  -u, --upgrade     Upgrade Remotion packages to their latest versions.
  
  -h, --help        Show this comprehensive help message.

Examples:
  ./nc.sh --edit                          # Open Remotion studio
  ./nc.sh --render                        # Produce the final demo.mp4
  ./nc.sh --capture                       # Capture screens from localhost
  ./nc.sh --capture https://castles.io    # Capture screens from production
EOF
}

edit_video() {
  echo "🎬 Starting Remotion Studio..."
  echo "Preview will open in your default browser."
  echo "Press Ctrl+C to stop."
  npm run dev
}

render_video() {
  echo "🎥 Rendering composition '$COMPOSITION' to $OUTPUT_FILE..."
  npx remotion render "$COMPOSITION" "$OUTPUT_FILE"
  echo "✅ Render complete: $OUTPUT_FILE"
}

install_deps() {
  echo "📦 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed."
}

clean_project() {
  echo "🧹 Cleaning up built assets..."
  rm -f "$OUTPUT_FILE"
  rm -rf out/
  echo "✅ Cleanup complete."
}

capture_screens() {
  local target_url="${1:-http://localhost:3000}"
  echo "📸 Running Puppeteer to capture fresh screens from $target_url..."
  node capture.js "$target_url"
}

upgrade_remotion() {
  echo "🚀 Upgrading Remotion..."
  npm run upgrade
  echo "✅ Upgrade complete."
}

# ─── Parse Arguments ─────────────────────────────────────────────────────────
if [[ "$#" -eq 0 ]]; then
  echo "Error: No options provided."
  echo ""
  show_help
  exit 1
fi

while [[ "$#" -gt 0 ]]; do
  case $1 in
    -e|--edit)       edit_video; exit 0 ;;
    -r|--render)     render_video; exit 0 ;;
    -i|--install)    install_deps; exit 0 ;;
    -c|--clean)      clean_project; exit 0 ;;
    -s|--capture)    
      if [[ -n "${2:-}" && ! "$2" == -* ]]; then
        capture_screens "$2"
        exit 0
      else
        capture_screens
        exit 0
      fi
      ;;
    -u|--upgrade)    upgrade_remotion; exit 0 ;;
    -h|--help)       show_help; exit 0 ;;
    *) 
      echo "Unknown option: $1"
      echo ""
      show_help
      exit 1 
      ;;
  esac
  shift
done
