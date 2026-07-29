# Backlog P0 — Pré-requisitos do PRD-001 (Authentication)

**Estado:** Aberto · Obrigatório · **Próximo trabalho técnico antes do PRD-001**  
**Origem:** FASE 1 Technical Review + encerramento FASE 1 + encerramento Landing (2026-07-29)  
**Regra:** Nenhum fluxo autenticado de negócio pode ser desenvolvido antes destes três itens estarem **concluídos e validados**.  
**Contexto:** Fundação (FASE 1 + Landing) está construída e validada. Foco seguinte = resolver este backlog, depois PRD-001.

---

## P0-1 — Fonte única de verdade do RBAC

**Problema:** Matriz de permissões duplicada entre seed SQL e `ROLE_PERMISSIONS` em `@kuteka/auth`.

**Objectivo:** Uma única fonte oficial para papéis e permissões (preferência: PostgreSQL / Supabase), com o código a consumir ou gerar a partir dessa fonte — sem espelho manual que possa divergir.

**Critérios de conclusão:**

- [ ] Não existe matriz de autorização mantida à mão em paralelo da BD
- [ ] Sessão/autorização resolve permissions a partir da fonte oficial
- [ ] Testes cobrem papéis multi-role e `admin.panel`
- [ ] Documentação / ADR actualizado

---

## P0-2 — Integridade de `audit_logs`

**Problema:** Política RLS permite `INSERT` por utilizadores autenticados nos próprios registos.

**Objectivo:** Impedir adulteração da auditoria. Escrita apenas via caminho controlado (`security definer` / service role).

**Critérios de conclusão:**

- [ ] Utilizadores autenticados não podem inserir/alterar `audit_logs` directamente
- [ ] Existe API/função server-side controlada para eventos auditáveis
- [ ] Migration + testes/checklist de segurança
- [ ] Documentação actualizada

---

## P0-3 — CI activo em `.github/workflows/`

**Problema:** Pipeline existe apenas como template em `docs/engineering/github-workflows/ci.yml`.

**Objectivo:** Activar CI (lint, typecheck, test, build) em PRs/`main` assim que o repositório tiver permissões `workflow`.

**Critérios de conclusão:**

- [ ] `ci.yml` em `.github/workflows/`
- [ ] Pipeline verde na branch principal de desenvolvimento
- [ ] Documentação do template actualizada (ou removida se redundante)

---

## Relação com fases

| Fase                           | Relação com P0                                 |
| ------------------------------ | ---------------------------------------------- |
| Landing Page                   | Autorizada **sem** depender do P0              |
| PRD-001 Authentication         | **Bloqueada** até P0-1, P0-2 e P0-3 concluídos |
| Fluxos autenticados de negócio | Proibidos até P0 completo                      |
