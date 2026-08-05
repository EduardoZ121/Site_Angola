# Checklist go-live Kuteka (mínimo)

## Já feito (Core v1.0)

- [x] Landing
- [x] CI quality
- [x] Auth N5 · Shell N5 · PRD-002…007 N5
- [x] Domínio público + Deploy Kuteka
- [x] Supabase remoto (migrations + seed + auth URLs)
- [x] Fluxo Registo → Login → Onboarding → `/app`
- [x] Premium Experience + inventário demo
- [x] Congelamento Core v1.0 + relatório de maturidade

## Antes de beta pública

- [ ] Aplicar migration `0010_core_v1_hardening.sql` em todos os ambientes
- [ ] Executar `disable_demo_partner_account()` (ban `demo.parceiro@kuteka.local`)
- [ ] Confirmar ausência de credenciais demo em documentação pública
- [ ] Decidir privacidade do bucket `property-media` (drafts)
- [ ] Upload real de documentos Confiança
- [ ] Smoke E2E multi-papel (mobile / tablet / desktop)
- [ ] (P4) templates email com marca Kuteka

## Expansão pós-Core

> Actualizado 2026-08-05: Contratos, KYC, Ledger, Kuteka Pay (sandbox),
> Marketplace e D1–D5 já entregues. Fonte de verdade:
> [`docs/product/KUTEKA_ROADMAP_MASTER.md`](../product/KUTEKA_ROADMAP_MASTER.md).

- [x] Contratos (N5)
- [x] Pagamentos (Kuteka Pay sandbox — gateways reais pendentes)
- [ ] Wallet / Escrow — só com decisão legal/PO
- [ ] Passaporte (produto; painel PDK já parcial)
- [ ] Academia
- [x] CRM financeiro (Fase A — aprofundar)
- [x] KAI regras (Fase A — preditivo pendente)
