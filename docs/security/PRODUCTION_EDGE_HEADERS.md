# Production edge security headers (kutekalink.com)

## Problem

Production is served via **Cloudflare → GitHub Pages** (and optionally Render).
GitHub Pages does **not** honour `next.config` / `middleware` headers on static export.
Live `curl -sI https://kutekalink.com` currently returns only `x-content-type-options: nosniff`
unless Cloudflare Transform Rules are applied.

Repo already defines the canonical set in:

- `apps/web/lib/security-headers.ts`
- `render.yaml` (when Render is the origin)
- HTML meta CSP / nosniff / referrer in `apps/web/app/layout.tsx` (defense-in-depth; **cannot** set HSTS)

## Required edge headers

| Header                    | Value                                                        |
| ------------------------- | ------------------------------------------------------------ |
| X-Content-Type-Options    | nosniff                                                      |
| X-Frame-Options           | DENY                                                         |
| Referrer-Policy           | strict-origin-when-cross-origin                              |
| Permissions-Policy        | camera=(), microphone=(), geolocation=(), payment=(), usb=() |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload                 |
| Content-Security-Policy   | see `SECURITY_HEADERS` in `security-headers.ts`              |

## Apply (preferred — CI)

1. Create Cloudflare API token with Zone → Transform Rules → Edit
2. Set GitHub Actions secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`
3. Deploy workflow runs `node scripts/apply-cloudflare-security-headers.mjs`

## Apply (manual — Cloudflare dashboard)

1. Cloudflare → kutekalink.com → Rules → Transform Rules → **Modify Response Header**
2. Name: `KUTEKA_SECURITY_HEADERS`
3. When: All incoming requests
4. Then: Set each header above
5. Deploy

## Verify

```bash
curl -sI https://kutekalink.com/ | grep -iE 'content-security|strict-transport|x-frame|referrer-policy|permissions-policy|x-content-type'
```

Expect all six present.

## Status

- **Code/docs:** ready in repo
- **Live edge:** requires Cloudflare secret or manual rule (external admin action)
