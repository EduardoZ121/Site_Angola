# GitHub Workflows

## Estado (P1 do Engineering Gate)

| Item                                 | Estado                                          |
| ------------------------------------ | ----------------------------------------------- |
| Definição CI                         | ✅ `docs/engineering/github-workflows/ci.yml`   |
| Activo em `.github/workflows/ci.yml` | ❌ Ainda não (só `deploy.yml` no remote)        |
| Scope necessário para activar        | GitHub token com **`workflow`** (+ `repo`)      |
| Gate                                 | `docs/backlog/PRD_001_ENGINEERING_GATE.md` §8.1 |

Última verificação objectiva: **2026-07-30** — Actions listadas: Deploy Kuteka + pages-build-deployment; **sem** workflow CI de quality.

## Activar CI

```bash
./scripts/enable-github-ci.sh
git add .github/workflows/ci.yml
git commit -m "ci: enable KEOS quality workflow"
git push
```

O agente Cloud **não** marca P1 como concluído sem evidência (ficheiro no remote + run verde). Tokens só com scope `repo` **não** bastam para push de workflows.

## Conteúdo do CI

lint · typecheck · test · build `apps/web` · Playwright smoke

## Deploy

`deploy.yml` — publicação Landing → `gh-pages` (já activo).
