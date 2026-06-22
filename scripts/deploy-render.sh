#!/usr/bin/env bash
set -euo pipefail

# Dispara deploy no Render (hook ou API). Uso:
#   RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-... ./scripts/deploy-render.sh
# ou
#   RENDER_API_KEY=... RENDER_SERVICE_ID=srv-... ./scripts/deploy-render.sh

if [[ -n "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  echo "A disparar deploy via hook..."
  curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
  echo ""
  echo "Deploy Render solicitado."
  exit 0
fi

if [[ -n "${RENDER_API_KEY:-}" && -n "${RENDER_SERVICE_ID:-}" ]]; then
  echo "A disparar deploy via API..."
  curl -fsS -X POST "https://api.render.com/v1/services/${RENDER_SERVICE_ID}/deploys" \
    -H "Authorization: Bearer ${RENDER_API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"clearCache":"do_not_clear"}'
  echo ""
  echo "Deploy Render solicitado."
  exit 0
fi

echo "Erro: defina RENDER_DEPLOY_HOOK_URL ou RENDER_API_KEY + RENDER_SERVICE_ID." >&2
exit 1
