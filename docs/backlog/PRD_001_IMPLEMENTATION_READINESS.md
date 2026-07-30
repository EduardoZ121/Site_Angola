# PRD-001 — Implementation Readiness Pack (diferido)

**Estado:** 📦 Preparado · **Activação proibida** até Engineering Gate verde + Autorização de Implementação (Fase 2)  
**Spec oficial:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` v1.0  
**Gate:** `docs/backlog/PRD_001_ENGINEERING_GATE.md`  
**ADR futuro:** `docs/architecture/ADR-004-authentication-module-deferred.md`

Este documento **não** autoriza código. Existe para eliminar atrito no dia em que a Fase 2 for emitida.

---

## 0. Pré-condições (todas obrigatórias)

| #   | Pré-condição                                | Evidência |
| --- | ------------------------------------------- | --------- |
| 1   | Aprovação Funcional PRD-001                 | ✅ v1.0   |
| 2   | P1 CI activo + verde                        | Gate §8.1 |
| 3   | P2 migration `0002` no remoto               | Gate §8.2 |
| 4   | Autorização de Implementação (PO)           | Explícita |
| 5   | (Recomendado) P4 templates Auth + redirects | Gate §8.3 |

---

## 1. Branch e entregáveis (quando autorizado)

1. Branch: `cursor/prd-001-authentication-f96b` (a partir de `main` actualizado)
2. Código módulo `apps/web/modules/authentication` + rotas `(auth)` / `(app)`
3. Migration RPC `activate_self_serve_roles` (+ grants) — seguir §16.5
4. ADR-004 (substituir o placeholder diferido)
5. Testes: unit (R4/R5/`next`) · integration RPC · e2e smoke F1→F2→F6→`/app`
6. Relatório 4 níveis (`DEVELOPMENT_PROCESS.md`)
7. Actualizar AI_CONTEXT / Gate → maturidade **N4** depois **N5**

---

## 2. Ordem de implementação sugerida (técnico)

1. Session helpers + middleware refresh (R1 / R11)
2. Content centralizado i18n-ready (copy F1–F6)
3. F1 Registo → F2 Verify → F3 Login → F4 Logout → F5 Recuperação → F6 Onboarding
4. RPC papéis + audit canónico §13
5. Landing CTAs D11 (sessão → app sem re-auth)
6. Stub `/app` + `/app/admin` (`admin.panel`)
7. Hardening: R3 allowlist, R6 anti-enum, R7 forms

**Fonte de verdade em caso de dúvida:** §15.5 R1–R12 prevalece sobre copy avulsa (desde que não contradiga D1–D12).

---

## 3. Fora de âmbito (não fazer nesta implementação)

- Passaporte / KAI / SCK na UI
- OAuth / MFA / telefone auth
- Dashboards / Shell completo
- UI gestão de papéis
- Contornar Gate ou implementar sem Fase 2

---

## 4. Checklist de arranque (copiar para o PR de implementação)

- [ ] Gate P1 ✅ com URL do run
- [ ] Gate P2 ✅ com project ref
- [ ] Autorização de Implementação do PO colada no PR / Gate
- [ ] Branch de implementação criada
- [ ] ADR-004 aberto em rascunho N2

---

**Autonomia:** este pack pode ser actualizado pelo Líder Técnico; **activar** o trabalho de código exige o evento PO da Fase 2.
