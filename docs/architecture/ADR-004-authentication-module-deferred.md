# ADR-004 — Authentication module (PRD-001)

**Estado:** ⏳ **Diferido** — redigir e aceitar **apenas** após Engineering Gate verde  
**Activação:** Autorização de Implementação **condicional** (PO 2026-07-30) activa-se com P1+P2 — sem nova confirmação  
**PRD:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` v1.0 (Aprovação Funcional ✅)  
**Contrato comportamental já fixo:** §16.5 (`activate_self_serve_roles`) · §15.5 R1–R12 · §16.6 (`next`)

## Âmbito previsto (não implementar agora)

1. RPC self-serve de papéis (SQL, grants, idempotência L6.9)
2. Session refresh no middleware / SSR cookies
3. Abstração provider-agnostic (email MVP; OAuth depois — D1/D12)
4. Content i18n-ready do módulo authentication (`PRD_001_CONTENT_INVENTORY.md`)
5. Allowlist `next` (§16.6)

## Fora de âmbito

- UI Passaporte / KAI / SCK
- Dashboards de negócio
- Alterar D1–D12 / F1–F6

## Decisão

Reservada à fase de implementação autorizada (Gate verde). Este ficheiro existe só para rastreabilidade do ADR futuro.
