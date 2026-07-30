#!/usr/bin/env bash
# Render static service expects: npm install && npm run build → ./dist
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

publish_dist() {
  local src="$1"
  rm -rf dist
  mkdir -p dist
  cp -a "$src"/. dist/
  # Render does not need GitHub Pages CNAME
  rm -f dist/CNAME
  echo "Static publish ready at ./dist (from $src)"
  ls -la dist | head
}

# Prefer committed static snapshot — reliable on Render free tier / limited Node.
if [[ "${USE_PREBUILT_STATIC:-1}" == "1" && -d prebuilt/web-out && -f prebuilt/web-out/index.html ]]; then
  publish_dist prebuilt/web-out
  exit 0
fi

export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://kutekalink.com}"
export NEXT_PUBLIC_ENABLE_DEV_TOOLS="${NEXT_PUBLIC_ENABLE_DEV_TOOLS:-false}"

if command -v corepack >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@10.33.3 --activate || true
fi

if ! command -v pnpm >/dev/null 2>&1; then
  npm install -g pnpm@10.33.3
fi

pnpm install --frozen-lockfile
bash scripts/build-static-web.sh
publish_dist apps/web/out
