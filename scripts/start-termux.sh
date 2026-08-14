#!/data/data/com.termux/files/usr/bin/bash
# Nova AI one-command Termux launcher. It uses a reachable MySQL/TiDB database.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  pkg update -y
  pkg install -y nodejs-lts git openssl
fi

if [ ! -f .env ]; then
  echo "First-time Nova AI configuration"
  read -r -p "Paste a reachable MySQL/TiDB DATABASE_URL: " DATABASE_URL
  if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL is required. Create a MySQL/TiDB database, then run this command again."
    exit 1
  fi
  JWT_SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
DATABASE_URL=$DATABASE_URL
JWT_SECRET=$JWT_SECRET
NODE_ENV=production
PORT=3000
PUBLIC_APP_URL=http://127.0.0.1:3000
STORAGE_MODE=local
LOCAL_STORAGE_DIR=./data/uploads
EOF
  echo "Created a private .env file with a generated session secret."
fi

exec "$ROOT_DIR/scripts/start-local.sh"
