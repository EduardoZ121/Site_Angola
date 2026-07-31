# Fase 3 — Shell da Plataforma (preparação)

**Estado:** ▶️ **Preparação iniciada** (N1 → N2)  
**Data:** 2026-07-31  
**Baseline congelada:** `docs/PROJECT_BASELINE_PRD001.md`  
**Depende de:** PRD-001 N5 ✅  
**Seguinte após Shell:** PRD-002 — Parceiro Patrimonial

> Não regressar ao polish do stub PRD-001. O Shell **substitui/evolui** o chrome de `/app` de forma controlada.

---

## 1. Objectivo da fase

Entregar o **chrome autenticado estável** da plataforma Kuteka:

- Identidade visual consistente (BrandMark + tipografia/cores oficiais)
- Navegação de produto (estrutura pronta para módulos futuros)
- Contexto de utilizador (nome, email, papéis activos, logout)
- Área principal (`main`) onde os PRDs de negócio serão montados
- Manter stub de conteúdo até PRD-002+ — **sem** inventar dashboards de negócio

Alinhamento: `docs/AI_CONTEXT.md` §9 (App shell: Sidebar + Topbar + Main + Widgets) e §12 fase 3.

---

## 2. Fora de âmbito (explícito)

- Activar Património / listagens / Passaporte / KAI / SCK
- Alterar fluxos F1–F6 excepto se um bug crítico o exigir
- OAuth / MFA
- Redesign cosmético isolado do stub sem Shell

---

## 3. Hipóteses de trabalho (a validar na spec)

| Tema              | Hipótese inicial                                                |
| ----------------- | --------------------------------------------------------------- |
| Layout            | Topbar obrigatória; sidebar desktop + navegação compacta mobile |
| Destino pós-login | Continua `/app` (home autenticada dentro do Shell)              |
| Itens de nav      | Placeholders desactivados ou “Em breve” até PRD do módulo       |
| Admin             | `/app/admin` permanece gated por `admin.panel`                  |
| Sessão            | Reutilizar `kuteka-auth` + `AppSession` / gate existente        |
| Static export     | Shell deve continuar compatível com publish estático            |

Decisões de negócio (quais itens de menu oficiais, copy, permissões por item) → **Aprovação Funcional** da spec Fase 3.

---

## 4. Entregáveis de preparação (esta ronda)

1. ✅ Baseline PRD-001 congelada (`PROJECT_BASELINE_PRD001.md`)
2. ▶️ Este documento de preparação
3. ⏳ Spec candidata Fase 3 (N3) — estrutura, navegação, critérios de aceitação
4. ⏳ Engineering Gate leve (reutilizar CI + Supabase já verdes; focar riscos de static export / a11y / RBAC na nav)
5. ⏳ Autorização de Implementação (PO) antes de código do Shell

---

## 5. Critérios de sucesso (fase completa — rascunho)

- Utilizador autenticado vê Shell consistente em `/app` e rotas filhas
- Brand + utilizador + papéis + logout sempre acessíveis
- Nav não promete módulos inexistentes como activos
- Zero regressão nos fluxos PRD-001
- CI + Deploy Kuteka verdes
- Quatro níveis de encerramento aplicáveis à Fase 3

---

## 6. Próxima acção do Líder Técnico

1. Redigir **spec funcional Fase 3** (wireframes textuais + IA/nav + critérios) até N3
2. Apresentar ao PO para Aprovação Funcional
3. Só então Engineering Gate / Autorização de Implementação / código

**Não** começar implementação de Shell sem Aprovação Funcional + autorização de implementação.

---

## Autoavaliação do Arquitecto

| Campo          | Conteúdo                                                               |
| -------------- | ---------------------------------------------------------------------- |
| Maturidade     | **N2** (preparação; spec ainda não candidata)                          |
| Confiança      | 90%                                                                    |
| Factores < 95% | Itens exactos do menu e densidade do shell ainda não aprovados pelo PO |
| Riscos         | Over-building do shell antes de PRD-002; conflito com static export    |
| Dívida         | Spec Fase 3 por redigir                                                |
| Adiado         | Widgets KAI, dashboards, deep-links por papel                          |
| Recomendação   | **Seguir** com spec Fase 3; baseline PRD-001 permanece congelada       |
