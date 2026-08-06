'use client';

import { createBrowserClient } from '@/lib/supabase/client';
import { resolveUiLocale } from '@/modules/i18n/resolve-locale';
import { getConfiancaCopy } from '../content';

export type PropertyTrustSummary = {
  propertyId: string;
  kutekaScore: number | null;
  ratingAvg: number | null;
  ratingCount: number;
  contractsCompleted: number;
  lastReviewAt: string | null;
};

export type UserTrustSummary = {
  userId: string;
  displayName: string | null;
  trustIndex: number | null;
  ickScore: number | null;
  kycLevel: number | null;
  memberSince: string | null;
  lastActivityAt: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  contractsCompleted: number;
};

type RpcPropertySummaryRow = {
  propertyId?: string;
  kutekaScore?: number | string | null;
  ratingAvg?: number | string | null;
  ratingCount?: number | string | null;
  contractsCompleted?: number | string | null;
  lastReviewAt?: string | null;
};

type RpcUserSummaryRow = {
  userId?: string;
  displayName?: string | null;
  trustIndex?: number | string | null;
  ickScore?: number | string | null;
  kycLevel?: number | string | null;
  memberSince?: string | null;
  lastActivityAt?: string | null;
  ratingAvg?: number | string | null;
  ratingCount?: number | string | null;
  contractsCompleted?: number | string | null;
};

function toNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Property reputation summary — avg/count of property-level reviews,
 * contracts completed and the Kuteka Index. Prefers the SECURITY DEFINER
 * RPC (works for any active property regardless of ownership); falls back
 * to direct table reads (best-effort, respects RLS) when the RPC is not
 * yet deployed.
 */
export async function loadPropertyTrustSummary(
  propertyId: string,
): Promise<{ ok: true; data: PropertyTrustSummary } | { ok: false; message: string }> {
  const copy = getConfiancaCopy(resolveUiLocale());
  if (!propertyId) return { ok: false, message: copy.loadError };

  try {
    const client = createBrowserClient();
    const rpc = await client.rpc('get_property_trust_summary', { p_property_id: propertyId });
    if (!rpc.error && rpc.data) {
      const row = rpc.data as RpcPropertySummaryRow;
      return {
        ok: true,
        data: {
          propertyId,
          kutekaScore: toNumberOrNull(row.kutekaScore),
          ratingAvg: toNumberOrNull(row.ratingAvg),
          ratingCount: toNumberOrNull(row.ratingCount) ?? 0,
          contractsCompleted: toNumberOrNull(row.contractsCompleted) ?? 0,
          lastReviewAt: row.lastReviewAt ?? null,
        },
      };
    }

    // Fallback — best-effort direct reads (subject to RLS on each table).
    const [propertyRes, reviewsRes, contractsRes] = await Promise.all([
      client.from('properties').select('kuteka_score').eq('id', propertyId).maybeSingle(),
      client
        .from('contract_reviews')
        .select('rating, created_at')
        .eq('property_id', propertyId)
        .eq('subject_kind', 'property'),
      client
        .from('property_contracts')
        .select('id')
        .eq('property_id', propertyId)
        .eq('status', 'completed')
        .is('deleted_at', null),
    ]);

    const reviews = (reviewsRes.data as { rating: number; created_at: string }[] | null) ?? [];
    const ratingAvg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
        : null;
    const lastReviewAt = reviews.reduce<string | null>((latest, r) => {
      if (!latest) return r.created_at;
      return new Date(r.created_at) > new Date(latest) ? r.created_at : latest;
    }, null);

    return {
      ok: true,
      data: {
        propertyId,
        kutekaScore: toNumberOrNull(
          (propertyRes.data as { kuteka_score?: number | null } | null)?.kuteka_score,
        ),
        ratingAvg,
        ratingCount: reviews.length,
        contractsCompleted: (contractsRes.data as { id: string }[] | null)?.length ?? 0,
        lastReviewAt,
      },
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

/**
 * User (owner / agent / client) reputation summary — trust index, ICK,
 * KYC/KIS level and review stats. Uses the SECURITY DEFINER RPC so it works
 * for any user id (profiles select is otherwise self-only); falls back to a
 * self-only direct read when the RPC is unavailable.
 */
export async function loadUserTrustSummary(
  userId: string,
): Promise<{ ok: true; data: UserTrustSummary } | { ok: false; message: string }> {
  const copy = getConfiancaCopy(resolveUiLocale());
  if (!userId) return { ok: false, message: copy.loadError };

  try {
    const client = createBrowserClient();
    const rpc = await client.rpc('get_user_trust_summary', { p_user_id: userId });
    if (!rpc.error && rpc.data) {
      const row = rpc.data as RpcUserSummaryRow;
      return {
        ok: true,
        data: {
          userId,
          displayName: row.displayName ?? null,
          trustIndex: toNumberOrNull(row.trustIndex),
          ickScore: toNumberOrNull(row.ickScore),
          kycLevel: toNumberOrNull(row.kycLevel),
          memberSince: row.memberSince ?? null,
          lastActivityAt: row.lastActivityAt ?? null,
          ratingAvg: toNumberOrNull(row.ratingAvg),
          ratingCount: toNumberOrNull(row.ratingCount) ?? 0,
          contractsCompleted: toNumberOrNull(row.contractsCompleted) ?? 0,
        },
      };
    }

    // Fallback — only works when userId is the signed-in user (RLS self-only).
    const [profileRes, reviewsRes, contractsRes] = await Promise.all([
      client
        .from('profiles')
        .select('display_name, trust_index, ick_score, kyc_level, created_at, updated_at')
        .eq('id', userId)
        .maybeSingle(),
      client.from('contract_reviews').select('rating').eq('subject_user_id', userId),
      client
        .from('property_contracts')
        .select('id')
        .eq('status', 'completed')
        .is('deleted_at', null)
        .or(`client_id.eq.${userId},partner_id.eq.${userId},agent_id.eq.${userId}`),
    ]);

    if (!profileRes.data) return { ok: false, message: copy.loadError };
    const profile = profileRes.data as {
      display_name: string | null;
      trust_index: number | null;
      ick_score: number | null;
      kyc_level: number | null;
      created_at: string | null;
      updated_at: string | null;
    };
    const reviews = (reviewsRes.data as { rating: number }[] | null) ?? [];
    const ratingAvg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
        : null;

    return {
      ok: true,
      data: {
        userId,
        displayName: profile.display_name,
        trustIndex: toNumberOrNull(profile.trust_index),
        ickScore: toNumberOrNull(profile.ick_score),
        kycLevel: toNumberOrNull(profile.kyc_level),
        memberSince: profile.created_at,
        lastActivityAt: profile.updated_at,
        ratingAvg,
        ratingCount: reviews.length,
        contractsCompleted: (contractsRes.data as { id: string }[] | null)?.length ?? 0,
      },
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}
