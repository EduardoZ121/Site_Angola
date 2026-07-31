#!/usr/bin/env bash
# Build a static export of apps/web for GitHub Pages / static hosts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB="$ROOT/apps/web"
cd "$WEB"

cleanup() {
  if [[ -f middleware.ts.staticbak ]]; then
    mv -f middleware.ts.staticbak middleware.ts
  fi
  if [[ -d "$WEB/.staticbak/api" ]]; then
    rm -rf app/api
    mv "$WEB/.staticbak/api" app/api
  fi
  while IFS= read -r -d '' bak; do
    mv -f "$bak" "${bak%.staticbak}"
  done < <(find app -type f -name 'route.ts.staticbak' -print0 2>/dev/null || true)
  rmdir "$WEB/.staticbak" 2>/dev/null || true
}
trap cleanup EXIT

# Clean leftovers from failed runs
rm -rf app/api.staticbak
mkdir -p "$WEB/.staticbak"

# Static export is incompatible with middleware + Route Handlers
if [[ -f middleware.ts ]]; then
  mv middleware.ts middleware.ts.staticbak
fi
if [[ -d app/api ]]; then
  mv app/api "$WEB/.staticbak/api"
fi
# Stash any remaining Route Handlers under app/
while IFS= read -r -d '' route; do
  bak="${route}.staticbak"
  mv "$route" "$bak"
done < <(find app -type f -name 'route.ts' -print0 2>/dev/null || true)

export STATIC_EXPORT=1
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://kutekalink.com}"
export NEXT_PUBLIC_ENABLE_DEV_TOOLS=false

# Clear previous Next output that may still reference bak routes
rm -rf .next out

pnpm exec next build

if [[ ! -f out/404.html && -f out/index.html ]]; then
  cp out/index.html out/404.html
fi

echo 'kutekalink.com' > out/CNAME
# Runtime public config (may be empty until Supabase keys are set)
node "$ROOT/scripts/write-kuteka-config.mjs"
cp -f "$WEB/public/kuteka-config.js" out/kuteka-config.js

echo "Static export ready at apps/web/out"
ls -la out | head
