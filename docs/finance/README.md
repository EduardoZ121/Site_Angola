# Finanças Kuteka

Documentação oficial da monetização e arquitectura financeira.

| Documento                                                                        | Formato  | Descrição                 |
| -------------------------------------------------------------------------------- | -------- | ------------------------- |
| [ARQUITETURA_FINANCEIRA_KUTEKA.md](./ARQUITETURA_FINANCEIRA_KUTEKA.md)           | Markdown | Fonte canónica (v1.0)     |
| [Arquitetura_Financeira_Kuteka_v1.docx](./Arquitetura_Financeira_Kuteka_v1.docx) | Word     | Para descarregar / editar |
| [Arquitetura_Financeira_Kuteka_v1.pdf](./Arquitetura_Financeira_Kuteka_v1.pdf)   | PDF      | Para partilhar / imprimir |

**Decisões PO (2026-08-05):** B2B2C · Fase 1 sem escrow · híbrido Grátis + Pay-per-use + Plus · Super Admin em `/app/super` · gateways em sandbox até conta comercial.

## Implementação Fase 1

- Migration: `supabase/migrations/0019_finance_phase1.sql`
- ADR: `docs/architecture/ADR-015-finance-phase1.md`
- Super Admin: `/app/super`
- Hub utilizador: `/app/financeiro`
- Demo Super: `demo.super@kuteka.local` / `DemoKuteka2026!`
