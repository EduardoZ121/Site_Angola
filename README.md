# Kuteka — KEOS

Monorepo oficial da plataforma Kuteka (**Kuteka Engineering Operating System**).

> PropTech africana de gestão de património, confiança e habitação digna — **não** um site de classificados.

## Stack oficial

- **Next.js 15** (App Router) + React 19 + TypeScript strict
- **pnpm** workspaces + **Turborepo**
- **Tailwind CSS** + Design System `@kuteka/ui` (Kuteka Orange / Slate)
- **Supabase** (Auth, PostgreSQL, Storage, RLS)
- Deploy alvo: **Vercel** + Cloudflare (DNS adiado até infra estável)

Ver `docs/architecture/ADR-001-foundation-architecture-decisions.md` e `docs/AI_CONTEXT.md`.

## Estrutura

```
apps/web          Produto principal
apps/admin        Reservado
apps/landing      Reservado (Landing = route group em web)
packages/*        ui, config, types, validation, database, auth, shared
supabase/         Migrations + seeds
legacy/           Protótipo Vite (não produção)
docs/             ADRs, specs, AI_CONTEXT
```

## Arranque local

```bash
pnpm install
cp .env.example apps/web/.env.local   # ajustar valores
pnpm dev                              # http://localhost:3000
```

### Scripts

| Comando          | Descrição                                    |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Next.js em desenvolvimento                   |
| `pnpm build`     | Build do monorepo                            |
| `pnpm lint`      | ESLint                                       |
| `pnpm typecheck` | TypeScript                                   |
| `pnpm test`      | Testes unitários (Vitest)                    |
| `pnpm test:e2e`  | Smoke Playwright (requer build prévio em CI) |

### Design System

Catálogo em desenvolvimento: [http://localhost:3000/dev/ui](http://localhost:3000/dev/ui)

### Supabase

```bash
# Com Supabase CLI
supabase start
supabase db reset
```

## Legado

O protótipo Vite/React está em `legacy/`. Não usar como base de novas features.

## Documentação chave

- `docs/README.md` — índice
- `CONTRIBUTING.md` — como contribuir
- `docs/AI_CONTEXT.md`
- `docs/engineering/DEVELOPMENT_PROCESS.md`
- `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` — **v1.0** (N5 concluído)
- `docs/backlog/PRD_001_CLOSURE.md` — encerramento oficial do módulo auth
- `docs/architecture/ADR-001-foundation-architecture-decisions.md`
- `docs/proposals/PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md`

## Fases (estado actual)

1. **FASE 1 — Infraestrutura** — ✅ encerrada
2. **Landing Page** (PASSO 1 + 1A) — ✅ encerrada
3. **P0 pré-Auth** — ✅ (CI + migrations remotas)
4. **PRD-001 Auth** — ✅ **N5 concluído** (2026-07-31)
5. **Shell da plataforma** — próximo
6. **PRD-002+** Parceiro Patrimonial, Cliente, …

Processo oficial: `docs/engineering/DEVELOPMENT_PROCESS.md`  
pnpm é a fonte de verdade do monorepo (`pnpm-lock.yaml`).
