#!/usr/bin/env bash
# P1 / P0-3: enable GitHub Actions CI (requires git push with `workflow` scope)
# Does NOT mark Engineering Gate P1 as done — record evidence in
# docs/backlog/PRD_001_ENGINEERING_GATE.md §8.1 after a green Actions run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/.github/workflows"
cp "$ROOT/docs/engineering/github-workflows/ci.yml" "$ROOT/.github/workflows/ci.yml"
echo "Installed .github/workflows/ci.yml"
echo ""
echo "Next (token MUST include scope: workflow + repo):"
echo "  git add .github/workflows/ci.yml"
echo "  git commit -m 'ci: enable KEOS quality workflow'"
echo "  git push"
echo ""
echo "Then confirm Actions → CI is green, and update Engineering Gate §8.1 with:"
echo "  - run URL"
echo "  - commit SHA"
echo "  - date"
echo "Do not mark Gate P1 ✅ without that evidence."
