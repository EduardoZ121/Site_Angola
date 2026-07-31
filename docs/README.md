# Documentação Kuteka — Índice

**Manutenção:** Líder Técnico (autonomia) · Hierarquia de autoridade: `AI_CONTEXT.md` §6  
**Actualização:** 2026-07-31

## Como usar

1. Ler `AI_CONTEXT.md` antes de especificar ou implementar.
2. Seguir `engineering/DEVELOPMENT_PROCESS.md` (duas fases PRD + papel do Líder Técnico).
3. Auth (PRD-001) está **encerrado (N5)** — ver `backlog/PRD_001_CLOSURE.md`. Próximo: Shell da plataforma.

## Oficiais / activos

| Documento                                                                                                                | Função                                               |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| [`AI_CONTEXT.md`](AI_CONTEXT.md)                                                                                         | Memória permanente da equipa                         |
| [`engineering/DEVELOPMENT_PROCESS.md`](engineering/DEVELOPMENT_PROCESS.md)                                               | Processo, autonomia, N1–N5, duas fases PRD           |
| [`proposals/PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md`](proposals/PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md)                       | Identidade oficial                                   |
| [`proposals/PRD_001_AUTHENTICATION_SPEC.md`](proposals/PRD_001_AUTHENTICATION_SPEC.md)                                   | **PRD-001 v1.0** — referência oficial do módulo auth |
| [`backlog/PRD_001_CLOSURE.md`](backlog/PRD_001_CLOSURE.md)                                                               | **Encerramento N5** do PRD-001 (2026-07-31)          |
| [`backlog/CONTINUIDADE_DESENVOLVIMENTO.md`](backlog/CONTINUIDADE_DESENVOLVIMENTO.md)                                     | Mapa: onde paramos, manuais, próximos passos, deploy |
| [`backlog/EXTERNAL_BLOCKERS.md`](backlog/EXTERNAL_BLOCKERS.md)                                                           | Bloqueios só de credenciais/infra                    |
| [`backlog/GO_LIVE_CHECKLIST.md`](backlog/GO_LIVE_CHECKLIST.md)                                                           | Checklist go-live — execução, não metodologia        |
| [`backlog/PRD_001_ENGINEERING_GATE.md`](backlog/PRD_001_ENGINEERING_GATE.md)                                             | Gate técnico pré-implementação (histórico)           |
| [`backlog/PRD_001_IMPLEMENTATION_READINESS.md`](backlog/PRD_001_IMPLEMENTATION_READINESS.md)                             | Pack de implementação (histórico — módulo concluído) |
| [`backlog/PRD_001_CONTENT_INVENTORY.md`](backlog/PRD_001_CONTENT_INVENTORY.md)                                           | Inventário de copy i18n-ready                        |
| [`architecture/ADR-001-foundation-architecture-decisions.md`](architecture/ADR-001-foundation-architecture-decisions.md) | Fundação                                             |
| [`architecture/README.md`](architecture/README.md)                                                                       | Índice de ADRs                                       |
| [`architecture/ADR-002-landing-page-implementation.md`](architecture/ADR-002-landing-page-implementation.md)             | Landing                                              |
| [`architecture/ADR-003-p0-pre-auth-hardening.md`](architecture/ADR-003-p0-pre-auth-hardening.md)                         | P0 RBAC/audit                                        |
| [`architecture/ADR-004-authentication-module-deferred.md`](architecture/ADR-004-authentication-module-deferred.md)       | Auth module (PRD-001) — aceite / N5                  |
| [`database/PERMISSIONS_MATRIX.md`](database/PERMISSIONS_MATRIX.md)                                                       | Matriz de permissões                                 |
| [`security/AUDIT_LOGS_CHECKLIST.md`](security/AUDIT_LOGS_CHECKLIST.md)                                                   | Checklist P0 audit + RBAC                            |
| [`engineering/github-workflows/README.md`](engineering/github-workflows/README.md)                                       | Activação CI                                         |
| [`engineering/CODE_REVIEW.md`](engineering/CODE_REVIEW.md)                                                               | Checklist de code review                             |
| [`engineering/DEPLOY_STATUS_2026-07-30.md`](engineering/DEPLOY_STATUS_2026-07-30.md)                                     | Estado domínio / Pages (ops)                         |

## Encerrados / histórico

Landing, FASE 1, P0, Engineering Gate PRD-001 e propostas UX antigas — úteis para rastreio. Auth de produto: PRD-001 v1.0 + `PRD_001_CLOSURE.md`.

## Legado (não usar para produto KEOS)

`DEPLOY-RENDER.md`, `GOOGLE-LOGIN.md`, `ADMIN-E-LOGIN.md`, `SETUP-CONTAS.md`, `OGPT-MOBILE-FIRST.md` — contexto legado Vite; **proibido** reutilizar para auth KEOS.

## Estado actual

| Item                        | Estado                                    |
| --------------------------- | ----------------------------------------- |
| Aprovação Funcional PRD-001 | ✅                                        |
| Engineering Gate / P1+P2    | ✅ Cumpridos (histórico no Gate)          |
| Implementação PRD-001       | ✅ **N5 concluído** (2026-07-31)          |
| Produção auth               | ✅ https://kutekalink.com/auth/* · `/app` |
| Próximo módulo              | Shell da plataforma → depois PRD-002      |
