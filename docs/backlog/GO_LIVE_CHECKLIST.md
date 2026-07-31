# Checklist go-live Kuteka (mínimo)

Quando E1–E4 / P2 estiverem resolvidos, executar nesta ordem — **sem reabrir metodologia**.

## Já feito

- [x] Landing KEOS
- [x] CI quality activo e verde
- [x] PRD-001 auth código merged (`main`)
- [x] Export estático com `/auth/*` e `/app` publicado em `gh-pages`
- [x] Stub `/app` com aviso sem Supabase + banner auth (config em falta)
- [x] Mitigação E4: `package-lock.json` na raiz para Deploy Kuteka (`cache: npm`)

## Ops (bloqueios externos) — por urgência

1. [ ] **E3 (mais urgente para utilizadores)** — DNS `kutekalink.com` → GitHub Pages (hoje ainda Render legado; GoDaddy API 401)
2. [ ] **E2 / P2** — Supabase: migrations `0001`→`0002`→`0003` + env públicos
3. [ ] **P4** — templates email Auth + redirect allowlist
4. [ ] **E1** — token com write a workflows (opcional)
5. [ ] **E4 fix definitivo** — substituir `.github/workflows/deploy.yml` pelo de `docs/engineering/github-workflows/deploy.yml` (pnpm)

## Validação produto

- [ ] Abrir `/auth/registar` e `/auth/entrar` no domínio final (bloqueado por E3)
- [ ] Fluxo F1→F2→F6→`/app` com Supabase real (bloqueado por E2)
- [ ] Logout `/auth/sair`
- [ ] Landing CTAs Começar/Entrar

## Depois

- Shell `/app` real (hoje stub com roadmap “Em preparação”)
- Módulos património / listagens conforme roadmap
