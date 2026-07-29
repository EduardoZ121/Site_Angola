# P0 — Runbook de activação final

**Objectivo:** Encerrar oficialmente `P0_PRE_AUTH`  
**Pré-condição:** P0-1 e P0-2 **aprovados tecnicamente** (2026-07-29)

---

## 1. Aplicar migration `0002` no Supabase

No projecto Supabase da Kuteka (CLI ligado ou SQL Editor):

```bash
# Opção A — CLI (recomendado)
supabase db push
# ou, em ambiente local limpo:
supabase db reset
```

Opção B — SQL Editor: executar o conteúdo de  
`supabase/migrations/0002_p0_rbac_and_audit_hardening.sql`

Depois: seguir `docs/security/AUDIT_LOGS_CHECKLIST.md`.

---

## 2. Activar o workflow GitHub CI

Requer Personal Access Token (ou conta) com scope **`workflow`** (+ `repo`).

```bash
git checkout cursor/p0-pre-auth-f96b
./scripts/enable-github-ci.sh
git add .github/workflows/ci.yml
git commit -m "ci: enable KEOS quality workflow"
git push origin cursor/p0-pre-auth-f96b
```

---

## 3. Confirmar o primeiro pipeline

1. Abrir Actions no repositório `EduardoZ121/Site_Angola`
2. Verificar o workflow **CI** no push/PR da branch
3. Confirmar: lint · typecheck · test · build · e2e smoke = **verde**

---

## 4. Encerrar o P0 na documentação

Actualizar `docs/backlog/P0_COMPLETION_REPORT.md` e `docs/backlog/P0_PRE_AUTH.md`:

- marcar P0-3 checkboxes
- estado = **Encerrado oficialmente**
- data + link do run Actions bem-sucedido

---

## 5. Desbloquear PRD-001

Só após o passo 4: iniciar especificação/implementação do  
**PRD-001 – Authentication & User Management**.
