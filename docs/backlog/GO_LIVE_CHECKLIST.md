# Checklist go-live Kuteka (mínimo)

## Já feito

- [x] Landing KEOS
- [x] CI quality activo e verde
- [x] PRD-001 auth código merged (`main`)
- [x] Export estático `/auth/*` + `/app` no ar
- [x] **E3** — `https://kutekalink.com` serve site novo (Render)
- [x] **E4** — Deploy Kuteka verde (`package-lock.json`)
- [x] Runtime `kuteka-config.js` para activar Supabase sem rebuild completo
- [x] Script `scripts/bootstrap-supabase.sh` para P2 + keys

## Ops restante

- [ ] **E2 / P2** — `SUPABASE_ACCESS_TOKEN` (+ org) → `bash scripts/bootstrap-supabase.sh`
- [ ] P4 — templates email Auth + redirect allowlist
- [ ] E1 (opcional) — actualizar `deploy.yml` activo para pnpm

## Validação produto (após E2)

- [ ] `/auth/registar` e `/auth/entrar` sem banner “config em falta”
- [ ] Fluxo F1→F2→F6→`/app` com conta real
- [ ] Logout `/auth/sair`
