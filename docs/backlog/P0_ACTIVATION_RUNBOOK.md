# P0 — Runbook de activação final

**Objectivo:** Fechar ops remanescentes do P0 (CI + migration `0002` remoto)  
**Pré-condição:** P0-1 e P0-2 **aprovados tecnicamente**  
**Autoridade de estado do Gate:** `docs/backlog/PRD_001_ENGINEERING_GATE.md` §8

Este runbook é um atalho operacional. O Engineering Gate é a fonte de verdade para marcar P1/P2 como ✅.

---

## 1. P2 — Migration `0002` no Supabase remoto

```bash
# Opção A — CLI ligado ao projecto remoto
supabase db push

# NÃO usar só `db reset` local como prova do remoto
```

Opção B — SQL Editor: executar  
`supabase/migrations/0002_p0_rbac_and_audit_hardening.sql`

Validar: `docs/security/AUDIT_LOGS_CHECKLIST.md` (+ checks RBAC no mesmo ficheiro).  
Registar evidência no Engineering Gate §8.2 (project ref, data, quem).

---

## 2. P1 — Activar workflow GitHub CI

Requer token com scope **`workflow`** (+ `repo`). Branch actual ou `main` (não a branch histórica `p0-pre-auth`).

```bash
./scripts/enable-github-ci.sh
git add .github/workflows/ci.yml
git commit -m "ci: enable KEOS quality workflow"
git push
```

Confirmar Actions → workflow **CI** verde.  
Registar evidência no Engineering Gate §8.1 (URL do run, SHA, data).

Detalhe: `docs/engineering/github-workflows/README.md`.

---

## 3. Documentação P0

Actualizar `P0_COMPLETION_REPORT.md` / `P0_PRE_AUTH.md` checkboxes P0-3 quando P1+P2 tiverem evidência no Gate.

---

## 4. Depois de P1+P2 ✅

1. Engineering Gate actualizado (verde operacional)
2. PO emite **Autorização de Implementação** (Fase 2 do processo)
3. **Só então** código do PRD-001

A especificação PRD-001 **já** tem Aprovação Funcional — não reiniciar a spec.
