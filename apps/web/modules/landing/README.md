# Module: landing

Landing Page pública da Kuteka — contrato: **PASSO 1** + **PASSO 1A**.

## Estrutura

- `content.ts` — copy e rotas (separado da estrutura)
- `LandingPage.tsx` — composição das secções
- `components/` — Topbar, Hero, Diferença, Como funciona, Fecho, Footer, ícones, Reveal

## Secções (ordem fixa)

A Topbar → B Hero → C Diferença → D Como funciona → E Fecho → F Footer

## CTAs

| Label    | Destino actual                                      |
| -------- | --------------------------------------------------- |
| Começar  | `/auth` (placeholder até PRD-001; bloqueado por P0) |
| Entrar   | `/auth?mode=entrar`                                 |
| Explorar | `#diferenca` (scroll; `/explorar` quando existir)   |

## Regras

- Design System `@kuteka/ui` + tokens Kuteka Orange / Slate
- Sem stats fabricados, sem social proof inventado
- Server Components por defeito; client só para topbar scroll / reveal
- Documentação: PASSO 0, 1, 1A
