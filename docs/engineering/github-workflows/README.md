# GitHub Workflows

## Estado P0-3

O workflow oficial está definido em:

`docs/engineering/github-workflows/ci.yml`

Activar no repositório (requer token GitHub com scope **`workflow`**):

```bash
./scripts/enable-github-ci.sh
git add .github/workflows/ci.yml
git commit -m "ci: enable KEOS quality workflow"
git push
```

O agent Cloud actual **não** consegue fazer push de ficheiros em `.github/workflows/` sem esse scope.

## Conteúdo do CI

lint · typecheck · test · build `apps/web` · Playwright smoke
