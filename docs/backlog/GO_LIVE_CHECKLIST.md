# Checklist go-live Kuteka (mínimo)

Quando E1–E4 / P2 estiverem resolvidos, executar nesta ordem — **sem reabrir metodologia**.

## Já feito

- [x] Landing KEOS
- [x] CI quality activo e verde
- [x] PRD-001 auth código merged (`main`)
- [x] Export estático com `/auth/*` e `/app` publicado em `gh-pages`

## Ops (bloqueios externos)

- [ ] E1 — token com write a workflows (opcional mas útil)
- [ ] E4 — `deploy.yml`: remover `cache: npm` **ou** restaurar `package-lock` + alinhar `ci.yml` sem `version: 10`
- [ ] E2 / P2 — Supabase: migrations `0001`→`0002`→`0003` + env públicos
- [ ] P4 — templates email Auth + redirect allowlist
- [ ] E3 — DNS `kutekalink.com` → GitHub Pages (hoje o domínio ainda aponta ao Render legado)

## Validação produto

- [ ] Abrir `/auth/registar` e `/auth/entrar` no domínio final
- [ ] Fluxo F1→F2→F6→`/app` com Supabase real
- [ ] Logout `/auth/sair`
- [ ] Landing CTAs Começar/Entrar

## Depois

- Shell `/app` real (hoje stub)
- Módulos património / listagens conforme roadmap
