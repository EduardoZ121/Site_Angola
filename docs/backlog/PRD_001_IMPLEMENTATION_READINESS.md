# PRD-001 — Implementation Readiness Pack

**Estado:** 📦 Preparado · **Activação automática** quando Gate P1+P2 ✅  
**Autorização:** Condicional pré-emitida pelo PO (2026-07-30) — activa com evidência no Gate  
**Spec oficial:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` v1.0  
**Gate:** `docs/backlog/PRD_001_ENGINEERING_GATE.md`  
**ADR futuro:** `docs/architecture/ADR-004-authentication-module-deferred.md`  
**Inventário de copy:** `docs/backlog/PRD_001_CONTENT_INVENTORY.md`  
**Protocolo pós-evidência:** `scripts/on-prd001-gate-green.sh`

Este pack **activa-se automaticamente** quando o Engineering Gate registar P1+P2 com evidência. Não pedir nova confirmação ao PO.

---

## 0. Pré-condições (todas obrigatórias)

| #   | Pré-condição                                | Evidência                                                 |
| --- | ------------------------------------------- | --------------------------------------------------------- |
| 1   | Aprovação Funcional PRD-001                 | ✅ v1.0                                                   |
| 2   | P1 CI activo + verde                        | Gate §8.1                                                 |
| 3   | P2 migration `0002` no remoto               | Gate §8.2                                                 |
| 4   | Autorização de Implementação (PO)           | ✅ Condicional pré-emitida (2026-07-30); activa com P1+P2 |
| 5   | (Recomendado) P4 templates Auth + redirects | Gate §8.3                                                 |

---

## 1. Protocolo de activação (quando P1+P2 ✅)

1. Actualizar Gate §8.1–§8.2 + estado → **verde**
2. Marcar este pack como **Activo**
3. Branch: `cursor/prd-001-authentication-f96b` a partir de `main` actualizado
4. Implementar até conclusão do módulo (N5)
5. Interromper só por decisão de negócio, alteração estratégica ou risco crítico

Helper: `./scripts/on-prd001-gate-green.sh` (checklist + verificação objectiva de P1 via `gh`).

---

## 2. Branch e entregáveis

1. Código módulo `apps/web/modules/authentication` + rotas `(auth)` / stubs `(app)`
2. Migration RPC `activate_self_serve_roles` (+ grants) — seguir §16.5
3. ADR-004 (substituir o placeholder diferido)
4. Testes: unit (R4/R5/`next`) · integration RPC · e2e smoke F1→F2→F6→`/app`
5. Relatório 4 níveis (`DEVELOPMENT_PROCESS.md`)
6. Actualizar AI_CONTEXT / Gate → maturidade **N4** depois **N5**

---

## 3. Mapa de ficheiros previsto (não criar até activação)

| Área                  | Destino típico                                                                          |
| --------------------- | --------------------------------------------------------------------------------------- |
| Rotas F1–F6           | `apps/web/app/(auth)/auth/...` (§12.1)                                                  |
| Stub autenticado      | `apps/web/app/(app)/...`                                                                |
| Módulo                | `apps/web/modules/authentication/{components,services,hooks,types,validators}`          |
| Content i18n-ready    | `apps/web/modules/authentication/content/` (pt-AO; chaves EN reservadas)                |
| Session / middleware  | helpers + refresh cookies (R1 / R11)                                                    |
| `next` allowlist      | util puro conforme §16.6 / R3                                                           |
| RPC papéis            | `supabase/migrations/0003_*.sql` (ou extensão pós-0002)                                 |
| Packages a reutilizar | `@kuteka/database`, `@kuteka/auth`, `@kuteka/validation`, `@kuteka/types`, `@kuteka/ui` |

**Proibido:** implementar em `legacy/`.

---

## 4. Ordem de implementação sugerida

1. Session helpers + middleware refresh (R1 / R11)
2. Content centralizado i18n-ready (ver inventário de copy)
3. F1 Registo → F2 Verify → F3 Login → F4 Logout → F5 Recuperação → F6 Onboarding
4. RPC papéis + audit canónico §13
5. Landing CTAs D11 (sessão → app sem re-auth)
6. Stub `/app` + `/app/admin` (`admin.panel`)
7. Hardening: R3 allowlist, R6 anti-enum, R7 forms

**Fonte de verdade em caso de dúvida:** §15.5 R1–R12 prevalece sobre copy avulsa (desde que não contradiga D1–D12).

---

## 5. Matriz de testes mínima (aceitar módulo)

| Camada      | Cobertura mínima                                                                  |
| ----------- | --------------------------------------------------------------------------------- |
| Unit        | Password rules R4; `next` allowlist §16.6; anti-enum messaging R6                 |
| Integration | `activate_self_serve_roles` (§16.5) + `write_audit_log` eventos §13               |
| E2E smoke   | F1→F2→F6→`/app`; login F3; logout F4; recuperar F5; CTA Landing autenticado (D11) |
| a11y / UX   | Um ecrã = uma missão; erros guiados; sem cards decorativos no hero auth (§18)     |

Checklist funcional completo: PRD §16.2–§16.4.

---

## 6. Fora de âmbito (não fazer nesta implementação)

- Passaporte / KAI / SCK na UI
- OAuth / MFA / telefone auth
- Dashboards / Shell completo
- UI gestão de papéis (pós-MVP)
- Contornar Gate ou implementar sem P1+P2 evidentes

---

## 7. Checklist de arranque (copiar para o PR de implementação)

- [ ] Gate P1 ✅ com URL do run
- [ ] Gate P2 ✅ com project ref
- [ ] Autorização condicional activa (P1+P2)
- [ ] Branch de implementação criada
- [ ] ADR-004 aberto em rascunho N2
- [ ] Content keys alinhadas ao inventário

---

**Autonomia:** actualizar este pack livremente; **activar código** assim que Gate §8.1 e §8.2 estiverem ✅ — sem nova confirmação PO.
