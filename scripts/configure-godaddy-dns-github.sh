#!/usr/bin/env bash
# Aponta kutekalink.com para GitHub Pages (site novo).
set -euo pipefail

DOMAIN="${DOMAIN:-kutekalink.com}"
GITHUB_PAGES_A=(
  "185.199.108.153"
  "185.199.109.153"
  "185.199.110.153"
  "185.199.111.153"
)
API_BASE="${API_BASE:-https://api.godaddy.com/v1}"

if [[ -z "${GODADDY_KEY:-}" || -z "${GODADDY_SECRET:-}" ]]; then
  echo "Defina GODADDY_KEY e GODADDY_SECRET (chaves de PRODUÇÃO GoDaddy)."
  exit 1
fi

auth="Authorization: sso-key ${GODADDY_KEY}:${GODADDY_SECRET}"

payload="["
for ip in "${GITHUB_PAGES_A[@]}"; do
  payload+="{\"data\":\"${ip}\",\"ttl\":600},"
done
payload="${payload%,}]"

echo "A apagar A antigos em @ ..."
curl -sS -w "\nHTTP:%{http_code}\n" -X DELETE -H "$auth" "${API_BASE}/domains/${DOMAIN}/records/A/@"

echo "A criar A @ -> GitHub Pages ..."
curl -sS -w "\nHTTP:%{http_code}\n" -X PUT -H "$auth" -H "Content-Type: application/json" \
  "${API_BASE}/domains/${DOMAIN}/records/A/@" \
  -d "$payload"

echo "A criar CNAME www -> eduardoz121.github.io ..."
curl -sS -w "\nHTTP:%{http_code}\n" -X PUT -H "$auth" -H "Content-Type: application/json" \
  "${API_BASE}/domains/${DOMAIN}/records/CNAME/www" \
  -d '[{"data":"eduardoz121.github.io","ttl":600}]'

echo "Feito. Aguarde 15-60 min para propagar."
