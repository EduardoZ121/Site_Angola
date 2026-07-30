# Acção mínima do PO/Ops — fechar Engineering Gate (P1 + P2)

**Contexto:** o agente Cloud **já tentou** activar CI e aplicar a migration sozinho (Gate §13) e **falhou por credenciais**. O PO confirmou (Gate §14) que **não** se deve contornar P1/P2 — são dependências exclusivas de credenciais/infra; o PO trata da obtenção.

**Gate:** `docs/backlog/PRD_001_ENGINEERING_GATE.md`  
**Após P1+P2:** o Líder Técnico implementa auth até N5 **sem nova confirmação**.

---

## P1 — CI (2–5 min)

O token actual do GitHub (`repo` only) **não pode** criar/actualizar ficheiros em `.github/workflows/`.

### Opção A — PAT com scope `workflow` (preferida)

1. GitHub → Settings → Developer settings → Personal access tokens
   - Classic: scopes **`repo` + `workflow`**
   - ou Fine-grained: Contents + Workflows (read/write) no repo `Site_Angola`
2. No clone do repo:
   ```bash
   ./scripts/enable-github-ci.sh
   git add .github/workflows/ci.yml
   git commit -m "ci: enable KEOS quality workflow"
   git push origin main   # ou merge via PR para main
   ```
3. Actions → workflow **CI** → copiar URL do run **verde**.
4. Colar em Gate §8.1 (Run URL, Commit SHA, Data) → P1 ✅.

### Opção B — UI GitHub (sem regenerar PAT)

1. Abrir `docs/engineering/github-workflows/ci.yml` no repo.
2. Em GitHub: **Add file** → Create new file → caminho `.github/workflows/ci.yml` → colar conteúdo → Commit to `main`.
3. Confirmar run CI verde → Gate §8.1.

---

## P2 — Migration `0002` no Supabase remoto (2–5 min)

1. Abrir o projecto Supabase de destino (staging/prod).
2. SQL Editor → colar e executar:
   `supabase/migrations/0002_p0_rbac_and_audit_hardening.sql`
3. (Opcional) correr `scripts/verify-p0-migration.sql` / checklist `docs/security/AUDIT_LOGS_CHECKLIST.md`.
4. Colar em Gate §8.2: Project ref, Data, Aplicado por, Checklist → P2 ✅.

**Alternativa CLI** (com `SUPABASE_ACCESS_TOKEN` + link do projecto):

```bash
supabase db push
```

---

## O que **não** precisas de fazer

- Nova autorização de implementação (já condicional §12).
- Esperar P4/P5 para o código começar (P4 desejável; P5 não bloqueia preview).
- Pedir ao agente para “tentar outra vez” sem PAT `workflow` e sem acesso Supabase — o resultado será o mesmo (§13).

---

## Depois de P1+P2

Responder neste chat com as evidências (URLs / project ref) **ou** actualizar o Gate. O Líder Técnico:

1. Marca Gate verde
2. Activa `PRD_001_IMPLEMENTATION_READINESS.md`
3. Abre `cursor/prd-001-authentication-f96b` e implementa até N5
