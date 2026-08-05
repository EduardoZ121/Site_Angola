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

## Ordem do roteiro (nova ordem PO 2026-08-05)

Antes de mais serviços de negócio, consolidamos a **infraestrutura financeira
transversal** — genérica e reutilizável, sem soluções isoladas e sem custódia
(`custody_mode = none`).

- **Fase A — Consolidação (entregue)**
  - Migration: `supabase/migrations/0021_finance_infra_fase_a.sql`
  - ADR: `docs/architecture/ADR-017-finance-infra-fase-a.md`
  - Reembolsos, disputas, reconciliação, fraude, regras KAI, CRM financeiro,
    exportações contabilísticas, faturas com PDF/numeração e redimir créditos.
  - Super Admin reorganizado num Command Center por separadores (config-first).
- **Fase B — Kuteka Pay: motor de pagamento unificado (esta entrega)**
  - Migration: `supabase/migrations/0022_kuteka_pay_engine.sql`
  - ADR: `docs/architecture/ADR-018-kuteka-pay-engine.md`
  - Uma só arquitectura de pagamento para **todos** os módulos (renda, reservas,
    mudança inteligente, concierge, contratos, avaliações, prestadores, futuros).
  - Payment intent como fonte de verdade; `module_code` / `purpose` /
    `reference_type` / `reference_id` ligam qualquer objecto de negócio.
  - RPCs `kuteka_pay_create_intent`, `kuteka_pay_capture`, `kuteka_pay_fail`,
    `kuteka_pay_cancel`, `kuteka_pay_status`, `kuteka_pay_simulate_webhook`,
    `kuteka_pay_adapter_health`, `kuteka_pay_set_default_gateway`.
  - `finance_create_sandbox_payment` / `finance_capture_sandbox_payment` passam a
    **wrappers** sobre o motor (callers antigos continuam a funcionar).
  - Adaptadores: `sandbox|multicaixa|emis|stripe|wise|bank_transfer` (só sandbox
    activo nesta fase; trocar de gateway é configuração, não código de módulo).
  - Super Admin: novo separador **Kuteka Pay** (saúde de adaptadores, simular
    webhook, gateway por omissão).
- **Fase C — Marketplace Operacional (esta entrega)**
  - Migration: `supabase/migrations/0023_marketplace_ops.sql`
  - ADR: `docs/architecture/ADR-019-marketplace-ops.md`
  - Fecha o ciclo do prestador: pedido → orçamento → aceitação → execução →
    **pagamento via Kuteka Pay** → avaliação → **comissão no Ledger** → SLA →
    histórico. Nenhum caminho de pagamento isolado.
  - `service_orders` ganha orçamento, SLA e avaliação; `service_order_events` é a
    timeline append-only.
  - RPCs `marketplace_create_order`, `marketplace_submit_quote`,
    `marketplace_accept_quote`, `marketplace_start_order`,
    `marketplace_complete_order`, `marketplace_pay_order`,
    `marketplace_cancel_order`, `marketplace_rate_order`,
    `marketplace_check_slas`, `marketplace_my_context`,
    `marketplace_list_providers`.
  - `kuteka_pay_create_intent` ganha `p_amount_override` (genérico) para cobrar o
    valor negociado mantendo o intent como fonte de verdade.
  - Produto genérico `marketplace.service` (valor real via override do orçamento).
  - UI `/app/servicos` por separadores: Prestadores | Os meus pedidos | Pedidos
    recebidos. Prestadores demo operáveis por `demo.parceiro` ou `finance.manage`.
- **Fase D — Gateways reais + custódia/escrow opcional e automação de payouts.**
- **Fase E — Conformidade AGT/SAF-T** sobre as exportações da Fase A.

As Fases D/E assentam sobre a fundação das Fases A/B/C e só arrancam depois destas.
