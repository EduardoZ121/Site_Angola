# KUT-GOV-002 — Decisões formais do Founder (D1, D3, D4, D5, D7)

| Campo | Valor |
|-------|-------|
| **Registo** | Decision Register KUT-GOV-002 |
| **DEC-IDs** | DEC-2026-004 · 005 · 006 · 007 · 008 |
| **Decisor** | Founder — Makiese Vicente |
| **Data** | 2026-09-04 |
| **Âmbito** | Registo documental Fase 0 |
| **Não autoriza** | Código, migrations, schema, RBAC/RLS, deploy, Pay, Growth funcional, email change, Fase 1 |

Estas cinco decisões **deixam de estar pendentes**. D-LEG, D-LEG-RENT, D-FIN e D-FIN-RENT **permanecem pendentes**.

---

## DEC-2026-004 · D1 — Fonte única da comissão de activação 35%

| Campo | Conteúdo |
|-------|----------|
| **ID** | D1 · DEC-2026-004 |
| **Questão original** | Qual via é fonte única de verdade para a comissão de activação 35%? |
| **Opções** | (A) `platform_commission_params` Founder-only · (B) `finance_commission_rules` Super UI · (C) Híbrido A+B · (D) Manter dual até data X |
| **Decisão** | **A** — fonte única = `platform_commission_params`, controlo Founder-only |
| **Estado** | **DECIDIDO — A** |
| **Responsável / decisor** | Founder |
| **Data** | 2026-09-04 |
| **Documentos afectados** | C2, FIN-005, POL-005, Master Table FIN-005, KUT-GOV-002 |
| **Justificação / consequências** | Evitar múltiplas fontes e impedir alteração pela Super UI sem autorização do Founder. A via B continua documentada como via operacional distinta; **não** é fonte da comissão de activação 35%. |
| **Dependências / bloqueios** | Unificação de código, SQL, RPC ou UI **não** está autorizada. Requer `AUTORIZO` de fase futura. Taxa 35% de negócio **não** muda. Tratamento fiscal = D-FIN (pendente). |

---

## DEC-2026-005 · D3 — Política DEMO vs público Beta

| Campo | Conteúdo |
|-------|----------|
| **ID** | D3 · DEC-2026-005 |
| **Questão original** | Como rotular/confinar contas e dados DEMO para não confundir utilizadores Beta? |
| **Opções** | Demo interno only · Badge “Exemplo/Ilustrativo” público · Bloqueio total demo em prod Beta |
| **Decisão** | **DEMO INTERNAL ONLY** |
| **Estado** | **DECIDIDO — DEMO INTERNAL ONLY** |
| **Responsável / decisor** | Founder |
| **Data** | 2026-09-04 |
| **Documentos afectados** | Beta Charter v2 §3, Doc3 BETA-04, QA Playbook T4, KUT-GOV-002 |
| **Justificação / consequências** | Dados, contas e cenários DEMO permanecem exclusivamente internos. Não misturar DEMO com utilizadores ou métricas do Beta público. |
| **Dependências / bloqueios** | Não autoriza código, flags ou alterações de produção. Charter v2 §3 ainda menciona “Exemplo/Ilustrativo” público como hipótese — **contradição documental** registada; não resolvida aqui. |

---

## DEC-2026-006 · D4 — Nível Growth Engine na Beta

| Campo | Conteúdo |
|-------|----------|
| **ID** | D4 · DEC-2026-006 |
| **Questão original** | Até que nível N0–N5 activar Growth funcional durante a Beta pública? |
| **Opções** | N0 nada · N1 instrumentação · N2 partilha · N3+ referral/campanhas |
| **Decisão** | **N1 — INSTRUMENTAÇÃO** (teto da Beta pública) |
| **Estado** | **DECIDIDO — N1** |
| **Responsável / decisor** | Founder |
| **Data** | 2026-09-04 |
| **Documentos afectados** | Growth Paper §2/§11, Doc3 GROWTH-22, Beta Charter, KUT-GOV-002 |
| **Justificação / consequências** | Na Beta pública só instrumentação/medição para aprendizagem e análise. Referral, campanhas, recompensas e N2+ **não** autorizados por esta decisão. |
| **Dependências / bloqueios** | **Não** activa Growth Engine funcional nem autoriza código N1. Implementação continua bloqueada até `AUTORIZO: FASE 1` (ou autorização dedicada). N3+ exigiria também parecer jurídico (GROWTH-13). |

---

## DEC-2026-007 · D5 — Alteração de email Founder/Co-Founder

| Campo | Conteúdo |
|-------|----------|
| **ID** | D5 · DEC-2026-007 |
| **Questão original** | Activar agora o fluxo completo de alteração de email via Security Center? |
| **Opções** | (A) Manter preparado, não activar · (B) Activar com testes §29.12 |
| **Decisão** | **A — MANTER PREPARADO, NÃO ACTIVAR** |
| **Estado** | **DECIDIDO — A / NÃO ACTIVAR** |
| **Responsável / decisor** | Founder |
| **Data** | 2026-09-04 |
| **Documentos afectados** | ADR-027 §4–5, Doc3 DOC3-29.14/29.7, KUT-GOV-002 |
| **Justificação / consequências** | Fluxo permanece preparado só na documentação. Activação fica para fase dedicada de identidade + suite de testes ADR-027. |
| **Dependências / bloqueios** | Não alterar RBAC/RLS, Security Center, Auth nem Founder Center. Sem `AUTORIZO` dedicado + testes §29.12, o fluxo **não** se activa. |

---

## DEC-2026-008 · D7 — Papel do contabilista na plataforma

| Campo | Conteúdo |
|-------|----------|
| **ID** | D7 · DEC-2026-008 |
| **Questão original** | Contabilista externo tem login RBAC dedicado ou apenas canal documental/off-platform? |
| **Opções** | (A) Papel read-only futuro · (B) Sem login — entrega mensal offline · (C) Portal export Founder-only |
| **Decisão** | **B — SEM LOGIN** |
| **Estado** | **DECIDIDO — B / SEM LOGIN** |
| **Responsável / decisor** | Founder |
| **Data** | 2026-09-04 |
| **Documentos afectados** | FIN pack §RACI, FIN-003, FIN-008, GOV-003, KUT-GOV-002 |
| **Justificação / consequências** | Relação com contabilista externo via canal documental/off-platform. Sem login RBAC nesta fase. |
| **Dependências / bloqueios** | Não criar role, RLS nem acesso de plataforma. D-FIN e D-FIN-RENT **continuam pendentes** (parecer contabilístico). Esta decisão **não** resolve tratamento fiscal. |
