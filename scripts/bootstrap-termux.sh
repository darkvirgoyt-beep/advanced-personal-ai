#!/data/data/com.termux/files/usr/bin/bash
# Run this from Termux to clone or update Nova AI, then start it.
set -euo pipefail

REPO_URL="${NOVA_AI_REPO_URL:-https://github.com/darkvirgoyt-beep/advanced-personal-ai.git}"
APP_DIR="${NOVA_AI_DIR:-$HOME/nova-ai}"

if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$APP_DIR"
fi

exec "$APP_DIR/scripts/start-termux.sh"
