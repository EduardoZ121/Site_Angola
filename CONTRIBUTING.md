# Contribuir — KEOS / Kuteka

## Antes de tudo

1. Ler [`docs/AI_CONTEXT.md`](docs/AI_CONTEXT.md)  
2. Seguir [`docs/engineering/DEVELOPMENT_PROCESS.md`](docs/engineering/DEVELOPMENT_PROCESS.md)  
3. Índice: [`docs/README.md`](docs/README.md)

## Regras rápidas

- **pnpm** é a fonte de verdade (`pnpm-lock.yaml`)  
- Sem implementação de módulo sem **Aprovação Funcional** + **Engineering Gate** + **Autorização de Implementação**  
- Auth de produto: só `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` (v1.0) — não usar guias legados em `docs/*LOGIN*`  
- Conventional Commits (`commitlint`)  
- Qualidade local: `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test`

## Arranque

```bash
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

## CI (P1)

Definição: `docs/engineering/github-workflows/ci.yml`  
Activação: `./scripts/enable-github-ci.sh` (requer scope GitHub `workflow`)  
Estado do Gate: `docs/backlog/PRD_001_ENGINEERING_GATE.md`
