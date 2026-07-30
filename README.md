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
- `docs/AI_CONTEXT.md`
- `docs/engineering/DEVELOPMENT_PROCESS.md`
- `docs/proposals/PRD_001_AUTHENTICATION_SPEC.md` — **v1.0** (Aprovação Funcional)
- `docs/backlog/PRD_001_ENGINEERING_GATE.md` — Gate pré-implementação
- `docs/architecture/ADR-001-foundation-architecture-decisions.md`
- `docs/proposals/PASSO_0_IDENTIDADE_OFICIAL_KUTEKA.md`

## Fases (estado actual)

1. **FASE 1 — Infraestrutura** — ✅ encerrada  
2. **Landing Page** (PASSO 1 + 1A) — ✅ encerrada  
3. **P0 pré-Auth** — P0-1/P0-2 ✅ técnicos; P0-3 (CI + `0002` remoto) ⏳ ops  
4. **PRD-001 Auth** — Aprovação Funcional ✅ · Engineering Gate ▶️ (P1+P2) · implementação ❌ até Fase 2 do processo  
5. Shell, domínios de produto, KAI, …

> **Nota de nomenclatura:** “FASE 2” no roadmap de produto (auth) ≠ **Fase 2 do processo** (= Autorização de Implementação). Ver `DEVELOPMENT_PROCESS.md`.

Processo oficial: `docs/engineering/DEVELOPMENT_PROCESS.md`  
pnpm é a fonte de verdade do monorepo (`pnpm-lock.yaml`).
