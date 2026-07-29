# GitHub Workflows (templates)

Os ficheiros aqui são a definição oficial de CI para KEOS.

O token desta sessão Cloud Agent **não** tem scope `workflow`, por isso os YAML
não foram escritos directamente em `.github/workflows/`.

Para activar:

```bash
cp docs/engineering/github-workflows/ci.yml .github/workflows/ci.yml
# Opcional: desactivar o deploy Vite legado após Vercel estar activo
```

Depois faça commit com uma conta/token com scope `workflow`.
