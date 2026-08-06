'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getMonetizationCopy } from '../content';
import type { SmartMoveUrgency } from '../lib/catalog';

export type { SmartMoveUrgency } from '../lib/catalog';
export { URGENCY_OPTIONS, PROVIDER_CATEGORIES, PARTNER_PLAN_OPTIONS } from '../lib/catalog';

export type SmartMoveRequestRow = {
  id: string;
  client_id: string;
  contract_id: string | null;
  property_id: string | null;
  urgency_band: SmartMoveUrgency;
  target_exit_on: string;
  status: string;
  preferences: Record<string, unknown>;
  kai_notes: string | null;
  partner_notified_at: string | null;
  agent_task_created_at: string | null;
  matched_property_id: string | null;
  created_at: string;
};

export type ServiceProviderRow = {
  id: string;
  business_name: string;
  category: string;
  description: string | null;
  phone: string | null;
  province: string | null;
  municipality: string | null;
  take_rate_code: string | null;
  rating: number | null;
  active: boolean;
  is_demo: boolean;
};

export type ServiceOrderRow = {
  id: string;
  client_id: string;
  provider_id: string;
  category: string;
  title: string;
  description: string | null;
  status: string;
  amount_aoa: number | null;
  commission_aoa: number | null;
  created_at: string;
  service_providers?: { business_name: string } | { business_name: string }[] | null;
};

export type PartnerPlanRow = {
  id: string;
  partner_id: string;
  product_code: string;
  status: string;
  started_at: string;
  renews_at: string | null;
};

export type FeatureFlagRow = {
  code: string;
  label: string;
  description: string | null;
  enabled: boolean;
  updated_at: string;
};

export type PaymentReminderRow = {
  id: string;
  contract_payment_id: string;
  channel: string;
  offset_label: string;
  status: string;
  scheduled_for: string;
  sent_at: string | null;
};

function copy() {
  const monetization = getMonetizationCopy(resolveUiLocale());
  return {
    loadError: monetization.common.loadError,
    actionError: monetization.common.actionError,
  };
}

export async function listSmartMoveRequests(): Promise<
  { ok: true; data: SmartMoveRequestRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('smart_move_requests')
      .select(
        'id,client_id,contract_id,property_id,urgency_band,target_exit_on,status,preferences,kai_notes,partner_notified_at,agent_task_created_at,matched_property_id,created_at',
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as SmartMoveRequestRow[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function createSmartMoveRequest(input: {
  urgencyBand: SmartMoveUrgency;
  targetExitOn: string;
  contractId?: string | null;
  preferences?: Record<string, unknown>;
}): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('create_smart_move_request', {
      p_urgency_band: input.urgencyBand,
      p_target_exit_on: input.targetExitOn,
      p_contract_id: input.contractId ?? null,
      p_preferences: input.preferences ?? {},
    });
    if (error || !data) return { ok: false, message: error?.message || copy().actionError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy().actionError };
  }
}

export async function listServiceProviders(
  category?: string,
): Promise<{ ok: true; data: ServiceProviderRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    let q = client
      .from('service_providers')
      .select(
        'id,business_name,category,description,phone,province,municipality,take_rate_code,rating,active,is_demo',
      )
      .is('deleted_at', null)
      .eq('active', true)
      .order('rating', { ascending: false });
    if (category && category !== 'all') q = q.eq('category', category);
    const { data, error } = await q.limit(50);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as ServiceProviderRow[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function listServiceOrders(): Promise<
  { ok: true; data: ServiceOrderRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('service_orders')
      .select(
        'id,client_id,provider_id,category,title,description,status,amount_aoa,commission_aoa,created_at,service_providers(business_name)',
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as ServiceOrderRow[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function createServiceOrder(input: {
  providerId: string;
  title: string;
  category: string;
  description?: string;
  propertyId?: string | null;
  amountAoa?: number | null;
}): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('create_service_order', {
      p_provider_id: input.providerId,
      p_title: input.title,
      p_category: input.category,
      p_description: input.description ?? null,
      p_property_id: input.propertyId ?? null,
      p_amount_aoa: input.amountAoa ?? null,
    });
    if (error || !data) return { ok: false, message: error?.message || copy().actionError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy().actionError };
  }
}

export async function listPartnerPlans(): Promise<
  { ok: true; data: PartnerPlanRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('partner_plan_subscriptions')
      .select('id,partner_id,product_code,status,started_at,renews_at')
      .order('started_at', { ascending: false });
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as PartnerPlanRow[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function activatePartnerPlan(
  productCode: string,
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('activate_partner_plan', {
      p_product_code: productCode,
    });
    if (error || !data) return { ok: false, message: error?.message || copy().actionError };
    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, message: copy().actionError };
  }
}

export async function listFeatureFlags(): Promise<
  { ok: true; data: FeatureFlagRow[] } | { ok: false; message: string }
> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('platform_feature_flags')
      .select('code,label,description,enabled,updated_at')
      .order('code');
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as FeatureFlagRow[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function setFeatureFlag(
  code: string,
  enabled: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('set_feature_flag', {
      p_code: code,
      p_enabled: enabled,
    });
    if (error) return { ok: false, message: error.message || copy().actionError };
    return { ok: true };
  } catch {
    return { ok: false, message: copy().actionError };
  }
}

export async function listPaymentReminders(
  limit = 20,
): Promise<{ ok: true; data: PaymentReminderRow[] } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('payment_reminders')
      .select('id,contract_payment_id,channel,offset_label,status,scheduled_for,sent_at')
      .order('scheduled_for', { ascending: true })
      .limit(limit);
    if (error) return { ok: false, message: error.message || copy().loadError };
    return { ok: true, data: (data ?? []) as PaymentReminderRow[] };
  } catch {
    return { ok: false, message: copy().loadError };
  }
}

export async function scheduleRentReminders(
  contractPaymentId: string,
): Promise<{ ok: true; count: number } | { ok: false; message: string }> {
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('schedule_rent_reminders', {
      p_contract_payment_id: contractPaymentId,
    });
    if (error) return { ok: false, message: error.message || copy().actionError };
    return { ok: true, count: Number(data ?? 0) };
  } catch {
    return { ok: false, message: copy().actionError };
  }
}
