# GOV — Requisitos para ciclo de estados / responsável / resolução (Beta feedback)

**Estado:** **autorizado e implementado** (migrations 0043–0046 + UI Admin/KOCC).  
**Objectivo:** ciclo Doc3 em `beta_feedback` sem segundo sistema de tickets; screenshots ficam fora (usar `page_context`).

Fonte documental: Doc 3 tabela BETA (`docs/master-dossier/consolidation/KUTEKA_DOC3_VALIDATION_TABLE_2026-08-28.md`).  
Fonte schema: `supabase/migrations/0035_kocc_beta_panel.sql` (+ métricas em `0042_beta_sandbox_visibility_guards.sql`).  
Padrões adjacentes existentes (referência de reutilização, **não** adopção automática): `operational_escalations` (`0040_ops_matrix_experiences.sql`), `platform_feature_flag_audit` (`0032_kocc_operating_control.sql`).

---

## 1. O que o Doc 3 pede (requisitos declarados)

| ID      | Requisito                                   | Prioridade Doc3 | Estado actual no código/schema                                                                   |
| ------- | ------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| BETA-13 | Feedback não escondido                      | P0              | ✅ `/app/ajuda` + CTAs Sprint A                                                                  |
| BETA-14 | Widget contextual in-page                   | P0 / Spec C     | 🔴 fora do P0 — não construir agora                                                              |
| BETA-15 | Tipos: BUG/UX/Sugestão/Reclamação/Avaliação | P1              | 🟡 schema `feedback` \| `bug` \| `avaliacao` \| `reclamacao`; formulário Ajuda só os 2 primeiros |
| BETA-16 | Contexto rico (device/version/…)            | P1              | ✅ `page_context` (idioma, ecrã, caminho) gravado e visível na inbox; sem screenshots            |
| BETA-19 | Dashboard triagem KOCC                      | P1              | ✅ métricas + inbox KOCC/Admin com estados                                                       |
| BETA-21 | KAI não decide                              | P0              | ✅ N/A no canal actual                                                                           |
| BETA-22 | Ciclo estados NOVO→FECHADO                  | P1              | ✅ `0046` received → … → resolvido / duplicado / nao_reproduzivel                                |
| BETA-23 | Ack + resolução ao user                     | P2              | 🔴 **desligado de propósito** (Founder: só nota interna)                                         |
| BETA-24 | Reclamação ≠ feedback produto               | P1              | 🟡 kind `reclamacao` no schema; Ajuda continua a enfatizar feedback/bug                          |
| BETA-30 | Privacidade / isolamento                    | P1              | 🟡 RLS ops-only SELECT; user não lê o próprio SELECT directo                                     |

**Conclusão documental:** estados, responsável, resolução e notificação ao autor são **P1/P2 no Doc 3**, não bloqueiam o fecho técnico do canal P0 (captura + inbox + métricas). BETA-40 (loop aprendizagem fechado) depende explicitamente de 14–23 — é critério de **ciclo produto**, não de publish A/B.

---

## 2. O que o schema `beta_feedback` já define

Colunas: `id`, `kind`, `body`, `page_path`, `actor_id`, `metadata`, `created_at`.

Permissões:

| Operação            | Regra actual                          |
| ------------------- | ------------------------------------- |
| INSERT              | próprio `actor_id` ou RPC definer     |
| SELECT              | `finance.manage` **ou** `admin.panel` |
| UPDATE / DELETE     | **revogados** a `authenticated`       |
| `kocc_beta_metrics` | só `finance.manage`                   |

**Implicação técnica:** qualquer “estado / assignee / resolved_at” **exige** alteração de superfície (colunas e/ou RPC security definer + política). Não é bugfix.

---

## 3. Padrões já existentes que _poderiam_ ser reutilizados (se GOV autorizar)

Não são propostas activas — só inventário de compatibilidade arquitectónica:

1. **`operational_escalations` (0040)** — já tem `status` (`open|acknowledged|resolved|cancelled`), `assignee_id`, `resolved_by`, `resolved_at`, `resolution_notes`, RLS select, mutação via RPC (INSERT/UPDATE direct revogados a `authenticated`). É o paralelo mais próximo de “fila ops com dono e fecho”.
2. **`platform_feature_flag_audit` (0032)** — trilha before/after para flags KOCC; **não** cobre `beta_feedback`.
3. **`user_has_founder_or_permission`** — padrão pós-0036. Founder lê `beta_feedback` via **0043** (aplicada).

**Regra:** reutilizar um destes padrões **só após** decisão; não copiar escalations para feedback “por ocupação”.

---

## 4. Decisões já tomadas (0043–0046, aplicadas 2026-09-23)

1. Estados **só internos** (ops). O autor **não** é notificado (BETA-23 continua off).
2. Modelo = colunas em `beta_feedback`, não `operational_escalations`.
3. Máquina: `received` → `em_analise` → `classificado` → `em_desenvolvimento` → `resolvido` | `duplicado` | `nao_reproduzivel`. Reabrir só para `em_analise` ou `received`.
4. Sem `assignee_id` nesta Beta.
5. Mutação só via RPC `kocc_update_beta_feedback_status` + `audit_logs`.
6. Nota interna opcional (`resolution_notes`). Não é mensagem ao autor.
7. `page_context` visível na inbox KOCC e Admin. Screenshots continuam proibidos.

## 5. Ainda aberto (não implementar sem o Founder)

| ID        | Pergunta                                                           | Estado                    |
| --------- | ------------------------------------------------------------------ | ------------------------- |
| GOV-BF-01 | Founder read                                                       | Fechado — `0043` aplicada |
| GOV-BF-02 | Ciclo de estados em `beta_feedback`                                | Fechado — `0046` aplicada |
| GOV-BF-03 | Formulário Ajuda: manter 2 kinds ou expor `avaliacao`/`reclamacao` | Aberto — schema já tem 4  |
| GOV-BF-04 | BETA-23 ack ao autor                                               | Aberto — **off**          |
| GOV-BF-05 | Path guard                                                         | Fechado — `0044` aplicada |
| GOV-BF-06 | Widget in-page (BETA-14) e screenshots                             | Aberto — não construir    |
