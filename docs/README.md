# Documentação Kuteka — Índice

**Manutenção:** Líder Técnico (autonomia) · Hierarquia de autoridade: `AI_CONTEXT.md` §6  
**Actualização:** 2026-07-30

## Como usar

1. Ler `AI_CONTEXT.md` antes de especificar ou implementar.
2. Seguir `engineering/DEVELOPMENT_PROCESS.md` (duas fases PRD + papel do Líder Técnico).
3. Para auth: spec oficial → Engineering Gate → só então implementação.

## Oficiais / activos

| Documento                                                                                                                | Função                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| [`AI_CONTEXT.md`](AI_CONTEXT.md)                                                                                         | Memória permanente da equipa                                |
| [`engineering/DEVELOPMENT_PROCESS.md`](engineering/DEVELOPMENT_PROCESS.md)                                               | Processo, autonomia, N1–N5, duas fases PRD                  |
| [`proposals/PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md`](proposals/PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md)                       | Identidade oficial                                          |
| [`proposals/PRD_001_AUTHENTICATION_SPEC.md`](proposals/PRD_001_AUTHENTICATION_SPEC.md)                                   | **PRD-001 v1.0** — referência oficial (Aprovação Funcional) |
| [`backlog/PRD_001_ENGINEERING_GATE.md`](backlog/PRD_001_ENGINEERING_GATE.md)                                             | Gate técnico pré-implementação (aberto até P1+P2)           |
| [`backlog/PHASE_GATE_BEFORE_PRD001.md`](backlog/PHASE_GATE_BEFORE_PRD001.md)                                             | Gate de fase pré-spec (histórico + ponteiros)               |
| [`architecture/ADR-001-foundation-architecture-decisions.md`](architecture/ADR-001-foundation-architecture-decisions.md) | Fundação                                                    |
| [`architecture/ADR-002-landing-page-implementation.md`](architecture/ADR-002-landing-page-implementation.md)             | Landing                                                     |
| [`architecture/ADR-003-p0-pre-auth-hardening.md`](architecture/ADR-003-p0-pre-auth-hardening.md)                         | P0 RBAC/audit                                               |
| [`database/PERMISSIONS_MATRIX.md`](database/PERMISSIONS_MATRIX.md)                                                       | Matriz de permissões                                        |
| [`security/AUDIT_LOGS_CHECKLIST.md`](security/AUDIT_LOGS_CHECKLIST.md)                                                   | Checklist P0 audit + RBAC                                   |
| [`engineering/github-workflows/README.md`](engineering/github-workflows/README.md)                                       | Activação CI (P1)                                           |
| [`engineering/CODE_REVIEW.md`](engineering/CODE_REVIEW.md)                                                               | Checklist de code review                                    |
| [`engineering/DEPLOY_STATUS_2026-07-30.md`](engineering/DEPLOY_STATUS_2026-07-30.md)                                     | Estado domínio / Pages (ops)                                |
| [`backlog/P0_ACTIVATION_RUNBOOK.md`](backlog/P0_ACTIVATION_RUNBOOK.md)                                                   | Atalho ops P1/P2 → Gate §8                                  |

## Encerrados / histórico (não substituem o PRD-001)

Landing, FASE 1, P0 reports e propostas UX antigas em `proposals/` e `backlog/` — úteis para rastreio; a autoridade de auth é só o PRD-001 v1.0.

Pastas vazias reservadas (`api/`, `business/`, `decisions/`, `glossary/`, `playbooks/`, `product/`, `prompts/`, `vision/`) **não** são fontes de verdade — ver `product/README.md`.

## Legado (não usar para produto KEOS)

`DEPLOY-RENDER.md`, `GOOGLE-LOGIN.md`, `ADMIN-E-LOGIN.md`, `SETUP-CONTAS.md`, `OGPT-MOBILE-FIRST.md` — contexto legado Vite; **proibido** reutilizar para auth KEOS.

## Estado actual (auth)

| Item                         | Estado                                  |
| ---------------------------- | --------------------------------------- |
| Aprovação Funcional PRD-001  | ✅                                      |
| Engineering Gate             | ▶️ Aberto (P1 CI · P2 migration `0002`) |
| Autorização de Implementação | ❌                                      |
| Código auth de produto       | ❌ Bloqueado                            |
