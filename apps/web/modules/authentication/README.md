# Module: authentication

Domínio KEOS — **PRD-001 concluído (N5 · 2026-07-31)**.

**Spec oficial:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` (v1.0)  
**Encerramento:** `docs/backlog/PRD_001_CLOSURE.md`  
**ADR:** `docs/architecture/ADR-004-authentication-module-deferred.md`  
**Copy:** `content/pt.ts` ← `docs/backlog/PRD_001_CONTENT_INVENTORY.md`

## Estrutura

- `content/` — copy i18n-ready (`getAuthCopy`)
- `components/` — AuthShell, BrandMark, forms F1–F6, AppShell / AppHomeClient
- `lib/` — destination gate (R1), supabase / public config
- `services/auth-client.ts` — wrappers Supabase + erros guiados PT (R2/R6)

## Regras

1. Fonte de verdade: §15.5 R1–R12 + §16.5–§16.6
2. Sem OAuth / MFA / Passaporte / KAI neste módulo
3. Sem `legacy/`
4. Não reabrir polish cosmético do stub excepto erro crítico de funcionamento
