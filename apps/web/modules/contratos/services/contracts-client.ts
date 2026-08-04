'use client';

import {
  contractTransitionSchema,
  createPropertyContractSchema,
  type ContractTransitionInput,
  type CreatePropertyContractInput,
} from '@kuteka/validation';
import { createBrowserClient } from '@/lib/supabase/client';
import { getContratosCopy } from '../content/pt';

export type ContractPropertySummary = {
  id: string;
  code: string;
  title: string;
  cover_image_url: string | null;
};

export type ContractRow = {
  id: string;
  code: string;
  property_id: string;
  client_id: string;
  partner_id: string;
  agent_id: string | null;
  interest_id: string | null;
  purpose: string;
  status: string;
  amount_aoa: number;
  currency: string;
  title: string;
  terms_notes: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
  properties?: ContractPropertySummary | ContractPropertySummary[] | null;
};

export type ContractPropertyOption = {
  id: string;
  code: string;
  title: string;
  purpose: string;
  price_aoa: number | null;
};

const CONTRACT_SELECT =
  'id, code, property_id, client_id, partner_id, agent_id, interest_id, purpose, status, amount_aoa, currency, title, terms_notes, is_demo, created_at, updated_at, properties(id, code, title, cover_image_url)';

function contractMessage(errorMessage: string | undefined, fallback: string) {
  const msg = errorMessage?.toLowerCase() ?? '';
  if (msg.includes('contracts.manage') || msg.includes('policy') || msg.includes('42501')) {
    return getContratosCopy().forbidden;
  }
  if (msg.includes('kyc') || msg.includes('identity verification')) {
    return getContratosCopy().kycRequired;
  }
  return fallback;
}

export function getContractProperty(row: ContractRow): ContractPropertySummary | null {
  const nested = row.properties;
  if (Array.isArray(nested)) return nested[0] ?? null;
  return nested ?? null;
}

export async function listContracts(): Promise<
  { ok: true; data: ContractRow[] } | { ok: false; message: string }
> {
  const copy = getContratosCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('property_contracts')
      .select(CONTRACT_SELECT)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return { ok: false, message: contractMessage(error.message, copy.loadError) };
    return { ok: true, data: (data as ContractRow[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function getContract(
  id: string,
): Promise<{ ok: true; data: ContractRow } | { ok: false; message: string }> {
  const copy = getContratosCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('property_contracts')
      .select(CONTRACT_SELECT)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: contractMessage(error?.message, copy.loadError) };
    }
    return { ok: true, data: data as ContractRow };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listContractProperties(): Promise<
  { ok: true; data: ContractPropertyOption[] } | { ok: false; message: string }
> {
  const copy = getContratosCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client
      .from('properties')
      .select('id, code, title, purpose, price_aoa')
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return { ok: false, message: copy.loadError };
    return { ok: true, data: (data as ContractPropertyOption[]) ?? [] };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function createPropertyContract(
  input: CreatePropertyContractInput,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const copy = getContratosCopy();
  const parsed = createPropertyContractSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }

  try {
    const client = createBrowserClient();
    const v = parsed.data;
    const { data, error } = await client.rpc('create_property_contract', {
      p_property_id: v.propertyId,
      p_client_id: v.clientId,
      p_purpose: v.purpose,
      p_amount_aoa: v.amountAoa,
      p_title: v.title,
      p_terms_notes: v.termsNotes?.trim() || null,
      p_agent_id: v.agentId || null,
      p_interest_id: v.interestId || null,
    });

    if (error || typeof data !== 'string') {
      return { ok: false, message: contractMessage(error?.message, copy.saveError) };
    }
    return { ok: true, id: data };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

async function transitionContract(
  input: ContractTransitionInput,
  rpcName: 'accept_property_contract' | 'cancel_property_contract' | 'complete_property_contract',
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getContratosCopy();
  const parsed = contractTransitionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.transitionError };
  }

  try {
    const client = createBrowserClient();
    const { error } = await client.rpc(rpcName, {
      p_contract_id: parsed.data.contractId,
    });

    if (error) return { ok: false, message: contractMessage(error.message, copy.transitionError) };
    return { ok: true };
  } catch {
    return { ok: false, message: copy.transitionError };
  }
}

export function acceptPropertyContract(input: ContractTransitionInput) {
  return transitionContract(input, 'accept_property_contract');
}

export function cancelPropertyContract(input: ContractTransitionInput) {
  return transitionContract(input, 'cancel_property_contract');
}

export function completePropertyContract(input: ContractTransitionInput) {
  return transitionContract(input, 'complete_property_contract');
}
