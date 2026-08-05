'use client';

import {
  identityAddressSchema,
  identityBankingSchema,
  identityContactsSchema,
  identityIdDocumentSchema,
  identityPersonalSchema,
  type IdentityAddressInput,
  type IdentityBankingInput,
  type IdentityContactsInput,
  type IdentityIdDocumentInput,
  type IdentityPersonalInput,
} from '@kuteka/validation';
import type { IdentityPartySnapshot } from '@kuteka/types';
import { writeAuditLog } from '@kuteka/database';
import { createBrowserClient } from '@/lib/supabase/client';
import { compressImageFile } from '@/lib/media/compress-image';
import { getIdentidadeCopy } from '../content/pt';
import type { TrustPillarStatus } from '../lib/kyc';

export type IdentityProfileRow = {
  id: string;
  display_name: string | null;
  preferred_name: string | null;
  legal_full_name: string | null;
  sex: string | null;
  birth_date: string | null;
  nationality: string | null;
  place_of_birth: string | null;
  marital_status: string | null;
  phone_primary: string | null;
  phone_secondary: string | null;
  email_secondary: string | null;
  phone_verified_at: string | null;
  avatar_url: string | null;
  selfie_url: string | null;
  kyc_level: number;
  trust_index: number;
  kis_completeness: number;
  kyc_photo_status: TrustPillarStatus;
  liveness_status: string;
  kyc_identity_status: TrustPillarStatus;
  kyc_document_status: TrustPillarStatus;
  kyc_address_status: TrustPillarStatus;
  kyc_banking_status: TrustPillarStatus;
};

export type IdentityFieldChangeRow = {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  entity_type: string;
  created_at: string;
};

export type IdentityAccessLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type IdentityAddressRow = {
  country: string;
  province: string | null;
  municipality: string | null;
  commune: string | null;
  neighborhood: string | null;
  street: string | null;
  number: string | null;
  postal_code: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  verification_status: string;
};

export type IdentityIdDocumentRow = {
  id: string;
  doc_kind: string;
  doc_number: string;
  issued_on: string | null;
  expires_on: string | null;
  issued_at: string | null;
  issuing_country: string;
  front_storage_path: string | null;
  back_storage_path: string | null;
  status: string;
  rejection_reason: string | null;
};

export type IdentityBankingRow = {
  bank_name: string | null;
  iban: string | null;
  account_number: string | null;
  account_holder_name: string | null;
  digital_wallets: string[];
  verification_status: string;
};

export type IdentityBundle = {
  profile: IdentityProfileRow;
  email: string | null;
  emailConfirmed: boolean;
  address: IdentityAddressRow | null;
  document: IdentityIdDocumentRow | null;
  banking: IdentityBankingRow | null;
};

const PROFILE_SELECT = [
  'id',
  'display_name',
  'preferred_name',
  'legal_full_name',
  'sex',
  'birth_date',
  'nationality',
  'place_of_birth',
  'marital_status',
  'phone_primary',
  'phone_secondary',
  'email_secondary',
  'phone_verified_at',
  'avatar_url',
  'selfie_url',
  'kyc_level',
  'trust_index',
  'kis_completeness',
  'kyc_photo_status',
  'liveness_status',
  'kyc_identity_status',
  'kyc_document_status',
  'kyc_address_status',
  'kyc_banking_status',
].join(', ');

function mapIdentityError(errorMessage: string | undefined, fallback: string): string {
  const msg = errorMessage?.toLowerCase() ?? '';
  if (msg.includes('identity verification') || msg.includes('kyc')) {
    return getIdentidadeCopy().kycGateBody;
  }
  return fallback;
}

async function recompute(): Promise<void> {
  const client = createBrowserClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return;
  await client.rpc('recompute_profile_kyc', { p_user_id: user.id });
}

export async function loadMyIdentity(): Promise<
  { ok: true; data: IdentityBundle } | { ok: false; message: string }
> {
  const copy = getIdentidadeCopy();
  try {
    const client = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();
    if (userError || !user) return { ok: false, message: copy.forbidden };

    const [profileRes, addrRes, docRes, bankRes] = await Promise.all([
      client.from('profiles').select(PROFILE_SELECT).eq('id', user.id).maybeSingle(),
      client
        .from('identity_addresses')
        .select(
          'country, province, municipality, commune, neighborhood, street, number, postal_code, gps_lat, gps_lng, verification_status',
        )
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle(),
      client
        .from('identity_id_documents')
        .select(
          'id, doc_kind, doc_number, issued_on, expires_on, issued_at, issuing_country, front_storage_path, back_storage_path, status, rejection_reason',
        )
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from('identity_banking')
        .select(
          'bank_name, iban, account_number, account_holder_name, digital_wallets, verification_status',
        )
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .maybeSingle(),
    ]);

    if (profileRes.error || !profileRes.data) {
      return { ok: false, message: mapIdentityError(profileRes.error?.message, copy.loadError) };
    }

    const wallets = Array.isArray(bankRes.data?.digital_wallets)
      ? (bankRes.data!.digital_wallets as string[])
      : [];

    const raw = profileRes.data as unknown as IdentityProfileRow;
    const profile: IdentityProfileRow = {
      ...raw,
      kis_completeness: Number(raw.kis_completeness ?? raw.trust_index ?? 0),
      kyc_photo_status: (raw.kyc_photo_status ??
        'missing') as IdentityProfileRow['kyc_photo_status'],
      liveness_status: raw.liveness_status ?? 'none',
      trust_index: Number(raw.trust_index ?? 0),
      kyc_level: Number(raw.kyc_level ?? 0),
    };

    return {
      ok: true,
      data: {
        profile,
        email: user.email ?? null,
        emailConfirmed: Boolean(user.email_confirmed_at),
        address: (addrRes.data as IdentityAddressRow | null) ?? null,
        document: (docRes.data as IdentityIdDocumentRow | null) ?? null,
        banking: bankRes.data
          ? ({
              ...(bankRes.data as Omit<IdentityBankingRow, 'digital_wallets'>),
              digital_wallets: wallets,
            } as IdentityBankingRow)
          : null,
      },
    };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function savePersonalIdentity(
  input: IdentityPersonalInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  const parsed = identityPersonalSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { ok: false, message: copy.forbidden };
    const v = parsed.data;
    const { error } = await client
      .from('profiles')
      .update({
        legal_full_name: v.legalFullName,
        preferred_name: v.preferredName?.trim() || null,
        display_name: v.preferredName?.trim() || v.legalFullName,
        sex: v.sex || null,
        birth_date: v.birthDate || null,
        nationality: v.nationality?.trim() || null,
        place_of_birth: v.placeOfBirth?.trim() || null,
        marital_status: v.maritalStatus || null,
        updated_by: user.id,
      })
      .eq('id', user.id);
    if (error) return { ok: false, message: mapIdentityError(error.message, copy.saveError) };
    await writeAuditLog(client, {
      action: 'identity.personal_updated',
      entityType: 'profile',
      entityId: user.id,
    }).catch(() => undefined);
    await recompute();
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function saveContacts(
  input: IdentityContactsInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  const parsed = identityContactsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { ok: false, message: copy.forbidden };
    const v = parsed.data;
    const patch: Record<string, unknown> = {
      phone_primary: v.phonePrimary?.trim() || null,
      phone_secondary: v.phoneSecondary?.trim() || null,
      email_secondary: v.emailSecondary?.trim() || null,
      updated_by: user.id,
    };
    if (v.markPhoneVerified && v.phonePrimary?.trim()) {
      patch.phone_verified_at = new Date().toISOString();
    }
    const { error } = await client.from('profiles').update(patch).eq('id', user.id);
    if (error) return { ok: false, message: mapIdentityError(error.message, copy.saveError) };
    await recompute();
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function saveAddress(
  input: IdentityAddressInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  const parsed = identityAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { ok: false, message: copy.forbidden };
    const v = parsed.data;
    const row = {
      user_id: user.id,
      country: v.country || 'AO',
      province: v.province,
      municipality: v.municipality,
      commune: v.commune?.trim() || null,
      neighborhood: v.neighborhood?.trim() || null,
      street: v.street?.trim() || null,
      number: v.number?.trim() || null,
      postal_code: v.postalCode?.trim() || null,
      gps_lat: v.gpsLat ?? null,
      gps_lng: v.gpsLng ?? null,
      verification_status: v.submitForReview ? 'submitted' : 'draft',
      updated_by: user.id,
      created_by: user.id,
      deleted_at: null,
    };
    const { error } = await client
      .from('identity_addresses')
      .upsert(row, { onConflict: 'user_id' });
    if (error) return { ok: false, message: mapIdentityError(error.message, copy.saveError) };
    if (v.submitForReview) {
      await client.from('trust_documents').insert({
        user_id: user.id,
        doc_type: 'proof_of_address',
        notes: `Morada: ${v.province}, ${v.municipality}`,
        status: 'submitted',
        created_by: user.id,
        updated_by: user.id,
      });
    }
    await recompute();
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function saveBanking(
  input: IdentityBankingInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  const parsed = identityBankingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { ok: false, message: copy.forbidden };
    const v = parsed.data;
    const { error } = await client.from('identity_banking').upsert(
      {
        user_id: user.id,
        bank_name: v.bankName?.trim() || null,
        iban: v.iban?.trim() || null,
        account_number: v.accountNumber?.trim() || null,
        account_holder_name: v.accountHolderName?.trim() || null,
        digital_wallets: v.digitalWallets ?? [],
        verification_status: v.submitForReview ? 'submitted' : 'draft',
        updated_by: user.id,
        created_by: user.id,
        deleted_at: null,
      },
      { onConflict: 'user_id' },
    );
    if (error) return { ok: false, message: mapIdentityError(error.message, copy.saveError) };
    await recompute();
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

async function uploadIdentityFile(
  userId: string,
  side: 'front' | 'back' | 'avatar' | 'selfie',
  file: File,
): Promise<{ ok: true; path: string; publicUrl?: string } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  try {
    const client = createBrowserClient();
    const compressed =
      side === 'avatar' || side === 'selfie'
        ? await compressImageFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.85 })
        : await compressImageFile(file, { maxWidth: 2000, maxHeight: 2000, quality: 0.88 });
    const ext = compressed.type === 'image/webp' ? 'webp' : 'jpg';
    if (side === 'avatar' || side === 'selfie') {
      const path = `${userId}/${side}-${crypto.randomUUID()}.${ext}`;
      const { error } = await client.storage
        .from('avatars')
        .upload(path, compressed, { contentType: compressed.type, upsert: false });
      if (error) return { ok: false, message: copy.uploadError };
      const { data } = client.storage.from('avatars').getPublicUrl(path);
      return { ok: true, path, publicUrl: data.publicUrl };
    }
    const path = `${userId}/${side}-${crypto.randomUUID()}.${ext}`;
    const { error } = await client.storage
      .from('identity-documents')
      .upload(path, compressed, { contentType: compressed.type, upsert: false });
    if (error) return { ok: false, message: copy.uploadError };
    return { ok: true, path };
  } catch {
    return { ok: false, message: copy.uploadError };
  }
}

export async function submitIdDocument(input: {
  meta: IdentityIdDocumentInput;
  front: File;
  back: File;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  const parsed = identityIdDocumentSchema.safeParse(input.meta);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? copy.saveError };
  }
  try {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { ok: false, message: copy.forbidden };

    const frontUp = await uploadIdentityFile(user.id, 'front', input.front);
    if (!frontUp.ok) return frontUp;
    const backUp = await uploadIdentityFile(user.id, 'back', input.back);
    if (!backUp.ok) return backUp;

    const v = parsed.data;
    const { data: trustRow, error: trustError } = await client
      .from('trust_documents')
      .insert({
        user_id: user.id,
        doc_type: 'identity',
        notes: `${v.docKind.toUpperCase()} ${v.docNumber}`,
        status: 'submitted',
        front_storage_path: frontUp.path,
        back_storage_path: backUp.path,
        created_by: user.id,
        updated_by: user.id,
      })
      .select('id')
      .single();
    if (trustError || !trustRow) return { ok: false, message: copy.saveError };

    const { error } = await client.from('identity_id_documents').insert({
      user_id: user.id,
      doc_kind: v.docKind,
      doc_number: v.docNumber,
      issued_on: v.issuedOn || null,
      expires_on: v.expiresOn || null,
      issued_at: v.issuedAt?.trim() || null,
      issuing_country: v.issuingCountry || 'AO',
      front_storage_path: frontUp.path,
      back_storage_path: backUp.path,
      status: 'submitted',
      trust_document_id: trustRow.id,
      created_by: user.id,
      updated_by: user.id,
    });
    if (error) return { ok: false, message: copy.saveError };

    await writeAuditLog(client, {
      action: 'identity.document_submitted',
      entityType: 'identity_id_document',
      entityId: trustRow.id,
      metadata: { doc_kind: v.docKind },
    }).catch(() => undefined);

    await recompute();
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}

export async function uploadAvatarOrSelfie(
  kind: 'avatar' | 'selfie',
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  try {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { ok: false, message: copy.forbidden };
    const up = await uploadIdentityFile(user.id, kind, file);
    if (!up.ok || !up.publicUrl) return { ok: false, message: copy.uploadError };
    const patch = kind === 'avatar' ? { avatar_url: up.publicUrl } : { selfie_url: up.publicUrl };
    const { error } = await client
      .from('profiles')
      .update({ ...patch, updated_by: user.id })
      .eq('id', user.id);
    if (error) return { ok: false, message: copy.uploadError };
    await recompute();
    return { ok: true, url: up.publicUrl };
  } catch {
    return { ok: false, message: copy.uploadError };
  }
}

export async function exportMyIdentity(): Promise<
  { ok: true; data: unknown } | { ok: false; message: string }
> {
  const copy = getIdentidadeCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('export_my_identity_data');
    if (error || !data) return { ok: false, message: copy.exportError };
    return { ok: true, data };
  } catch {
    return { ok: false, message: copy.exportError };
  }
}

export async function getPartySnapshot(
  userId: string,
): Promise<{ ok: true; data: IdentityPartySnapshot } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('get_identity_party_snapshot', {
      p_user_id: userId,
    });
    if (error || !data) return { ok: false, message: copy.loadError };
    return { ok: true, data: data as IdentityPartySnapshot };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function getMyPartySnapshot(): Promise<
  { ok: true; data: IdentityPartySnapshot } | { ok: false; message: string }
> {
  const copy = getIdentidadeCopy();
  try {
    const client = createBrowserClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { ok: false, message: copy.forbidden };
    return getPartySnapshot(user.id);
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function getMyKycLevel(): Promise<
  { ok: true; level: number; trustIndex: number } | { ok: false; message: string }
> {
  const result = await loadMyIdentity();
  if (!result.ok) return result;
  return {
    ok: true,
    level: result.data.profile.kyc_level ?? 0,
    trustIndex: Number(result.data.profile.trust_index ?? 0),
  };
}

export async function listMyIdentityChanges(
  limit = 50,
): Promise<{ ok: true; data: IdentityFieldChangeRow[] } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('list_my_identity_changes', {
      p_limit: limit,
    });
    if (error) return { ok: false, message: mapIdentityError(error.message, copy.loadError) };
    const rows = Array.isArray(data) ? (data as IdentityFieldChangeRow[]) : [];
    return { ok: true, data: rows };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function listMyIdentityAccessLogs(
  limit = 50,
): Promise<{ ok: true; data: IdentityAccessLogRow[] } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  try {
    const client = createBrowserClient();
    const { data, error } = await client.rpc('list_my_identity_access_logs', {
      p_limit: limit,
    });
    if (error) return { ok: false, message: mapIdentityError(error.message, copy.loadError) };
    const rows = Array.isArray(data) ? (data as IdentityAccessLogRow[]) : [];
    return { ok: true, data: rows };
  } catch {
    return { ok: false, message: copy.loadError };
  }
}

export async function logDocumentView(
  documentId: string,
  side: 'front' | 'back' | 'meta' = 'meta',
): Promise<{ ok: true } | { ok: false; message: string }> {
  const copy = getIdentidadeCopy();
  try {
    const client = createBrowserClient();
    const { error } = await client.rpc('log_identity_document_view', {
      p_document_id: documentId,
      p_side: side,
    });
    if (error) return { ok: false, message: mapIdentityError(error.message, copy.saveError) };
    return { ok: true };
  } catch {
    return { ok: false, message: copy.saveError };
  }
}
