#!/usr/bin/env node
/**
 * Apply Kuteka security response headers via Cloudflare Transform Rules API.
 * Requires env: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
 * Idempotent: updates existing rule named KUTEKA_SECURITY_HEADERS if present.
 *
 * Does NOT print secrets. Exits 0 when applied; exits 2 when credentials missing
 * (non-fatal for CI — document as external blocker).
 */
const RULE_NAME = 'KUTEKA_SECURITY_HEADERS';

const HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: blob: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https: wss:; upgrade-insecure-requests",
};

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) {
    console.log(
      'SKIP: CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID not set — apply rules manually (see docs/security/PRODUCTION_EDGE_HEADERS.md)',
    );
    process.exit(2);
  }

  const base = `https://api.cloudflare.com/client/v4/zones/${zoneId}/rulesets`;
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const listRes = await fetch(`${base}?phase=http_response_headers_transform`, { headers });
  const listJson = await listRes.json();
  if (!listJson.success) {
    console.error('Cloudflare list rulesets failed', listJson.errors);
    process.exit(1);
  }

  const actionParams = {
    headers: Object.entries(HEADERS).map(([name, value]) => ({
      operation: 'set',
      name,
      value: { expression: `"${value.replace(/"/g, '\\"')}"` },
    })),
  };

  const rule = {
    expression: 'true',
    description: RULE_NAME,
    action: 'rewrite',
    action_parameters: actionParams,
    enabled: true,
  };

  const existing = (listJson.result || []).find(
    (r) => r.phase === 'http_response_headers_transform',
  );
  if (!existing) {
    const createRes = await fetch(base, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Kuteka response headers',
        kind: 'zone',
        phase: 'http_response_headers_transform',
        rules: [rule],
      }),
    });
    const createJson = await createRes.json();
    if (!createJson.success) {
      console.error('Create ruleset failed', createJson.errors);
      process.exit(1);
    }
    console.log('Created Cloudflare response headers ruleset');
    return;
  }

  const getRes = await fetch(`${base}/${existing.id}`, { headers });
  const getJson = await getRes.json();
  const rules = getJson.result?.rules || [];
  const idx = rules.findIndex((r) => (r.description || '').includes(RULE_NAME));
  if (idx >= 0) rules[idx] = { ...rules[idx], ...rule };
  else rules.push(rule);

  const putRes = await fetch(`${base}/${existing.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: existing.name || 'Kuteka response headers',
      description: existing.description,
      kind: 'zone',
      phase: 'http_response_headers_transform',
      rules,
    }),
  });
  const putJson = await putRes.json();
  if (!putJson.success) {
    console.error('Update ruleset failed', putJson.errors);
    process.exit(1);
  }
  console.log('Updated Cloudflare security headers transform rule');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
