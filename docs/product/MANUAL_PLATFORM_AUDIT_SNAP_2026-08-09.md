# Kuteka — Prefácio de auditoria dos manuais (snap 2026-08-09)

**Documento:** `docs/product/MANUAL_PLATFORM_AUDIT_SNAP_2026-08-09.md`  
**Data:** 2026-08-09  
**Âmbito:** Fonte de verdade para os manuais v2 (`MANUAL_UTILIZADOR_COMPLETO_v2`, `MANUAL_OPERACIONAL_ADMINISTRATIVO_v2`, `MATRIZ_PAPEIS_PERMISSOES_GOVERNANCA_v2`).

---

## Princípio

Os manuais oficiais **seguem o código e a validação pós-deploy**, não a aspiração de produto.  
Se um ecrã, papel, decisão ou etapa de ciclo **não existir** em `apps/web`, migrações Supabase ou validação medida, o manual marca 🔴 / ⚪ / 🟡 — **nunca inventa**.

---

## Fontes auditadas (código)

| Área                       | Ficheiros / artefactos                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| Experiências (UI lens)     | `apps/web/modules/shell/role-experience.ts` (`ExperienceMode`, `MODE_LENS`, homes, path rules)        |
| Missões / cockpit          | `apps/web/modules/shell/role-operating-matrix.ts`                                                     |
| Menus                      | `apps/web/modules/shell/nav.ts` (`SHELL_NAV_ITEMS`)                                                   |
| Fila de publicação         | `apps/web/modules/administracao/services/publication-review-client.ts` + `PublicationReviewQueue`     |
| Decisões + Supervisor gate | SQL `0036`, `0039` (`admin_decide_property_publication`)                                              |
| Motivos de pendência       | `publication_pending_reasons` (seed em `0036`)                                                        |
| Lifecycle                  | SQL `0038` + trigger `sync_property_lifecycle_from_review`; post-deploy: approve → `janela_premium`   |
| Escalações                 | `EscalationPanel` + RPCs create/list/resolve; audit `escalation.create` / `acknowledged` / `resolved` |
| Founder Center             | `FounderCenterClient`, `FounderOnboardingClient`, `claimBootstrap` → `founder_bootstrap_claim`        |
| Promoção institucional     | `founder_promote_user` (0038)                                                                         |
| Comissão 35%               | `platform_commission_params` + `founder_set_commission_param` — **sem UI**                            |
| Social                     | RPCs like/favorite/comment/ask/share/report na ficha                                                  |
| Agente                     | `/app/agente` `AgentHubClient` (hub com secções; partes demo/parcial)                                 |
| Prestador                  | `/app/servicos` modo provider (`MarketplaceClient`) 🟡                                                |
| Validação produção         | `docs/product/ROLE_OPERATING_VALIDATION_POST_DEPLOY.md` (2026-08-09)                                  |
| Sprint / ciclo canónico    | `docs/product/SPRINT_BETA_1_6.md`                                                                     |

---

## Factos pós-deploy (resumo)

- Migrations `0029`→`0040` aplicadas; produção serve Founder Center em `/app/fundador`.
- Admin `approve` → `lifecycle_status = janela_premium` (janela ~6h via `premium_visible_at` / `general_visible_at`).
- Supervisor **não** aprova/rejeita (`administrator required for approve/reject`).
- Escalações Supervisor→Admin→Super→Founder 🟢.
- Social na ficha 🟢; chat listagem OK, `start_direct` frequentemente exige contract/role pairing 🟡.
- Bootstrap Founder **aberto** em produção no snap; demos **não** podem claim; Owner real ainda por claimar (Founder Center profundo 🔵/🟡).
- Board / Investor / Auditor: **sem** `ExperienceMode` UI; auditor só perms DB; ⚪/🔴 no cockpit.
- KAI: camada transversal (score preliminar na fila), **não** é papel humano.
- Comissão plataforma: RPC/DB Founder-only; **sem** ecrã de comissão no frontend.

---

## Documentos derivados

1. `docs/help/MANUAL_UTILIZADOR_COMPLETO_v2.md` — Cliente, PP, Agente, Prestador
2. `docs/help/MANUAL_OPERACIONAL_ADMINISTRATIVO_v2.md` — Supervisor, Admin, Super, Founder/Co-Founder
3. `docs/help/MATRIZ_PAPEIS_PERMISSOES_GOVERNANCA_v2.md` — matrizes Papel×Acção e governação

Qualquer divergência futura código↔manual resolve-se **a favor do código** e de um novo snap de auditoria.
