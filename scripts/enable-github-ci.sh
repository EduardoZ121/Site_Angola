#!/usr/bin/env bash
# P0-3: enable GitHub Actions CI (requires git push with `workflow` scope)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/.github/workflows"
cp "$ROOT/docs/engineering/github-workflows/ci.yml" "$ROOT/.github/workflows/ci.yml"
echo "Installed .github/workflows/ci.yml"
echo "Commit and push with a token that has the workflow scope:"
echo "  git add .github/workflows/ci.yml && git commit -m 'ci: enable KEOS quality workflow' && git push"
