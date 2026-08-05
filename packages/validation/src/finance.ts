import { z } from 'zod';

export const FINANCE_PRODUCT_CATEGORIES = [
  'mobility',
  'protection',
  'partner_plan',
  'marketplace',
  'plus',
  'commission',
  'lead',
  'analytics',
  'academy',
  'advertising',
  'other',
] as const;

export const FINANCE_PRICING_MODELS = [
  'fixed',
  'percentage',
  'tiered',
  'subscription',
  'commission',
  'free',
] as const;

export const FINANCE_URGENCY_BANDS = [
  'planned_90',
  'priority_60',
  'urgent_30',
  'emergency_14',
] as const;

export const financeQuoteSchema = z.object({
  productCode: z.string().trim().min(2).max(80),
  urgencyBand: z.enum(FINANCE_URGENCY_BANDS).optional().nullable(),
  countryCode: z.string().trim().length(2).default('AO'),
  currency: z.string().trim().min(3).max(3).default('AOA'),
});

export const financeSandboxPaymentSchema = z.object({
  productCode: z.string().trim().min(2).max(80),
  urgencyBand: z.enum(FINANCE_URGENCY_BANDS).optional().nullable(),
  gatewayCode: z.string().trim().min(2).max(40).default('sandbox'),
  description: z.string().trim().max(500).optional().nullable(),
});

export const financeCaptureSchema = z.object({
  paymentIntentId: z.string().uuid(),
});

export const financeGrantCreditsSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive().max(10_000_000),
  reason: z.string().trim().max(500).optional().nullable(),
});

export const financeUpdatePriceRuleSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().nonnegative().max(100_000_000).optional(),
  percentage: z.number().nonnegative().max(100).optional().nullable(),
  active: z.boolean().optional(),
  label: z.string().trim().min(2).max(160).optional(),
});

export const financeConsentSchema = z.object({
  scope: z.enum([
    'kai_suggestions',
    'partner_offers',
    'provider_offers',
    'insurance',
    'telecom',
    'analytics_share',
  ]),
  granted: z.boolean(),
});

// ─── Fase A — infraestrutura financeira transversal ─────────────────────────

export const FINANCE_REFUND_MODES = ['credits', 'gateway', 'adjustment'] as const;
export const FINANCE_CRM_ACCOUNT_TYPES = ['partner', 'provider', 'enterprise', 'investor'] as const;
export const FINANCE_FRAUD_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export const FINANCE_FRAUD_STATUSES = ['open', 'reviewing', 'confirmed', 'dismissed'] as const;
export const FINANCE_EXPORT_FORMATS = ['csv', 'json', 'xml', 'saft'] as const;
export const FINANCE_COMMISSION_PAYER_SIDES = [
  'client',
  'partner',
  'provider',
  'advertiser',
  'platform',
] as const;

export const financeRedeemCreditsSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  reason: z.string().trim().max(500).optional().nullable(),
  orderRef: z.string().trim().max(120).optional().nullable(),
});

export const financeCreateRefundSchema = z.object({
  ledgerEntryId: z.string().uuid(),
  amount: z.number().positive().max(100_000_000),
  reason: z.string().trim().min(2).max(500),
  mode: z.enum(FINANCE_REFUND_MODES).default('credits'),
});

export const financeOpenDisputeSchema = z.object({
  ledgerEntryId: z.string().uuid(),
  reason: z.string().trim().min(2).max(500),
  amount: z.number().nonnegative().max(100_000_000).optional().nullable(),
});

export const financeRunReconciliationSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  gatewayCode: z.string().trim().max(40).optional().nullable(),
});

export const financeInvoicePdfSchema = z.object({
  invoiceId: z.string().uuid(),
});

export const financeMarkInvoiceEmailedSchema = z.object({
  invoiceId: z.string().uuid(),
  email: z.string().trim().email(),
});

export const financeUpsertProductSchema = z.object({
  code: z.string().trim().min(2).max(80),
  name: z.string().trim().min(2).max(160),
  category: z.enum(FINANCE_PRODUCT_CATEGORIES),
  pricingModel: z.enum(FINANCE_PRICING_MODELS),
  description: z.string().trim().max(500).optional().nullable(),
  currency: z.string().trim().min(3).max(3).default('AOA'),
  buyerRoles: z.array(z.string().trim().min(2).max(64)).default([]),
  kaiSuggestible: z.boolean().default(false),
  active: z.boolean().default(true),
  amount: z.number().nonnegative().max(100_000_000).optional().nullable(),
  priceCode: z.string().trim().max(80).optional().nullable(),
  chargeEvent: z.string().trim().max(40).default('on_purchase'),
});

export const financeSetCommissionSchema = z.object({
  code: z.string().trim().min(2).max(80),
  label: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(64),
  takeRatePct: z.number().nonnegative().max(100).optional().nullable(),
  fixedAmount: z.number().nonnegative().max(100_000_000).optional().nullable(),
  payerSide: z.enum(FINANCE_COMMISSION_PAYER_SIDES).default('provider'),
  currency: z.string().trim().min(3).max(3).default('AOA'),
  active: z.boolean().default(true),
});

export const financeUpsertKaiRuleSchema = z.object({
  code: z.string().trim().min(2).max(80),
  label: z.string().trim().min(2).max(160),
  triggerEvent: z.string().trim().min(2).max(80),
  targetProductCode: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  targetSegment: z.string().trim().max(64).optional().nullable(),
  consentScope: z.string().trim().max(64).optional().nullable(),
  priority: z.number().int().min(0).max(10_000).default(100),
  active: z.boolean().default(true),
});

export const financeFlagFraudSchema = z.object({
  entityType: z.enum([
    'ledger_entry',
    'payment_intent',
    'user',
    'refund',
    'dispute',
    'service_order',
    'other',
  ]),
  entityId: z.string().uuid().optional().nullable(),
  reason: z.string().trim().min(2).max(500),
  severity: z.enum(FINANCE_FRAUD_SEVERITIES).default('medium'),
  userId: z.string().uuid().optional().nullable(),
});

export const financeResolveFraudSchema = z.object({
  flagId: z.string().uuid(),
  status: z.enum(FINANCE_FRAUD_STATUSES),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const financeUpsertCrmAccountSchema = z.object({
  code: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(160),
  accountType: z.enum(FINANCE_CRM_ACCOUNT_TYPES),
  serviceProviderId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
  contactEmail: z.string().trim().email().optional().nullable(),
  contactPhone: z.string().trim().max(40).optional().nullable(),
  status: z.enum(['lead', 'prospect', 'active', 'churned', 'archived']).default('active'),
});

export const financeCreateExportSchema = z.object({
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  format: z.enum(FINANCE_EXPORT_FORMATS).default('csv'),
});

// ─── Fase B — Kuteka Pay (motor de pagamento unificado) ─────────────────────

export const KUTEKA_PAY_MODULE_CODES = [
  'smart_move',
  'rent',
  'marketplace',
  'concierge',
  'contract',
  'valuation',
  'booking',
  'plus',
  'partner_plan',
  'other',
] as const;

export const KUTEKA_PAY_ADAPTER_CODES = [
  'sandbox',
  'multicaixa',
  'emis',
  'stripe',
  'wise',
  'bank_transfer',
] as const;

export const KUTEKA_PAY_WEBHOOK_EVENTS = ['succeeded', 'failed', 'cancelled', 'expired'] as const;

export const kutekaPayCreateIntentSchema = z.object({
  productCode: z.string().trim().min(2).max(80),
  moduleCode: z.enum(KUTEKA_PAY_MODULE_CODES).default('other'),
  purpose: z.string().trim().max(120).optional().nullable(),
  referenceType: z.string().trim().max(64).optional().nullable(),
  referenceId: z.string().uuid().optional().nullable(),
  urgencyBand: z.enum(FINANCE_URGENCY_BANDS).optional().nullable(),
  gatewayCode: z.enum(KUTEKA_PAY_ADAPTER_CODES).optional().nullable(),
  idempotencyKey: z.string().trim().min(6).max(120).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
});

export const kutekaPayIntentIdSchema = z.object({
  paymentIntentId: z.string().uuid(),
});

export const kutekaPayFailSchema = z.object({
  paymentIntentId: z.string().uuid(),
  code: z.string().trim().max(80).optional().nullable(),
  message: z.string().trim().max(500).optional().nullable(),
});

export const kutekaPaySimulateWebhookSchema = z.object({
  paymentIntentId: z.string().uuid(),
  event: z.enum(KUTEKA_PAY_WEBHOOK_EVENTS),
});

export const kutekaPaySetDefaultGatewaySchema = z.object({
  gatewayCode: z.enum(KUTEKA_PAY_ADAPTER_CODES),
});

export type KutekaPayCreateIntentInput = z.infer<typeof kutekaPayCreateIntentSchema>;
export type KutekaPayIntentIdInput = z.infer<typeof kutekaPayIntentIdSchema>;
export type KutekaPayFailInput = z.infer<typeof kutekaPayFailSchema>;
export type KutekaPaySimulateWebhookInput = z.infer<typeof kutekaPaySimulateWebhookSchema>;
export type KutekaPaySetDefaultGatewayInput = z.infer<typeof kutekaPaySetDefaultGatewaySchema>;

export type FinanceQuoteInput = z.infer<typeof financeQuoteSchema>;
export type FinanceSandboxPaymentInput = z.infer<typeof financeSandboxPaymentSchema>;
export type FinanceCaptureInput = z.infer<typeof financeCaptureSchema>;
export type FinanceGrantCreditsInput = z.infer<typeof financeGrantCreditsSchema>;
export type FinanceUpdatePriceRuleInput = z.infer<typeof financeUpdatePriceRuleSchema>;
export type FinanceConsentInput = z.infer<typeof financeConsentSchema>;
export type FinanceRedeemCreditsInput = z.infer<typeof financeRedeemCreditsSchema>;
export type FinanceCreateRefundInput = z.infer<typeof financeCreateRefundSchema>;
export type FinanceOpenDisputeInput = z.infer<typeof financeOpenDisputeSchema>;
export type FinanceRunReconciliationInput = z.infer<typeof financeRunReconciliationSchema>;
export type FinanceInvoicePdfInput = z.infer<typeof financeInvoicePdfSchema>;
export type FinanceMarkInvoiceEmailedInput = z.infer<typeof financeMarkInvoiceEmailedSchema>;
export type FinanceUpsertProductInput = z.infer<typeof financeUpsertProductSchema>;
export type FinanceSetCommissionInput = z.infer<typeof financeSetCommissionSchema>;
export type FinanceUpsertKaiRuleInput = z.infer<typeof financeUpsertKaiRuleSchema>;
export type FinanceFlagFraudInput = z.infer<typeof financeFlagFraudSchema>;
export type FinanceResolveFraudInput = z.infer<typeof financeResolveFraudSchema>;
export type FinanceUpsertCrmAccountInput = z.infer<typeof financeUpsertCrmAccountSchema>;
export type FinanceCreateExportInput = z.infer<typeof financeCreateExportSchema>;
