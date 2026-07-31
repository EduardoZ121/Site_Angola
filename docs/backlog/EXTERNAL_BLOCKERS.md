# Bloqueios externos (objectivos) — actualizado 2026-07-31

Prioridade do projecto: **entrega**. Estes itens bloqueiam só o que depende deles; o resto avança.

| ID  | Bloqueio                                                             | Impacto                                                | Owner                            | Como desbloquear                                                                |
| --- | -------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------- |
| E1  | PAT sem scope `workflow` / fine-grained sem Contents+Workflows write | Agent não edita `.github/workflows/*`                  | PO                               | Classic PAT `repo`+`workflow` **ou** fine-grained Contents+Workflows read/write |
| E2  | Supabase remoto + env (`URL`, anon, service role)                    | Login/registo reais; Gate P2; migrations `0002`/`0003` | PO/Ops                           | Criar projecto; aplicar SQL; colocar env no hosting                             |
| E3  | DNS `kutekalink.com` ainda no Render legado                          | Domínio público desalinhado                            | PO/Ops                           | A records → GitHub Pages (ver DEPLOY_STATUS)                                    |
| E4  | `Deploy Kuteka` exige `package-lock.json` (`cache: npm`) vs CI/pnpm  | Conflito de lockfiles                                  | PO (1 linha) **ou** agent com E1 | Em `deploy.yml` remover a linha `cache: npm`                                    |

**Não bloqueiam entrega de UI estática:** E2 (páginas auth publicam sem backend; submit mostra config em falta).

**Estado de publicação:** o agent publica `prebuilt/web-out` → branch `gh-pages` directamente quando o workflow Deploy falha por E4.
