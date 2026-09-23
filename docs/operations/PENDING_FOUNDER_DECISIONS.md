# Pending Founder decisions — configurable defaults

**Status:** living checklist after ecosystem execution (migrations 0043–0048).  
**Scope:** items that stay Founder-gated or intentionally deferred. Do **not** treat this as a product backlog for agents to auto-activate.

---

## Locked / Founder-only (do not open in client UI)

| Default                      | Current behaviour                                              | Notes                                                                    |
| ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Commission rates**         | `platform_commission_params` — Founder/Owner only (`0036`)     | Keep Founder-only. No self-serve partner overrides.                      |
| **Kuteka Pay / custody**     | Sandbox / engine present; **real Pay + custody not activated** | Do not enable live money movement without Founder + legal + ops go-live. |
| **Growth Engine as product** | Not activated                                                  | Keep dormant; no public module flag flip.                                |
| **Delegation Engine (full)** | Not activated                                                  | Partial ops roles exist; full delegation / succession stays off.         |
| **Succession / Board**       | Not activated                                                  | Out of Beta execution scope.                                             |
| **AGT scraping**             | Forbidden                                                      | Never implement automated AGT harvesting.                                |

---

## Configurable later (safe to decide without re-architecting)

| Topic                              | Suggested default until Founder decides                                                                       | Where it lives                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Beta feedback kinds                | `feedback` \| `bug` \| `avaliacao` \| `reclamacao` enabled in schema; Help form still emphasises feedback/bug | `0046`, Help / Beta form           |
| Feedback ack to author (BETA-23)   | Off — ops status only                                                                                         | Future: notify_user on `resolvido` |
| Availability notify copy / channel | In-app `user_notifications` only                                                                              | `0047`                             |
| Agent lead auto-assign             | Manual claim via `assign_property_interest`                                                                   | `0048` + Agente hub                |
| Prestadores ads                    | Future — marketplace ads not in Beta                                                                          | Monetization flags                 |
| Pay sandbox visibility             | Sandbox OK for Super Admin; hide from clients                                                                 | Finance KOCC                       |
| Property completeness weights      | Equal weight (6 checklist items)                                                                              | `propertyCompleteness` TS helper   |

---

## Already executed under Founder authorization (this branch)

- Proposals **0043–0045** applied as migrations (Founder read, path guard, RPC-only insert).
- Feedback status workflow **0046** (`received` → … → `resolvido` / `duplicado` / `nao_reproduzivel`) + `page_context` (no screenshots).
- Matching notify on publish/active **0047**.
- Agent lead ownership RPC **0048**.

---

## Explicit non-goals (still pending / refused)

1. Screenshot upload for beta feedback (storage not ready).
2. Real Kuteka Pay settlement / custody wallets for end users.
3. Growth Engine product surface.
4. Full Delegation Engine + Board succession flows.
5. AGT or any government-site scraping.
