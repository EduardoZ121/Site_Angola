# Module: landing

Landing Page pública da Kuteka — contrato: **PASSO 1** + **PASSO 1A**.

## Estrutura

- `content/` — pacotes de copy por idioma (pt/en/fr/es) + `getLandingCopy(locale)`; `content.ts` mantém-se como re-export de compatibilidade
- `LandingPage.tsx` — composição das secções
- `components/` — Topbar, Hero, Diferença, Como funciona, Fecho, Footer, ícones, Reveal

## Secções (ordem fixa)

A Topbar → B Hero → C Diferença → D Como funciona → E Fecho → F Footer

## CTAs

| Label    | Destino                                           |
| -------- | ------------------------------------------------- |
| Começar  | `/auth/registar` (PRD-001 F1)                     |
| Entrar   | `/auth/entrar` (PRD-001 F3)                       |
| Explorar | `#diferenca` (scroll; `/explorar` quando existir) |

## Regras

- Design System `@kuteka/ui` + tokens Kuteka Orange / Slate
- Sem stats fabricados, sem social proof inventado
- Secções são client components — usam `useLocale()` + `getLandingCopy(locale)` para seguir o idioma activo
- Documentação: PASSO 0, 1, 1A
