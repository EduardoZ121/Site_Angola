# ADR-004 — Authentication module (PRD-001)

**Estado:** ✅ **Accepted / in progress** (N2)  
**Data:** 2026-07-31  
**PRD:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` v1.0  
**Autorização:** PO 2026-07-31 — implementação autorizada com P2 diferido (Gate §15)  
**Contrato:** §15.5 R1–R12 · §16.5 (`activate_self_serve_roles`) · §16.6 (`next`) · content inventory

## Contexto

O módulo de autenticação é o primeiro contacto autenticado com a plataforma Kuteka. A especificação funcional está aprovada; P1 (CI) está verde; P2 (migration `0002` no remoto) foi diferido pelo PO para permitir arranque de código, mantendo-se obrigatório antes de go-live.

## Decisão

Implementar o módulo auth em `apps/web/modules/authentication` + rotas `(auth)` / `(app)`, com:

### 1. Sessão (SSR-safe)

- Browser + server clients via `@kuteka/database` / `@supabase/ssr`
- Middleware: refresh de cookies quando `NEXT_PUBLIC_SUPABASE_*` estiver presente
- Sem sessão em `/app/*` → redirect `/auth/entrar?next=…`
- Env ausente: UI renderiza; submits devolvem erros guiados (R2), sem crash

### 2. Allowlist `next` (R3 / §16.6)

- Função pura `resolveSafeNextPath` em `@kuteka/auth`
- Default `/app`; rejeitar absolutos, `//`, `..`, paths fora de `/app`
- `/app/admin` só com `admin.panel`; caso contrário `/app`

### 3. Gate de destino (R1)

- Ordem: sessão → email verificado → ≥1 papel → `next` seguro
- Preservar `next` ao atravessar F2 / F6 quando possível

### 4. RPC `activate_self_serve_roles` (§16.5)

- Migration `supabase/migrations/0003_activate_self_serve_roles.sql`
- Security definer; exige `auth.uid()`; só `client` / `patrimonial_partner`
- Insert idempotente em `user_roles`; audit `auth.role_activated` via `write_audit_log`
- Grant execute a `authenticated`

### 5. Content i18n-ready

- Copy centralizado em `modules/authentication/content/pt.ts` + `getAuthCopy()`
- Locale MVP `pt-AO` (D9); chaves reservadas para `en` sem UI EN no MVP
- Fonte: `docs/backlog/PRD_001_CONTENT_INVENTORY.md` + wireframes §18

### 6. Packages

- `@kuteka/validation`: `normalizeEmail`, `passwordRules`, schemas Zod auth
- `@kuteka/auth`: helpers RBAC existentes + `resolveSafeNextPath`
- UI: `@kuteka/ui` (Button, Input, Label, Checkbox, Heading, Text, Alert, Spinner)

## Consequências

- Landing CTAs apontam para `/auth/registar` e `/auth/entrar`
- Stub `/app` e `/app/admin` até módulos de negócio
- P2 + aplicação remota de `0002`/`0003` necessários para e2e real
- Sem OAuth / MFA / Passaporte / KAI nesta entrega

## Fora de âmbito

- UI Passaporte / KAI / SCK
- Dashboards de negócio
- Alterar D1–D12 / F1–F6
- Marcar P2 como ✅ sem evidência
