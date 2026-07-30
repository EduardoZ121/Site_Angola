#!/usr/bin/env bash
# Render static service expects: npm install && npm run build → ./dist
# KEOS uses pnpm; this script installs with pnpm and publishes the static export.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://kutekalink.com}"
export NEXT_PUBLIC_ENABLE_DEV_TOOLS="${NEXT_PUBLIC_ENABLE_DEV_TOOLS:-false}"

if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@10.33.3 --activate
fi

if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g pnpm@10.33.3
fi

pnpm install --frozen-lockfile
bash scripts/build-static-web.sh

rm -rf dist
mkdir -p dist
cp -a apps/web/out/. dist/

echo "Render static publish ready at ./dist"
ls -la dist | head
