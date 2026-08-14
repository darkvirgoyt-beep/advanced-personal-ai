#!/usr/bin/env bash
# Nova AI local launcher for Linux and macOS.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 22 or newer is required. Install it, then run this launcher again."
  exit 1
fi

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Nova AI requires Node.js 22 or newer; found Node.js $(node --version)."
  exit 1
fi

if ! command -v corepack >/dev/null 2>&1; then
  npm install --global corepack@latest
fi
corepack enable || true

if [ ! -f .env ]; then
  cp config/self-host.env.template .env
  echo "Created .env from config/self-host.env.template. Set DATABASE_URL and JWT_SECRET, then run this command again."
  exit 1
fi

if grep -q "CHANGE_ME" .env; then
  echo "Update the CHANGE_ME values in .env before starting Nova AI."
  exit 1
fi

pnpm install --frozen-lockfile
pnpm db:push
pnpm build
exec pnpm start
