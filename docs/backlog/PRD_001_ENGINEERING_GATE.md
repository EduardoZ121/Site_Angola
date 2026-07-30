# PRD-001 — Engineering Gate

**Documento:** Avaliação técnica final de prontidão para implementação  
**Módulo:** Autenticação & Gestão de Utilizadores  
**PRD oficial:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` (**v1.0** — Aprovação Funcional 2026-07-30)  
**Gate de fase prévio:** `docs/backlog/PHASE_GATE_BEFORE_PRD001.md`  
**Metodologia:** `docs/engineering/DEVELOPMENT_PROCESS.md` (Fase 1 ≠ Fase 2)  
**Estado:** ▶️ Candidata à aprovação do Gate · **Autorização de Implementação ainda não emitida**  
**Maturidade deste documento:** **N3 — Candidato**

---

## 0. Objectivo

Confirmar, de forma objectiva, se o ambiente e os pré-requisitos técnicos permitem emitir a **Autorização de Implementação** do PRD-001.

Este documento **não** altera requisitos de negócio. Consolida o **Gate 16.1** e dependências de infraestrutura.

---

## 1. Meta da avaliação

### Documentos / evidências consultados

| Fonte                                               | Uso                                                      |
| --------------------------------------------------- | -------------------------------------------------------- |
| `PRD_001_AUTHENTICATION_SPEC.md` §16.1              | Critérios pré-código oficiais                            |
| `PHASE_GATE_BEFORE_PRD001.md`                       | Pendências infra históricas                              |
| `DEPLOY_STATUS_2026-07-30.md`                       | Domínio / Pages / Render                                 |
| `docs/engineering/github-workflows/ci.yml` + README | CI definido mas activação                                |
| `.github/workflows/` no repo                        | Só `deploy.yml` presente (sem `ci.yml` activo)           |
| `supabase/migrations/0001_*.sql`, `0002_*.sql`      | Migrations no repo                                       |
| `ADR-001`, `ADR-003`, P0 reports                    | Fundação + RBAC/audit                                    |
| `gh run list` (2026-07-30)                          | Deploy Kuteka / Pages verdes; sem workflow CI de quality |

### Verificações realizadas

1. Checklist §16.1 item a item.
2. Presença real de workflow CI no remote vs ficheiro-fonte em `docs/engineering/`.
3. Estado documental da migration `0002` (existe no repo; aplicação no **remoto** não verificável daqui sem credenciais Supabase).
4. Domínio `kutekalink.com` vs Landing em `gh-pages`.
5. Separação Aprovação Funcional (já concedida) vs Autorização de Implementação (pendente).

---

## 2. Itens concluídos

| ID  | Item                                                       | Evidência                                                  |
| --- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| C1  | Fundação KEOS (monorepo, packages, Landing) em `main`      | PHASE_GATE §1                                              |
| C2  | P0 técnico (RBAC + audit) aprovado e em `main`             | ADR-003, P0 reports                                        |
| C3  | Migration `0002` **escrita e versionada** no repo          | `supabase/migrations/0002_p0_rbac_and_audit_hardening.sql` |
| C4  | Spec PRD-001 **Aprovação Funcional** oficial               | PO 2026-07-30 · v1.0                                       |
| C5  | Critérios de aceitação, R1–R12, L\*, wireframes            | PRD §§15–18                                                |
| C6  | Publish path Landing → `gh-pages` operativo                | Deploy Kuteka verde                                        |
| C7  | Workflow de **deploy** Pages activo                        | `.github/workflows/deploy.yml`                             |
| C8  | Definição do workflow CI (lint/typecheck/test/build/smoke) | `docs/engineering/github-workflows/ci.yml`                 |
| C9  | Script de activação CI documentado                         | `scripts/enable-github-ci.sh` + README workflows           |

---

## 3. Itens pendentes (bloqueiam Autorização de Implementação)

| ID  | Item                                                                                              | Severidade                                                                  | Notas                                                                                             |
| --- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| P1  | Activar `.github/workflows/ci.yml` no remote e obter pipeline **verde**                           | **Bloqueante**                                                              | Requer token GitHub com scope `workflow`; agent Cloud sem esse scope não consegue activar sozinho |
| P2  | Aplicar migration `0002` no **Supabase remoto** (ambientes relevantes)                            | **Bloqueante**                                                              | Ficheiro existe; aplicação remota não confirmada neste ambiente                                   |
| P3  | Autorização explícita do PO para implementação (Fase 2)                                           | **Bloqueante**                                                              | Só após este Gate estar verde / aprovado                                                          |
| P4  | Templates de email Auth (verify / reset) com marca Kuteka + redirect URLs allowlisted no Supabase | **Bloqueante para go-live auth**; desejável antes de começar UI se possível | Ops Supabase (§16.1 / §5.3)                                                                       |
| P5  | `kutekalink.com` a servir Landing KEOS (DNS / Render)                                             | **Não bloqueante** para começar código auth em preview                      | Bloqueia experiência pública coerente; ver DEPLOY_STATUS                                          |

---

## 4. Riscos remanescentes

| Risco                              | Impacto                                   | Mitigação                              |
| ---------------------------------- | ----------------------------------------- | -------------------------------------- |
| Implementar sem CI                 | Regressões sem rede de segurança          | Fechar P1 antes de qualquer PR de auth |
| Implementar sem `0002` remoto      | RPCs RBAC/audit em falta → falhas runtime | Fechar P2; verificar com checklist P0  |
| Email Auth mal configurado         | Utilizadores presos em F2/F5              | P4 antes de testes e2e reais           |
| Domínio ainda no legado Vite       | Confusão de produto / QA em URL pública   | P5 em paralelo (ops)                   |
| Scope `workflow` indisponível      | CI permanece só em `docs/engineering/`    | Acção manual humana no GitHub          |
| Credenciais Supabase / GoDaddy 401 | Ops não automatizável daqui               | Acção manual no dashboard              |

---

## 5. Dependências externas

| Dependência                                            | Owner típico     | Estado                                 |
| ------------------------------------------------------ | ---------------- | -------------------------------------- |
| GitHub token com scope `workflow`                      | Ops / admin repo | ⏳ Necessário para P1                  |
| Projecto Supabase (remoto) + permissão para migrations | Ops / backend    | ⏳ Necessário para P2 / P4             |
| DNS GoDaddy ou reparação Render                        | Ops              | ⏳ P5 (não bloqueia código em preview) |
| Aprovação PO Fase 2                                    | Product Owner    | ⏳ Após Gate                           |

---

## 6. Mapa Gate 16.1 (PRD)

| Critério §16.1                                               | Estado                               |
| ------------------------------------------------------------ | ------------------------------------ |
| Spec integralmente aprovada (Blocos 1–4 + aprovação oficial) | ✅ **Aprovação Funcional** concedida |
| CI definitivamente activo e verde                            | ❌ Pendente (P1)                     |
| Migration `0002` aplicada no remoto                          | ❌ Não confirmado (P2)               |
| Autorização explícita de implementação                       | ❌ Pendente (P3)                     |
| Templates email + redirect allowlist Supabase                | ❌ Pendente (P4)                     |

**Conclusão parcial:** a metade **funcional** do gate está fechada; a metade **técnica/ops** está aberta.

---

## 7. Recomendação técnica final

| Pergunta                                    | Resposta                                                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| O PRD-001 está aprovado funcionalmente?     | **Sim** — referência oficial                                                                                                                                       |
| O Engineering Gate está pronto para fechar? | **Não** — P1 e P2 (e P3) em aberto                                                                                                                                 |
| Pode iniciar-se a implementação agora?      | **Não**                                                                                                                                                            |
| Recomendação                                | **Não aprovar** a Autorização de Implementação até P1 + P2 estarem verificados. Aprovar este documento como **diagnóstico oficial** do Gate e executar o plano §8. |

---

## 8. Plano para fechar o Gate (ordem sugerida)

1. **Humano / ops:** activar CI (`./scripts/enable-github-ci.sh` ou cópia manual de `docs/engineering/github-workflows/ci.yml` → `.github/workflows/ci.yml`) e confirmar run verde em `main`.
2. **Humano / ops:** aplicar `0002_p0_rbac_and_audit_hardening.sql` no Supabase remoto; registar evidência (data, project ref, checklist P0).
3. **Ops (paralelo):** configurar templates Auth + redirect URLs (P4).
4. **Ops (paralelo, não bloqueante de código):** DNS `kutekalink.com` → Pages (P5).
5. Actualizar este documento: marcar P1–P2 (e P4 se possível) como ✅.
6. PO emite **Autorização de Implementação** (Fase 2) → maturidade PRD **N4**.
7. Só então abrir branch de implementação (ex. `cursor/prd-001-authentication-f96b`).

---

## 9. Autoavaliação do Arquitecto — Engineering Gate PRD-001

| Campo                               | Conteúdo                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nível de maturidade**             | **N3 — Candidato** (diagnóstico completo; Gate ainda não verde)                                                                                                                                                                                                                                                                                             |
| **Nível de confiança**              | **88%**                                                                                                                                                                                                                                                                                                                                                     |
| **Factores < 95%**                  | (1) Aplicação remota de `0002` **não verificável** neste ambiente sem acesso Supabase. (2) CI ainda não existe em `.github/workflows/` no remote — só a definição em `docs/engineering/`. (3) Estado exacto dos templates Auth Supabase desconhecido daqui. (4) Domínio público ainda desalinhado (impacto ops, não da exactidão do diagnóstico de código). |
| **Principais riscos remanescentes** | Pressão para codificar antes de P1/P2; falha silenciosa de RPC; QA no domínio legado                                                                                                                                                                                                                                                                        |
| **Dívidas técnicas ou documentais** | Evidência escrita pós-aplicação `0002`; run CI verde linkado; Manual/Blueprint/DS Nº 003 ainda fora do repo (não bloqueia Gate técnico, bloqueia confiança visual)                                                                                                                                                                                          |
| **Decisões adiadas**                | Autorização de Implementação; ADR-004 + RPC na fase de código; P5 pode correr em paralelo                                                                                                                                                                                                                                                                   |
| **Recomendação**                    | **Aprovar** este Engineering Gate como **registo oficial de prontidão (diagnóstico)**. **Não aprovar** o fecho do Gate nem a Autorização de Implementação até P1 + P2 (mínimo) estarem ✅.                                                                                                                                                                  |

---

## 10. Estado resumido

| Dimensão                     | Estado                            |
| ---------------------------- | --------------------------------- |
| Aprovação Funcional PRD-001  | ✅ Oficial                        |
| Engineering Gate             | ▶️ Aberto (diagnóstico candidata) |
| Autorização de Implementação | ❌ Não emitida                    |
| Maturidade do módulo auth    | Pré-N4                            |

**Pedido ao PO:** validar este diagnóstico; autorizar a equipa ops a fechar P1–P2; **não** autorizar implementação até nova versão deste documento com Gate verde.
