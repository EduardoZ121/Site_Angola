# PRD-001 — Engineering Gate

**Documento:** Avaliação técnica final de prontidão para implementação  
**Módulo:** Autenticação & Gestão de Utilizadores  
**PRD oficial:** `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` (**v1.0** — Aprovação Funcional 2026-07-30)  
**Gate de fase prévio:** `docs/backlog/PHASE_GATE_BEFORE_PRD001.md`  
**Metodologia:** `docs/engineering/DEVELOPMENT_PROCESS.md` (Fase 1 ≠ Fase 2)  
**Estado:** Diagnóstico ✅ **aprovado pelo PO** (2026-07-30) · Gate **permanece ABERTO** até P1+P2 · Autorização de Implementação ❌  
**Maturidade deste documento:** Diagnóstico N3 aprovado · Gate operacional **não verde**

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

> **Regra:** não contornar P1/P2; não alterar o estado do Gate para “verde” sem verificação objectiva.

### 8.1 P1 — Activar CI (bloqueante)

**Evidência actual (2026-07-30):** `.github/workflows/` no repo contém apenas `deploy.yml`. O token GitHub disponível ao agente tem scope `repo` **sem** `workflow` — push de workflows falharia ou seria rejeitado. Activação = acção **humana** com token adequado.

Passos:

1. Com token que inclua scope **`workflow`** (PAT clássico ou fine-grained com Workflows):
   ```bash
   ./scripts/enable-github-ci.sh
   git add .github/workflows/ci.yml
   git commit -m "ci: enable KEOS quality workflow"
   git push origin HEAD
   ```
   Alternativa: copiar manualmente `docs/engineering/github-workflows/ci.yml` → `.github/workflows/ci.yml` via UI GitHub.
2. Confirmar Actions → workflow **CI** verde em `main` (e idealmente neste branch).
3. Registar neste documento → marcar P1 ✅:

| Campo      | Valor      |
| ---------- | ---------- |
| Run URL    | _pendente_ |
| Commit SHA | _pendente_ |
| Data       | _pendente_ |

Última re-verificação objectiva P1 (Líder Técnico): **2026-07-30** — `.github/workflows/ci.yml` ausente; Actions API: apenas Deploy Kuteka + pages-build-deployment. P1 permanece ❌.

### 8.2 P2 — Migration `0002` no Supabase remoto (bloqueante)

1. Abrir o projecto Supabase de destino (staging/prod conforme política).
2. Aplicar `supabase/migrations/0002_p0_rbac_and_audit_hardening.sql` (SQL Editor ou CLI `supabase db push`).
3. Validar `docs/security/AUDIT_LOGS_CHECKLIST.md` (RBAC + audit). Auxílio: `scripts/verify-p0-migration.sql`.
4. Registar neste documento → marcar P2 ✅:

| Campo        | Valor      |
| ------------ | ---------- |
| Project ref  | _pendente_ |
| Data         | _pendente_ |
| Aplicado por | _pendente_ |
| Checklist    | _pendente_ |

Última re-verificação objectiva P2 (Líder Técnico): **2026-07-30** — sem credenciais Supabase neste ambiente; aplicação remota **não comprovável**. P2 permanece ❌.

### 8.3 Paralelo (não fecha o Gate sozinho)

3. **P4:** templates Auth (verify/reset) + redirect URLs allowlisted.
4. **P5:** DNS `kutekalink.com` → GitHub Pages (não bloqueia começar código _após_ Fase 2, bloqueia QA na URL pública).

### 8.4 Após P1+P2 ✅

5. Actualizar este documento (P1/P2 verdes + evidências).
6. PO emite **Autorização de Implementação** (Fase 2) → maturidade **N4**.
7. Abrir branch de implementação (ex. `cursor/prd-001-authentication-f96b`).

---

## 9. Autoavaliação do Arquitecto — Engineering Gate PRD-001

| Campo                               | Conteúdo                                                                                                                                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nível de maturidade**             | Diagnóstico **aprovado** · Gate operacional **aberto** (não N4)                                                                                                                                              |
| **Nível de confiança**              | **90%** (diagnóstico); prontidão para implementar **~40%** até P1+P2                                                                                                                                         |
| **Factores < 95% (diagnóstico)**    | (1) `0002` remoto não verificável daqui. (2) CI inactivo — confirmado: sem `ci.yml` em `.github/workflows/` e token sem scope `workflow`. (3) Templates Auth desconhecidos. (4) Domínio público desalinhado. |
| **Principais riscos remanescentes** | Contornar P1/P2; implementar sem rede CI; RPC em falta no remoto                                                                                                                                             |
| **Dívidas técnicas ou documentais** | Evidências P1/P2; Manual/Blueprint/DS fora do repo                                                                                                                                                           |
| **Decisões adiadas**                | Autorização de Implementação; ADR-004 na fase de código                                                                                                                                                      |
| **Recomendação**                    | Diagnóstico **aprovado** (cumprido). Manter Gate **aberto**. Executar §8.1–§8.2. **Não** autorizar implementação.                                                                                            |

---

## 10. Estado resumido

| Dimensão                         | Estado                                                          |
| -------------------------------- | --------------------------------------------------------------- |
| Aprovação Funcional PRD-001      | ✅ Oficial                                                      |
| Diagnóstico Engineering Gate     | ✅ **Aprovado pelo PO** (2026-07-30)                            |
| Engineering Gate (fecho / verde) | ▶️ **Aberto** — aguarda P1 + P2                                 |
| Autorização de Implementação     | ❌ Não emitida                                                  |
| Maturidade do módulo auth        | Pré-N4                                                          |
| Papel técnico                    | Arquitecto Principal + Líder Técnico (`DEVELOPMENT_PROCESS.md`) |

**Próximo passo lógico (condução técnica):** fecho operacional de **P1** e **P2** por quem tenha credenciais (`workflow` + Supabase). O Líder Técnico reavaliará o Gate assim que existirem evidências — sem marcar verde por antecipação.

Até P1+P2 verificados + Fase 2: **nenhuma implementação**.
