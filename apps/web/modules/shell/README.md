# Module: shell

**Fase 3 — Platform Shell** (Sidebar + Topbar + Main).

**Spec:** `docs/proposals/PHASE_3_PLATFORM_SHELL_SPEC.md`  
**Baseline auth:** `docs/PROJECT_BASELINE_PRD001.md` (congelada)

## Estrutura

- `nav.ts` — itens de navegação (activo / em breve / permission)
- `components/PlatformShell.tsx` — chrome autenticado
- `content/pt.ts` — copy do shell

Integrado via `AppShell` (gate de sessão + provider) em `app/(app)/layout.tsx`.
