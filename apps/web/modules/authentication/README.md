# Module: authentication

Domínio KEOS — **PRD-001** em implementação (N2 · ADR-004).

**Spec oficial:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` (v1.0)  
**Gate:** `docs/backlog/PRD_001_ENGINEERING_GATE.md` (§15 — P2 diferido)  
**Readiness:** `docs/backlog/PRD_001_IMPLEMENTATION_READINESS.md` (**Activo**)  
**Copy:** `content/pt.ts` ← `docs/backlog/PRD_001_CONTENT_INVENTORY.md`

## Estrutura

- `content/` — copy i18n-ready (`getAuthCopy`)
- `components/` — AuthShell, forms F1–F6, PasswordRules, SubmitButton
- `lib/` — destination gate (R1), supabase config check
- `services/auth-client.ts` — wrappers Supabase + erros guiados PT (R2/R6)

## Regras

1. Fonte de verdade: §15.5 R1–R12 + §16.5–§16.6
2. Sem OAuth / MFA / Passaporte / KAI
3. Sem `legacy/`
4. Env Supabase ausente → UI renderiza; submits com erro guiado
