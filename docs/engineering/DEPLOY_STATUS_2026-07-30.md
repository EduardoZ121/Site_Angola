# Deploy status — 2026-07-30

## Done

- `main` has KEOS + Landing static publish path.
- GitHub Actions **Deploy Kuteka** is green again.
- Branch **`gh-pages`** serves the new Landing (`Kuteka — Património. Confiança. Habitação.`).
- Verified: `Host: kutekalink.com` against GitHub Pages IPs returns the new title.

## Blocked on production DNS (kutekalink.com)

- Apex still resolves to Render (`216.24.57.1`) and serves the **legacy Vite** marketplace (`last-modified: 2026-06-30`).
- Render deploy hooks accept requests, but the live static service does **not** change content (builds failing or service stuck; API keys for Render/GoDaddy available in older agent env are unauthorized).

## What unlocks kutekalink.com

Pick one:

1. **DNS → GitHub Pages (fastest)**  
   Point `@` A records to `185.199.108.153` / `.109.` / `.110.` / `.111.` and `www` CNAME to `eduardoz121.github.io`.  
   Script: `legacy/scripts/configure-godaddy-dns-github.sh` (needs valid GoDaddy production API keys).

2. **Fix Render dashboard**  
   Open service `kutekalink` (`srv-d8ov5g6gvqtc738m4jpg`), inspect latest deploy logs, set Node 20+, ensure build `npm install && npm run build` and publish path `dist`.  
   Root `package.json` build copies `prebuilt/web-out` → `dist`.

3. **Vercel (target architecture)**  
   Connect `apps/web` with a Vercel token and move the domain.
