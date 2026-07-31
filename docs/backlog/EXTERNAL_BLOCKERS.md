# Bloqueios externos — actualizado 2026-07-31 (tarde)

Prioridade: **entrega**. Estado real verificado por HTTP.

| ID  | Bloqueio                        | Estado                                                                  | Owner |
| --- | ------------------------------- | ----------------------------------------------------------------------- | ----- |
| E3  | Domínio público desalinhado     | ✅ **Resolvido** — `kutekalink.com` serve KEOS via Render (deploy hook) | —     |
| E4  | Deploy Actions sem lockfile npm | ✅ **Resolvido** — `package-lock.json` + Deploy Kuteka verde            | —     |
| E1  | PAT sem scope `workflow`        | 🟡 Opcional — agent não edita `.github/workflows/*`                     | PO    |
| E2  | Supabase remoto + env           | ❌ **Único bloqueio de produto** — login real                           | PO    |

## E2 — o que falta (1 passo teu)

1. Criar token: https://supabase.com/dashboard/account/tokens
2. No ambiente Cloud / terminal:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
export SUPABASE_ORG_ID=<org-id>   # aparece com: npx supabase orgs list
bash scripts/bootstrap-supabase.sh
```

Isso cria/liga o projecto, aplica `0001`→`0003`, gera `kuteka-config.js` com URL+anon.

3. Colar também em GitHub Secrets (para rebuilds futuros):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (só se houver server)

4. Auth URLs no dashboard Supabase:
   - Site URL: `https://kutekalink.com`
   - Redirect allowlist: `https://kutekalink.com/auth/**`

**Alternativa mínima:** criar projecto no UI, correr SQL das 3 migrations, e editar `kuteka-config.js` no host com URL+anon (runtime — sem rebuild).

## E1 — opcional (1 min no browser)

Substituir `.github/workflows/deploy.yml` pelo conteúdo de  
`docs/engineering/github-workflows/deploy.yml`  
via GitHub → Edit file (o agent não tem scope `workflow`).
