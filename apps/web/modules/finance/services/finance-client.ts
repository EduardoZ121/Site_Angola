'use client';

import {
  financeCaptureSchema,
  financeCreateExportSchema,
  financeCreateRefundSchema,
  financeFlagFraudSchema,
  financeGrantCreditsSchema,
  financeInvoicePdfSchema,
  financeMarkInvoiceEmailedSchema,
  financeOpenDisputeSchema,
  financeQuoteSchema,
  financeRedeemCreditsSchema,
  financeResolveFraudSchema,
  financeRunReconciliationSchema,
  financeSandboxPaymentSchema,
  financeSetCommissionSchema,
  financeUpdatePriceRuleSchema,
  financeUpsertCrmAccountSchema,
  financeUpsertKaiRuleSchema,
  financeUpsertProductSchema,
  type FinanceCaptureInput,
  type FinanceCreateExportInput,
  type FinanceCreateRefundInput,
  type FinanceFlagFraudInput,
  type FinanceGrantCreditsInput,
  type FinanceInvoicePdfInput,
  type FinanceMarkInvoiceEmailedInput,
  type FinanceOpenDisputeInput,
  type FinanceQuoteInput,
  type FinanceRedeemCreditsInput,
  type FinanceResolveFraudInput,
  type FinanceRunReconciliationInput,
  type FinanceSandboxPaymentInput,
  type FinanceSetCommissionInput,
  type FinanceUpdatePriceRuleInput,
  type FinanceUpsertCrmAccountInput,
  type FinanceUpsertKaiRuleInput,
  type FinanceUpsertProductInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { formatAoaAmount } from '../lib/format';

export { formatAoaAmount };

export type FinanceProductRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  pricing_model: string;
  currency: string;
  country_code: string;
  kai_suggestible: boolean;
  active: boolean;
};

export type FinancePriceRuleRow = {
  id: string;
  product_id: string;
  code: string;
  label: string;
  amount: number | null;
  percentage: number | null;
  currency: string;
  urgency_band: string | null;
  charge_event: string;
  priority: number;
  active: boolean;
};

export type FinanceLedgerRow = {
  id: string;
  entry_type: string;
  status: string;
  currency: string;
  amount: number;
  description: string | null;
  gateway_code: string | null;
  custody_mode: string;
  created_at: string;
  payer_id: string | null;
};

export type FinanceGatewayRow = {
  id: string;
  code: string;
  name: string;
  sandbox: boolean;
  active: boolean;
  supports_split: boolean;
  country_codes: string[];
};

export type FinanceInvoiceRow = {
  id: string;
  number: string;
  status: string;
  currency: string;
  total: number;
  issued_at: string;
  user_id: string;
  pdf_generated_at?: string | null;
  email_sent_at?: string | null;
  email_to?: string | null;
};

export type FinanceCommissionRow = {
  id: string;
  code: string;
  label: string;
  category: string;
  take_rate_pct: number | null;
  fixed_amount: number | null;
  payer_side: string;
  active: boolean;
};

export type FinanceCampaignRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_pct: number | null;
  discount_amount: number | null;
  credit_grant: number | null;
  product_codes: string[];
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export type FinanceConsentScope =
  | 'kai_suggestions'
  | 'partner_offers'
  | 'provider_offers'
  | 'insurance'
  | 'telecom'
  | 'analytics_share';

export type FinanceConsentRow = {
  id: string;
  scope: FinanceConsentScope;
  granted: boolean;
  granted_at: string | null;
  revoked_at: string | null;
};

export const CONSENT_SCOPES: { scope: FinanceConsentScope; label: string }[] = [
  { scope: 'kai_suggestions', label: 'Sugestões KAI comerciais' },
  { scope: 'partner_offers', label: 'Ofertas de parceiros' },
  { scope: 'provider_offers', label: 'Ofertas de prestadores' },
  { scope: 'insurance', label: 'Seguros' },
  { scope: 'telecom', label: 'Telecom / internet' },
  { scope: 'analytics_share', label: 'Analytics agregados' },
];

export type RevenueSnapshot = {
  capturedCharges: number;
  pendingCharges: number;
  commissions: number;
  creditsGranted: number;
  refunds: number;
  openDisputes: number;
  openFraud: number;
  crmAccounts: number;
  kaiRules: number;
  paymentIntents: number;
  invoices: number;
  activeProducts: number;
  sandboxGateways: number;
  currency: string;
  custodyMode: string;
};

const copy = {
  loadError: 'Não foi possível carregar dados financeiros.',
  saveError: 'Não foi possível guardar.',
  forbidden: 'Sem permissão financeira.',
  quoteError: 'Não foi possível cotar o produto.',
  payError: 'Não foi possível criar o pagamento.',
};

export async function fetchRevenueSnapshot(): Promise<
  { ok: true; data: RevenueSnapshot } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_revenue_snapshot');
    if (error || !data) {
      if (error?.message?.toLowerCase().includes('finance')) {
        return { ok: false, message: copy.forbidden };
      }
      return { ok: false, message: copy.loadError };
    }
    const raw = data as Record<string, unknown>;
    return {
      ok: true,
      data: {
        capturedCharges: Number(raw.capturedCharges ?? 0),
        pendingCharges: Number(raw.pendingCharges ?? 0),
        commissions: Number(raw.commissions ?? 0),
        creditsGranted: Number(raw.creditsGranted ?? 0),
        refunds: Number(raw.refunds ?? 0),
        openDisputes: Number(raw.openDisputes ?? 0),
        openFraud: Number(raw.openFraud ?? 0),
        crmAccounts: Number(raw.crmAccounts ?? 0),
        kaiRules: Number(raw.kaiRules ?? 0),
        paymentIntents: Number(raw.paymentIntents ?? 0),
        invoices: Number(raw.invoices ?? 0),
        activeProducts: Number(raw.activeProducts ?? 0),
        sandboxGateways: Number(raw.sandboxGateways ?? 0),
        currency: String(raw.currency ?? 'AOA'),
        custodyMode: String(raw.custodyMode ?? 'none'),
      },
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listFinanceProducts(): Promise<
  { ok: true; data: FinanceProductRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_products')
      .select(
        'id, code, name, description, category, pricing_model, currency, country_code, kai_suggestible, active',
      )
      .is('deleted_at', null)
      .order('category')
      .order('code');
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceProductRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listPriceRules(): Promise<
  { ok: true; data: FinancePriceRuleRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_price_rules')
      .select(
        'id, product_id, code, label, amount, percentage, currency, urgency_band, charge_event, priority, active',
      )
      .is('deleted_at', null)
      .order('priority');
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinancePriceRuleRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function updatePriceRule(
  input: FinanceUpdatePriceRuleInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = financeUpdatePriceRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const patch: Record<string, unknown> = {};
    if (parsed.data.amount != null) patch.amount = parsed.data.amount;
    if (parsed.data.percentage !== undefined) patch.percentage = parsed.data.percentage;
    if (parsed.data.active != null) patch.active = parsed.data.active;
    if (parsed.data.label) patch.label = parsed.data.label;
    const { error } = await client
      .from('finance_price_rules')
      .update(patch)
      .eq('id', parsed.data.id);
    if (error) return { ok: false, message: copy.forbidden };
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listLedgerEntries(
  limit = 50,
): Promise<{ ok: true; data: FinanceLedgerRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_ledger_entries')
      .select(
        'id, entry_type, status, currency, amount, description, gateway_code, custody_mode, created_at, payer_id',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceLedgerRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listGateways(): Promise<
  { ok: true; data: FinanceGatewayRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_gateways')
      .select('id, code, name, sandbox, active, supports_split, country_codes')
      .is('deleted_at', null)
      .order('code');
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceGatewayRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listCommissions(): Promise<
  { ok: true; data: FinanceCommissionRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_commission_rules')
      .select('id, code, label, category, take_rate_pct, fixed_amount, payer_side, active')
      .is('deleted_at', null)
      .order('category');
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceCommissionRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listInvoices(
  limit = 30,
): Promise<{ ok: true; data: FinanceInvoiceRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_invoices')
      .select('id, number, status, currency, total, issued_at, user_id')
      .order('issued_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceInvoiceRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function quoteProduct(
  input: FinanceQuoteInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.quoteError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_quote_price', {
      p_product_code: parsed.data.productCode,
      p_urgency_band: parsed.data.urgencyBand ?? null,
      p_country_code: parsed.data.countryCode ?? 'AO',
      p_currency: parsed.data.currency ?? 'AOA',
    });
    if (error || !data) return { ok: false, message: copy.quoteError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.quoteError };
  }
}

export async function createSandboxPayment(
  input: FinanceSandboxPaymentInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeSandboxPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.payError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_create_sandbox_payment', {
      p_product_code: parsed.data.productCode,
      p_urgency_band: parsed.data.urgencyBand ?? null,
      p_gateway_code: parsed.data.gatewayCode ?? 'sandbox',
      p_description: parsed.data.description ?? null,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.payError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.payError };
  }
}

export async function captureSandboxPayment(
  input: FinanceCaptureInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeCaptureSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.payError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_capture_sandbox_payment', {
      p_intent_id: parsed.data.paymentIntentId,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.payError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.payError };
  }
}

export async function grantCredits(
  input: FinanceGrantCreditsInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeGrantCreditsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_grant_credits', {
      p_user_id: parsed.data.userId,
      p_amount: parsed.data.amount,
      p_reason: parsed.data.reason ?? null,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.forbidden };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listCampaigns(): Promise<
  { ok: true; data: FinanceCampaignRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_campaigns')
      .select(
        'id, code, name, description, discount_pct, discount_amount, credit_grant, product_codes, active, starts_at, ends_at',
      )
      .is('deleted_at', null)
      .order('code');
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceCampaignRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function setCampaignActive(
  id: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { error } = await client.from('finance_campaigns').update({ active }).eq('id', id);
    if (error) return { ok: false, message: error.message || copy.forbidden };
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listMyConsents(): Promise<
  { ok: true; data: FinanceConsentRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_commercial_consents')
      .select('id, scope, granted, granted_at, revoked_at')
      .order('scope');
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceConsentRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function upsertConsent(
  scope: FinanceConsentScope,
  granted: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { ok: false, message: copy.forbidden };
    const now = new Date().toISOString();
    const { error } = await client.from('finance_commercial_consents').upsert(
      {
        user_id: user.id,
        scope,
        granted,
        granted_at: granted ? now : null,
        revoked_at: granted ? null : now,
        updated_at: now,
      },
      { onConflict: 'user_id,scope' },
    );
    if (error) return { ok: false, message: error.message || copy.saveError };
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

// ─── Fase A — infraestrutura financeira transversal ─────────────────────────

export type FinanceRefundRow = {
  id: string;
  ledger_entry_id: string;
  user_id: string;
  amount: number;
  currency: string;
  mode: string;
  status: string;
  reason: string;
  created_at: string;
  resolved_at: string | null;
};

export type FinanceDisputeRow = {
  id: string;
  code: string;
  ledger_entry_id: string | null;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  opened_at: string;
  closed_at: string | null;
};

export type FinanceReconRunRow = {
  id: string;
  code: string;
  period_start: string;
  period_end: string;
  gateway_code: string | null;
  status: string;
  matched_count: number;
  unmatched_count: number;
  total_amount: number;
  created_at: string;
};

export type FinanceFraudFlagRow = {
  id: string;
  code: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  severity: string;
  status: string;
  reason: string;
  opened_at: string;
  resolved_at: string | null;
};

export type FinanceKaiRuleRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  trigger_event: string;
  target_product_code: string | null;
  target_segment: string | null;
  consent_scope: string | null;
  priority: number;
  active: boolean;
};

export type FinanceCrmAccountRow = {
  id: string;
  code: string;
  name: string;
  account_type: string;
  service_provider_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: string;
  created_at: string;
};

export type FinanceExportRow = {
  id: string;
  code: string;
  period_start: string;
  period_end: string;
  format: string;
  status: string;
  row_count: number;
  total_amount: number;
  generated_at: string | null;
  created_at: string;
};

export type CreditBalance = { balance: number; currency: string };

export async function fetchMyCreditBalance(): Promise<
  { ok: true; data: CreditBalance } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_my_credit_balance');
    if (error || !data) return { ok: false, message: copy.loadError };
    const raw = data as Record<string, unknown>;
    return {
      ok: true,
      data: { balance: Number(raw.balance ?? 0), currency: String(raw.currency ?? 'AOA') },
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function redeemCredits(
  input: FinanceRedeemCreditsInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeRedeemCreditsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_redeem_credits', {
      p_amount: parsed.data.amount,
      p_reason: parsed.data.reason ?? null,
      p_order_ref: parsed.data.orderRef ?? null,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listRefunds(
  limit = 30,
): Promise<{ ok: true; data: FinanceRefundRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_refunds')
      .select(
        'id, ledger_entry_id, user_id, amount, currency, mode, status, reason, created_at, resolved_at',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceRefundRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function createRefund(
  input: FinanceCreateRefundInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeCreateRefundSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_create_refund', {
      p_ledger_entry_id: parsed.data.ledgerEntryId,
      p_amount: parsed.data.amount,
      p_reason: parsed.data.reason,
      p_mode: parsed.data.mode,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listDisputes(
  limit = 30,
): Promise<{ ok: true; data: FinanceDisputeRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_disputes')
      .select(
        'id, code, ledger_entry_id, user_id, amount, currency, status, reason, opened_at, closed_at',
      )
      .order('opened_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceDisputeRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function openDispute(
  input: FinanceOpenDisputeInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeOpenDisputeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_open_dispute', {
      p_ledger_entry_id: parsed.data.ledgerEntryId,
      p_reason: parsed.data.reason,
      p_amount: parsed.data.amount ?? null,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listReconciliationRuns(
  limit = 20,
): Promise<{ ok: true; data: FinanceReconRunRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_reconciliation_runs')
      .select(
        'id, code, period_start, period_end, gateway_code, status, matched_count, unmatched_count, total_amount, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceReconRunRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function runReconciliation(
  input: FinanceRunReconciliationInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeRunReconciliationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_run_reconciliation', {
      p_period_start: parsed.data.periodStart,
      p_period_end: parsed.data.periodEnd,
      p_gateway_code: parsed.data.gatewayCode ?? null,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function generateInvoicePdf(
  input: FinanceInvoicePdfInput,
): Promise<{ ok: true; data: { html: string; number: string } } | { ok: false; message: string }> {
  const parsed = financeInvoicePdfSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_generate_invoice_pdf', {
      p_invoice_id: parsed.data.invoiceId,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    const raw = data as Record<string, unknown>;
    return {
      ok: true,
      data: { html: String(raw.html ?? ''), number: String(raw.number ?? '') },
    };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function markInvoiceEmailed(
  input: FinanceMarkInvoiceEmailedInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = financeMarkInvoiceEmailedSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('finance_mark_invoice_emailed', {
      p_invoice_id: parsed.data.invoiceId,
      p_email: parsed.data.email,
    });
    if (error) return { ok: false, message: error.message || copy.saveError };
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function upsertProduct(
  input: FinanceUpsertProductInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeUpsertProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_upsert_product', {
      p_code: parsed.data.code,
      p_name: parsed.data.name,
      p_category: parsed.data.category,
      p_pricing_model: parsed.data.pricingModel,
      p_description: parsed.data.description ?? null,
      p_currency: parsed.data.currency,
      p_buyer_roles: parsed.data.buyerRoles,
      p_kai_suggestible: parsed.data.kaiSuggestible,
      p_active: parsed.data.active,
      p_amount: parsed.data.amount ?? null,
      p_price_code: parsed.data.priceCode ?? null,
      p_charge_event: parsed.data.chargeEvent,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function setCommission(
  input: FinanceSetCommissionInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeSetCommissionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_set_commission', {
      p_code: parsed.data.code,
      p_label: parsed.data.label,
      p_category: parsed.data.category,
      p_take_rate_pct: parsed.data.takeRatePct ?? null,
      p_fixed_amount: parsed.data.fixedAmount ?? null,
      p_payer_side: parsed.data.payerSide,
      p_currency: parsed.data.currency,
      p_active: parsed.data.active,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listKaiRules(): Promise<
  { ok: true; data: FinanceKaiRuleRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_kai_rules')
      .select(
        'id, code, label, description, trigger_event, target_product_code, target_segment, consent_scope, priority, active',
      )
      .is('deleted_at', null)
      .order('priority');
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceKaiRuleRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function upsertKaiRule(
  input: FinanceUpsertKaiRuleInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeUpsertKaiRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_upsert_kai_rule', {
      p_code: parsed.data.code,
      p_label: parsed.data.label,
      p_trigger_event: parsed.data.triggerEvent,
      p_target_product_code: parsed.data.targetProductCode ?? null,
      p_description: parsed.data.description ?? null,
      p_target_segment: parsed.data.targetSegment ?? null,
      p_consent_scope: parsed.data.consentScope ?? null,
      p_priority: parsed.data.priority,
      p_active: parsed.data.active,
      p_config: {},
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listFraudFlags(
  limit = 30,
): Promise<{ ok: true; data: FinanceFraudFlagRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_fraud_flags')
      .select(
        'id, code, entity_type, entity_id, user_id, severity, status, reason, opened_at, resolved_at',
      )
      .order('opened_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceFraudFlagRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function flagFraud(
  input: FinanceFlagFraudInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeFlagFraudSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_flag_fraud', {
      p_entity_type: parsed.data.entityType,
      p_entity_id: parsed.data.entityId ?? null,
      p_reason: parsed.data.reason,
      p_severity: parsed.data.severity,
      p_user_id: parsed.data.userId ?? null,
      p_signals: {},
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function resolveFraud(
  input: FinanceResolveFraudInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = financeResolveFraudSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('finance_resolve_fraud', {
      p_flag_id: parsed.data.flagId,
      p_status: parsed.data.status,
      p_notes: parsed.data.notes ?? null,
    });
    if (error) return { ok: false, message: error.message || copy.saveError };
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listCrmAccounts(
  limit = 60,
): Promise<{ ok: true; data: FinanceCrmAccountRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_crm_accounts')
      .select(
        'id, code, name, account_type, service_provider_id, contact_email, contact_phone, status, created_at',
      )
      .is('deleted_at', null)
      .order('account_type')
      .order('name')
      .limit(limit);
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceCrmAccountRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function upsertCrmAccount(
  input: FinanceUpsertCrmAccountInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeUpsertCrmAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_upsert_crm_account', {
      p_code: parsed.data.code,
      p_name: parsed.data.name,
      p_account_type: parsed.data.accountType,
      p_service_provider_id: parsed.data.serviceProviderId ?? null,
      p_user_id: parsed.data.userId ?? null,
      p_contact_email: parsed.data.contactEmail ?? null,
      p_contact_phone: parsed.data.contactPhone ?? null,
      p_status: parsed.data.status,
      p_metadata: {},
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function listAccountingExports(
  limit = 20,
): Promise<{ ok: true; data: FinanceExportRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('finance_accounting_exports')
      .select(
        'id, code, period_start, period_end, format, status, row_count, total_amount, generated_at, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as FinanceExportRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function createAccountingExport(
  input: FinanceCreateExportInput,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  const parsed = financeCreateExportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('finance_create_accounting_export', {
      p_period_start: parsed.data.periodStart,
      p_period_end: parsed.data.periodEnd,
      p_format: parsed.data.format,
    });
    if (error || !data) return { ok: false, message: error?.message ?? copy.saveError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}
