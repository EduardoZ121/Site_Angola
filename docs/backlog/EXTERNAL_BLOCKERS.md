# Bloqueios externos (objectivos) — actualizado 2026-07-31

Prioridade do projecto: **entrega**. Estes itens bloqueiam só o que depende deles; o resto avança.

| ID  | Bloqueio                                                             | Impacto                                                | Owner                       | Como desbloquear                                                                | Estado         |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------- | ------------------------------------------------------------------------------- | -------------- |
| E1  | PAT sem scope `workflow` / fine-grained sem Contents+Workflows write | Agent não edita `.github/workflows/*`                  | PO                          | Classic PAT `repo`+`workflow` **ou** fine-grained Contents+Workflows read/write | ❌             |
| E2  | Supabase remoto + env (`URL`, anon, service role)                    | Login/registo reais; Gate P2; migrations `0002`/`0003` | PO/Ops                      | Criar projecto; aplicar SQL; colocar env no hosting                             | ❌             |
| E3  | DNS `kutekalink.com` ainda no Render legado                          | Domínio público desalinhado; `/auth/*` 404 no domínio  | PO/Ops                      | A/CNAME → GitHub Pages (ver DEPLOY_STATUS); GoDaddy API actual = 401            | ❌ **urgente** |
| E4  | `Deploy Kuteka` exige `package-lock.json` (`cache: npm`) vs CI/pnpm  | Deploy Actions falhava sem lockfile npm                | Agent (mitigado) / PO (fix) | Stub `package-lock.json` na raiz + `pnpm -r` no CI; ideal: `deploy.yml` pnpm    | 🟡 mitigado    |

**Não bloqueiam entrega de UI estática:** E2 (páginas auth publicam sem backend; submit mostra config em falta).

**Estado de publicação:**

- `prebuilt/web-out` → Deploy Kuteka → `gh-pages` (quando E4 ok)
- Fallback: agent publica `prebuilt/web-out` → `gh-pages` directamente
- **Domínio custom:** até E3, `kutekalink.com` continua no Render legado; Pages em `*.github.io` / preview tem o conteúdo novo
