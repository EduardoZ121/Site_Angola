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

export type FinanceQuoteInput = z.infer<typeof financeQuoteSchema>;
export type FinanceSandboxPaymentInput = z.infer<typeof financeSandboxPaymentSchema>;
export type FinanceCaptureInput = z.infer<typeof financeCaptureSchema>;
export type FinanceGrantCreditsInput = z.infer<typeof financeGrantCreditsSchema>;
export type FinanceUpdatePriceRuleInput = z.infer<typeof financeUpdatePriceRuleSchema>;
export type FinanceConsentInput = z.infer<typeof financeConsentSchema>;
