#!/usr/bin/env bash
# Bootstrap Supabase remoto para Kuteka (P2 + auth real).
# Requer: SUPABASE_ACCESS_TOKEN (Account → Access Tokens no dashboard Supabase).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "Falta SUPABASE_ACCESS_TOKEN."
  echo "1. https://supabase.com/dashboard/account/tokens → Generate"
  echo "2. export SUPABASE_ACCESS_TOKEN=sbp_..."
  echo "3. bash scripts/bootstrap-supabase.sh"
  exit 1
fi

ORG_ID="${SUPABASE_ORG_ID:-}"
PROJECT_NAME="${SUPABASE_PROJECT_NAME:-kuteka}"
REGION="${SUPABASE_REGION:-eu-west-1}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-$(openssl rand -base64 24)}"

npx --yes supabase@2 projects list >/dev/null

if [[ -z "$ORG_ID" ]]; then
  echo "Orgs disponíveis:"
  npx --yes supabase@2 orgs list
  echo "Defina SUPABASE_ORG_ID=<id> e volte a correr."
  exit 1
fi

EXISTING="$(npx --yes supabase@2 projects list -o json 2>/dev/null | node -e "
const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8'));
const p=(d||[]).find(x => x.name==='${PROJECT_NAME}');
if (p) process.stdout.write(p.id||p.ref||'');
" || true)"

if [[ -n "$EXISTING" ]]; then
  REF="$EXISTING"
  echo "Projecto existente: $REF"
else
  echo "A criar projecto $PROJECT_NAME em $REGION ..."
  npx --yes supabase@2 projects create "$PROJECT_NAME" \
    --org-id "$ORG_ID" \
    --db-password "$DB_PASSWORD" \
    --region "$REGION"
  REF="$(npx --yes supabase@2 projects list -o json | node -e "
const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8'));
const p=(d||[]).find(x => x.name==='${PROJECT_NAME}');
process.stdout.write(p.id||p.ref||'');
")"
fi

echo "A ligar CLI ao projecto $REF ..."
npx --yes supabase@2 link --project-ref "$REF"

echo "A aplicar migrations 0001→0003 ..."
npx --yes supabase@2 db push

KEYS="$(npx --yes supabase@2 projects api-keys --project-ref "$REF" -o json)"
URL="https://${REF}.supabase.co"
ANON="$(echo "$KEYS" | node -e "
const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8'));
const a=(d||[]).find(x => x.name==='anon' || x.name==='publishable');
process.stdout.write(a?.api_key||a?.key||'');
")"
SERVICE="$(echo "$KEYS" | node -e "
const fs=require('fs'); const d=JSON.parse(fs.readFileSync(0,'utf8'));
const a=(d||[]).find(x => x.name==='service_role' || x.name==='secret');
process.stdout.write(a?.api_key||a?.key||'');
")"

export NEXT_PUBLIC_SUPABASE_URL="$URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON"
node scripts/write-kuteka-config.mjs

cat > /tmp/kuteka-supabase.env <<EOF
NEXT_PUBLIC_SUPABASE_URL=$URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON
SUPABASE_SERVICE_ROLE_KEY=$SERVICE
EOF

echo ""
echo "=== Supabase pronto ==="
echo "URL:  $URL"
echo "Anon: ${ANON:0:12}…"
echo "Env completo (não commit): /tmp/kuteka-supabase.env"
echo ""
echo "Dashboard Auth → URL Configuration:"
echo "  Site URL: https://kutekalink.com"
echo "  Redirect: https://kutekalink.com/auth/**"
echo ""
echo "Depois: republicar static (pnpm build:static + prebuilt) com estas env,"
echo "ou copiar apps/web/public/kuteka-config.js para o host."
