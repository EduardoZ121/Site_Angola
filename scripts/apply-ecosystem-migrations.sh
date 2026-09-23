#!/usr/bin/env bash
# Apply supabase/migrations/0043–0048 to linked remote.
# Requires: SUPABASE_ACCESS_TOKEN + project ref, OR SUPABASE_DB_URL
set -euo pipefail
REF="${SUPABASE_PROJECT_REF:-vhqwitbrpqaiutjbundo}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
  npx --yes supabase db push --db-url "$SUPABASE_DB_URL" --include-all
  exit 0
fi
if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  npx --yes supabase link --project-ref "$REF" -p "${SUPABASE_DB_PASSWORD:-}" <<< "" || true
  npx --yes supabase db push
  exit 0
fi
echo "Set SUPABASE_DB_URL or SUPABASE_ACCESS_TOKEN (+ DB password for link)."
exit 2
