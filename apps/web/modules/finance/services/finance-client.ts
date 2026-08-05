'use client';

import {
  financeCaptureSchema,
  financeGrantCreditsSchema,
  financeQuoteSchema,
  financeSandboxPaymentSchema,
  financeUpdatePriceRuleSchema,
  type FinanceCaptureInput,
  type FinanceGrantCreditsInput,
  type FinanceQuoteInput,
  type FinanceSandboxPaymentInput,
  type FinanceUpdatePriceRuleInput,
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
