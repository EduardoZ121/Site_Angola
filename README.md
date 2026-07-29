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

- `docs/AI_CONTEXT.md`
- `docs/architecture/ADR-001-foundation-architecture-decisions.md`
- `docs/proposals/FASE_1_INFRAESTRUTURA_SPEC.md` (aprovada)
- `docs/proposals/PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md`
- `docs/proposals/PASSO_1_LANDING_PAGE_SPEC.md`
- `docs/proposals/PASSO_1A_LANDING_EXPERIENCE_BLUEPRINT.md`

## Fases

1. **FASE 1 — Infraestrutura** (esta base) → revisão técnica
2. Landing Page (PASSO 1 + 1A)
3. FASE 2 — Auth de produto (PRD-001)
4. Shell, domínios, KAI, …
