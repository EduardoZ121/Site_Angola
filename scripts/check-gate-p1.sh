#!/usr/bin/env bash
# Objectively check Engineering Gate P1 (CI workflow present + recent green run).
# Does NOT mark the Gate ✅ — only prints evidence for humans / on-prd001-gate-green.sh
# Requires: gh auth with access to EduardoZ121/Site_Angola (repo scope is enough to read Actions).
set -euo pipefail

REPO="${GITHUB_REPOSITORY:-EduardoZ121/Site_Angola}"

echo "== P1 check: CI workflow on ${REPO} =="

if ! command -v gh >/dev/null 2>&1; then
  echo "FAIL: gh CLI not found"
  exit 2
fi

# Is ci.yml present on default branch?
CI_PATH=".github/workflows/ci.yml"
if gh api "repos/${REPO}/contents/${CI_PATH}" --jq .path >/dev/null 2>&1; then
  echo "OK: ${CI_PATH} exists on default branch content API"
else
  # Try main explicitly
  if gh api "repos/${REPO}/contents/${CI_PATH}?ref=main" --jq .path >/dev/null 2>&1; then
    echo "OK: ${CI_PATH} exists on main"
  else
    echo "FAIL: ${CI_PATH} not found on remote (P1 still open)"
    echo "HINT: see docs/backlog/PO_ACTION_P1_P2.md"
    exit 1
  fi
fi

# Find workflow named CI
WF_ID="$(gh api "repos/${REPO}/actions/workflows" --jq '.workflows[] | select(.path==".github/workflows/ci.yml") | .id' 2>/dev/null | head -1 || true)"
if [[ -z "${WF_ID}" ]]; then
  echo "FAIL: workflow file may exist but Actions has not registered CI yet"
  exit 1
fi
echo "OK: workflow id=${WF_ID}"

RUN_JSON="$(gh api "repos/${REPO}/actions/workflows/${WF_ID}/runs?per_page=5" --jq '.workflow_runs[:5] | map({conclusion,html_url,head_sha,created_at,status})')"
echo "Recent runs:"
echo "${RUN_JSON}" | head -c 2000
echo

GREEN_URL="$(echo "${RUN_JSON}" | python3 -c 'import json,sys; runs=json.load(sys.stdin);
print(next((r["html_url"] for r in runs if r.get("conclusion")=="success"), ""))' 2>/dev/null || true)"

if [[ -n "${GREEN_URL}" ]]; then
  echo "OK: found successful CI run"
  echo "EVIDENCE_URL=${GREEN_URL}"
  exit 0
fi

echo "FAIL: no successful CI run yet (workflow present but not green)"
exit 1
