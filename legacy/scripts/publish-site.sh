#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export VITE_GOOGLE_CLIENT_ID="${VITE_GOOGLE_CLIENT_ID:-17788689781-3laohdt607lr8jnh30fatvqtji6htt3l.apps.googleusercontent.com}"

npm run build

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

cp -a dist/. "$STAGE/"
printf 'kutekalink.com\n' > "$STAGE/CNAME"

git fetch origin gh-pages
if git rev-parse --verify origin/gh-pages >/dev/null 2>&1; then
  git worktree add "$STAGE/.git-meta" origin/gh-pages 2>/dev/null || true
fi

cd "$STAGE"
git init
git config user.email "deploy@kutekalink.com"
git config user.name "Kuteka Deploy"
git add -A
git commit -m "Deploy kutekalink.com $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -f "https://x-access-token:${GH_TOKEN}@github.com/EduardoZ121/Site_Angola.git" HEAD:gh-pages

echo "GitHub Pages gh-pages actualizado."

if [[ -n "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
  echo "Render deploy disparado."
fi
