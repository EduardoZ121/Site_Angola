#!/usr/bin/env bash
# Configura DNS do kutekalink.com na GoDaddy para apontar ao Render.
# Execute no SEU computador (não no Cursor cloud): bash scripts/configure-godaddy-dns.sh
set -euo pipefail

DOMAIN="${DOMAIN:-kutekalink.com}"
RENDER_HOST="${RENDER_HOST:-kutekalink.onrender.com}"
RENDER_A="${RENDER_A:-216.24.57.1}"
API_BASE="${API_BASE:-https://api.godaddy.com/v1}"

if [[ -z "${GODADDY_KEY:-}" || -z "${GODADDY_SECRET:-}" ]]; then
  echo "Defina GODADDY_KEY e GODADDY_SECRET antes de correr:"
  echo '  export GODADDY_KEY="sua_key"'
  echo '  export GODADDY_SECRET="seu_secret"'
  exit 1
fi

auth="Authorization: sso-key ${GODADDY_KEY}:${GODADDY_SECRET}"

echo "A ler registos actuais de ${DOMAIN}..."
curl -sS -H "$auth" "${API_BASE}/domains/${DOMAIN}/records" | python3 -m json.tool || true

echo "A apagar registos A antigos em @ ..."
curl -sS -X DELETE -H "$auth" "${API_BASE}/domains/${DOMAIN}/records/A/@"

echo "A criar A @ -> ${RENDER_A} ..."
curl -sS -X PUT -H "$auth" -H "Content-Type: application/json" \
  "${API_BASE}/domains/${DOMAIN}/records/A/@" \
  -d "[{\"data\":\"${RENDER_A}\",\"ttl\":600}]"

echo "A criar CNAME www -> ${RENDER_HOST} ..."
curl -sS -X PUT -H "$auth" -H "Content-Type: application/json" \
  "${API_BASE}/domains/${DOMAIN}/records/CNAME/www" \
  -d "[{\"data\":\"${RENDER_HOST}\",\"ttl\":600}]"

echo "Registos finais:"
curl -sS -H "$auth" "${API_BASE}/domains/${DOMAIN}/records" | python3 -m json.tool

echo ""
echo "Feito. Aguarde 15-120 minutos para propagar."
echo "Confirme no Render: Settings -> Custom Domains -> kutekalink.com e www.kutekalink.com"
echo "Teste: dig ${DOMAIN} A +short  (deve mostrar ${RENDER_A})"
