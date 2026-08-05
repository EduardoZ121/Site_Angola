'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ID_DOC_KINDS, MARITAL_STATUS_CODES, SEX_CODES } from '@kuteka/validation';
import { Badge, Button, Heading, Input, Label, Text, buttonVariants } from '@kuteka/ui';
import { cn } from '@kuteka/shared';
import { useAppSession } from '@/modules/authentication/components/app-session';
import { SessionStatusGate } from '@/modules/shell/components/SessionStatusGate';
import { SoftListSlot } from '@/modules/shell/components/SoftListSlot';
import { getIdentidadeCopy } from '../content/pt';
import {
  KIS_STEPS,
  KYC_LEVEL_LABELS,
  computeGradualKisProgress,
  formatCompleteness,
  kisProgressFlagsFromBundle,
  statusGlyph,
  statusLabel,
  statusTone,
  suggestNextKisStep,
  type KisStepId,
  type KycLevel,
  type TrustPillar,
  type TrustPillarStatus,
} from '../lib/kyc';
import {
  exportMyIdentity,
  listMyIdentityAccessLogs,
  listMyIdentityChanges,
  loadMyIdentity,
  saveAddress,
  saveBanking,
  saveContacts,
  savePersonalIdentity,
  submitIdDocument,
  uploadAvatarOrSelfie,
  type IdentityAccessLogRow,
  type IdentityBundle,
  type IdentityFieldChangeRow,
} from '../services/identity-client';

function PillarRow({ pillar }: { pillar: TrustPillar }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-white/10 py-2.5 last:border-0">
      <span className="text-sm text-slate-200">
        {statusGlyph(pillar.status)} {pillar.label}
      </span>
      <Badge variant={statusTone(pillar.status)}>{statusLabel(pillar.status)}</Badge>
    </li>
  );
}

function stepDone(step: KisStepId, bundle: IdentityBundle | null): boolean {
  if (!bundle) return false;
  const p = bundle.profile;
  switch (step) {
    case 'overview':
      return true;
    case 'contacts':
      return Boolean(bundle.emailConfirmed && p.phone_verified_at);
    case 'personal':
      return Boolean(p.legal_full_name?.trim());
    case 'document':
      return Boolean(bundle.document && bundle.document.status !== 'rejected');
    case 'photo':
      return (
        Boolean(p.avatar_url) ||
        p.kyc_photo_status === 'verified' ||
        p.kyc_photo_status === 'pending'
      );
    case 'address':
      return Boolean(bundle.address?.province && bundle.address?.municipality);
    case 'banking':
      return Boolean(
        bundle.banking?.bank_name || bundle.banking?.iban || bundle.banking?.account_number,
      );
    case 'privacy':
      return true;
    default:
      return false;
  }
}

function nextAfter(step: KisStepId): KisStepId {
  const idx = KIS_STEPS.findIndex((s) => s.id === step);
  if (idx < 0 || idx >= KIS_STEPS.length - 1) return 'overview';
  return KIS_STEPS[idx + 1]!.id;
}

export function ProfileIdentityClient() {
  const copy = getIdentidadeCopy();
  const searchParams = useSearchParams();
  const { session, status: sessionStatus, error: sessionError } = useAppSession();
  const [bundle, setBundle] = useState<IdentityBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [step, setStep] = useState<KisStepId>('overview');
  const [landed, setLanded] = useState(false);

  // Personal
  const [legalFullName, setLegalFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');
  const [sex, setSex] = useState<(typeof SEX_CODES)[number] | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [nationality, setNationality] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<(typeof MARITAL_STATUS_CODES)[number] | ''>(
    '',
  );

  // Contacts
  const [phonePrimary, setPhonePrimary] = useState('');
  const [phoneSecondary, setPhoneSecondary] = useState('');
  const [emailSecondary, setEmailSecondary] = useState('');
  const [markPhone, setMarkPhone] = useState(false);

  // Address
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [commune, setCommune] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [gpsLat, setGpsLat] = useState('');
  const [gpsLng, setGpsLng] = useState('');

  // Document
  const [docKind, setDocKind] = useState<(typeof ID_DOC_KINDS)[number]>('bi');
  const [docNumber, setDocNumber] = useState('');
  const [issuedOn, setIssuedOn] = useState('');
  const [expiresOn, setExpiresOn] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [issuingCountry, setIssuingCountry] = useState('AO');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);

  // Banking
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [wallets, setWallets] = useState('');

  // Privacy
  const [changes, setChanges] = useState<IdentityFieldChangeRow[]>([]);
  const [accessLogs, setAccessLogs] = useState<IdentityAccessLogRow[]>([]);
  const [privacyLoaded, setPrivacyLoaded] = useState(false);

  const hydrate = useCallback((data: IdentityBundle) => {
    setBundle(data);
    const p = data.profile;
    setLegalFullName(p.legal_full_name ?? '');
    setPreferredName(p.preferred_name ?? p.display_name ?? '');
    setSex((p.sex as (typeof SEX_CODES)[number]) || '');
    setBirthDate(p.birth_date ?? '');
    setNationality(p.nationality ?? '');
    setPlaceOfBirth(p.place_of_birth ?? '');
    setMaritalStatus((p.marital_status as (typeof MARITAL_STATUS_CODES)[number]) || '');
    setPhonePrimary(p.phone_primary ?? '');
    setPhoneSecondary(p.phone_secondary ?? '');
    setEmailSecondary(p.email_secondary ?? '');
    if (data.address) {
      setProvince(data.address.province ?? '');
      setMunicipality(data.address.municipality ?? '');
      setCommune(data.address.commune ?? '');
      setNeighborhood(data.address.neighborhood ?? '');
      setStreet(data.address.street ?? '');
      setNumber(data.address.number ?? '');
      setPostalCode(data.address.postal_code ?? '');
      setGpsLat(data.address.gps_lat != null ? String(data.address.gps_lat) : '');
      setGpsLng(data.address.gps_lng != null ? String(data.address.gps_lng) : '');
    }
    if (data.document) {
      setDocKind((data.document.doc_kind as (typeof ID_DOC_KINDS)[number]) || 'bi');
      setDocNumber(data.document.doc_number ?? '');
      setIssuedOn(data.document.issued_on ?? '');
      setExpiresOn(data.document.expires_on ?? '');
      setIssuedAt(data.document.issued_at ?? '');
      setIssuingCountry(data.document.issuing_country || 'AO');
    }
    if (data.banking) {
      setBankName(data.banking.bank_name ?? '');
      setIban(data.banking.iban ?? '');
      setAccountNumber(data.banking.account_number ?? '');
      setAccountHolder(data.banking.account_holder_name ?? '');
      setWallets((data.banking.digital_wallets ?? []).join(', '));
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await loadMyIdentity();
    if (!result.ok) {
      setError(result.message);
      setBundle(null);
    } else {
      setError(null);
      hydrate(result.data);
    }
    setLoading(false);
    return result;
  }, [hydrate]);

  useEffect(() => {
    if (sessionStatus === 'ready') void load();
    if (sessionStatus === 'error') setLoading(false);
  }, [load, sessionStatus]);

  useEffect(() => {
    if (landed || !bundle) return;
    setLanded(true);
    const passo = searchParams.get('passo');
    if (passo && KIS_STEPS.some((s) => s.id === passo)) {
      setStep(passo as KisStepId);
      return;
    }
    const completeness = computeGradualKisProgress(kisProgressFlagsFromBundle(bundle));
    if (completeness < 100) {
      setStep('overview');
    }
  }, [bundle, landed, searchParams]);

  useEffect(() => {
    if (step !== 'privacy' || privacyLoaded) return;
    let cancelled = false;
    async function fetchPrivacy() {
      const [c, a] = await Promise.all([listMyIdentityChanges(30), listMyIdentityAccessLogs(30)]);
      if (cancelled) return;
      if (c.ok) setChanges(c.data);
      if (a.ok) setAccessLogs(a.data);
      setPrivacyLoaded(true);
    }
    void fetchPrivacy();
    return () => {
      cancelled = true;
    };
  }, [privacyLoaded, step]);

  const pillars: TrustPillar[] = useMemo(() => {
    const p = bundle?.profile;
    const emailStatus: TrustPillarStatus = bundle?.emailConfirmed ? 'verified' : 'pending';
    const phoneStatus: TrustPillarStatus = p?.phone_verified_at
      ? 'verified'
      : p?.phone_primary
        ? 'pending'
        : 'missing';
    const photoStatus: TrustPillarStatus =
      p?.kyc_photo_status ?? (p?.avatar_url ? 'pending' : 'missing');
    return [
      { id: 'identity', label: copy.pillars.identity, status: p?.kyc_identity_status ?? 'missing' },
      { id: 'email', label: copy.pillars.email, status: emailStatus },
      { id: 'phone', label: copy.pillars.phone, status: phoneStatus },
      { id: 'document', label: copy.pillars.document, status: p?.kyc_document_status ?? 'missing' },
      { id: 'photo', label: copy.pillars.photo, status: photoStatus },
      { id: 'address', label: copy.pillars.address, status: p?.kyc_address_status ?? 'missing' },
      { id: 'banking', label: copy.pillars.banking, status: p?.kyc_banking_status ?? 'missing' },
    ];
  }, [bundle, copy.pillars]);

  const suggestedStep = useMemo(() => {
    if (!bundle) return 'contacts' as KisStepId;
    return suggestNextKisStep({
      emailConfirmed: bundle.emailConfirmed,
      phoneVerified: Boolean(bundle.profile.phone_verified_at),
      hasPersonal: Boolean(bundle.profile.legal_full_name?.trim()),
      hasDocument: Boolean(bundle.document && bundle.document.status !== 'rejected'),
      hasPhoto:
        Boolean(bundle.profile.avatar_url) ||
        bundle.profile.kyc_photo_status === 'verified' ||
        bundle.profile.kyc_photo_status === 'pending',
      hasAddress: Boolean(bundle.address?.province && bundle.address?.municipality),
      hasBanking: Boolean(
        bundle.banking?.bank_name || bundle.banking?.iban || bundle.banking?.account_number,
      ),
    });
  }, [bundle]);

  async function afterSave(advanceTo?: KisStepId) {
    setMessage(copy.saveOk);
    await load();
    if (advanceTo) setStep(advanceTo);
  }

  async function onPersonal(e: FormEvent) {
    e.preventDefault();
    setBusy('personal');
    setMessage(null);
    setError(null);
    const result = await savePersonalIdentity({
      legalFullName,
      preferredName: preferredName || null,
      sex: sex || null,
      birthDate: birthDate || null,
      nationality: nationality || null,
      placeOfBirth: placeOfBirth || null,
      maritalStatus: maritalStatus || null,
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await afterSave(nextAfter('personal'));
  }

  async function onContacts(e: FormEvent) {
    e.preventDefault();
    setBusy('contacts');
    setMessage(null);
    setError(null);
    const result = await saveContacts({
      phonePrimary: phonePrimary || null,
      phoneSecondary: phoneSecondary || null,
      emailSecondary: emailSecondary || null,
      markPhoneVerified: markPhone,
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMarkPhone(false);
    await afterSave(nextAfter('contacts'));
  }

  async function onAddress(e: FormEvent, submitForReview: boolean) {
    e.preventDefault();
    setBusy('address');
    setMessage(null);
    setError(null);
    const lat = gpsLat.trim() ? Number(gpsLat) : null;
    const lng = gpsLng.trim() ? Number(gpsLng) : null;
    const result = await saveAddress({
      country: 'AO',
      province,
      municipality,
      commune: commune || null,
      neighborhood: neighborhood || null,
      street: street || null,
      number: number || null,
      postalCode: postalCode || null,
      gpsLat: lat != null && Number.isFinite(lat) ? lat : null,
      gpsLng: lng != null && Number.isFinite(lng) ? lng : null,
      submitForReview,
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await afterSave(nextAfter('address'));
  }

  async function onDocument(e: FormEvent) {
    e.preventDefault();
    if (!frontFile || !backFile) {
      setError('Carregue a frente e o verso do documento.');
      return;
    }
    setBusy('document');
    setMessage(null);
    setError(null);
    const result = await submitIdDocument({
      meta: {
        docKind,
        docNumber,
        issuedOn: issuedOn || null,
        expiresOn: expiresOn || null,
        issuedAt: issuedAt || null,
        issuingCountry: issuingCountry || 'AO',
      },
      front: frontFile,
      back: backFile,
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setFrontFile(null);
    setBackFile(null);
    await afterSave(nextAfter('document'));
  }

  async function onBanking(e: FormEvent, submitForReview: boolean) {
    e.preventDefault();
    setBusy('banking');
    setMessage(null);
    setError(null);
    const result = await saveBanking({
      bankName: bankName || null,
      iban: iban || null,
      accountNumber: accountNumber || null,
      accountHolderName: accountHolder || null,
      digitalWallets: wallets
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean),
      submitForReview,
    });
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    await afterSave(nextAfter('banking'));
  }

  async function onPhoto(kind: 'avatar' | 'selfie', file: File | null) {
    if (!file) return;
    setBusy(kind);
    setMessage(null);
    setError(null);
    const result = await uploadAvatarOrSelfie(kind, file);
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(copy.saveOk);
    await load();
    if (kind === 'avatar') setStep(nextAfter('photo'));
  }

  async function onExport() {
    setBusy('export');
    setError(null);
    const result = await exportMyIdentity();
    setBusy(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kuteka-kis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(copy.exportOk);
  }

  const level = (bundle?.profile.kyc_level ?? 0) as KycLevel;
  const trustIndex = Number(bundle?.profile.trust_index ?? 0);
  const completeness = bundle ? computeGradualKisProgress(kisProgressFlagsFromBundle(bundle)) : 0;
  const completenessLabel = copy.progress.replace('{n}', String(Math.round(completeness)));
  const docStatus = bundle?.document?.status;
  const docBadge =
    docStatus === 'accepted'
      ? copy.document.verified
      : docStatus === 'rejected'
        ? copy.document.rejected
        : docStatus
          ? copy.document.pending
          : null;

  const selectClass =
    'rounded-kuteka border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900';

  return (
    <SessionStatusGate status={sessionStatus} error={sessionError}>
      <div className="flex flex-col gap-5">
        <header className="kuteka-detail-panel p-5">
          <p className="kuteka-detail-eyebrow">{copy.eyebrow}</p>
          <Heading level={1}>{copy.title}</Heading>
          <Text className="mt-1 text-slate-700">{copy.subtitle}</Text>
          {session?.email ? <p className="kuteka-detail-meta mt-2">{session.email}</p> : null}

          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[12rem] flex-1">
              <p className="text-xs uppercase tracking-wide text-slate-500">{copy.completeness}</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{completenessLabel}</p>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuenow={Math.round(completeness)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-slate-800 transition-[width] duration-500"
                  style={{ width: formatCompleteness(completeness) }}
                />
              </div>
            </div>
            <Badge variant={level >= 2 ? 'success' : 'warning'}>{KYC_LEVEL_LABELS[level]}</Badge>
          </div>
        </header>

        {error ? (
          <p
            role="alert"
            className="rounded-kuteka border border-rose-300/40 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-kuteka border border-emerald-300/40 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {message}
          </p>
        ) : null}

        <SoftListSlot pending={loading && !bundle}>
          <nav className="kuteka-detail-panel overflow-x-auto p-3" aria-label="Passos do KIS">
            <ol className="flex min-w-max gap-1 sm:flex-wrap sm:min-w-0">
              {KIS_STEPS.map((item) => {
                const done = stepDone(item.id, bundle);
                const active = step === item.id;
                const label = copy.steps[item.id];
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setMessage(null);
                        setError(null);
                        setStep(item.id);
                      }}
                      className={cn(
                        'flex items-center gap-1.5 rounded-kuteka px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-transparent text-slate-700 hover:bg-slate-100',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold',
                          done
                            ? 'bg-emerald-600 text-white'
                            : active
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-200 text-slate-600',
                        )}
                        aria-hidden
                      >
                        {done ? '✓' : KIS_STEPS.findIndex((s) => s.id === item.id) + 1}
                      </span>
                      {label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {step === 'overview' ? (
            <section className="kuteka-detail-panel p-5" aria-labelledby="kis-overview">
              <h2 id="kis-overview" className="kuteka-detail-title">
                {copy.sections.overview}
              </h2>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">{copy.kycLevel}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {KYC_LEVEL_LABELS[level]}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {copy.trustIndex}
                  </p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
                    {trustIndex.toFixed(0)}
                    <span className="text-base font-normal text-slate-500">/100</span>
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700">{completenessLabel}</p>
              <ul className="mt-4 rounded-kuteka bg-slate-950/90 px-4 py-2">
                {pillars.map((pillar) => (
                  <PillarRow key={pillar.id} pillar={pillar} />
                ))}
              </ul>
              {suggestedStep !== 'overview' ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-sm text-slate-600">{copy.nextStepHint}</p>
                  <Button type="button" onClick={() => setStep(suggestedStep)}>
                    {copy.continue}
                  </Button>
                  <Link
                    href="/app/centro-confianca"
                    className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                  >
                    Centro de Confiança
                  </Link>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <p className="text-sm text-emerald-800">{completenessLabel}</p>
                  <Link
                    href="/app/centro-confianca"
                    className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
                  >
                    Centro de Confiança
                  </Link>
                </div>
              )}
              {level < 2 ? (
                <p className="mt-3 text-sm text-amber-800">
                  {copy.kycGateBody}{' '}
                  <Link href="/app/centro-confianca" className="underline">
                    Centro de Confiança
                  </Link>
                </p>
              ) : null}
            </section>
          ) : null}

          {step === 'contacts' ? (
            <section className="kuteka-detail-panel p-5" aria-labelledby="kis-contacts">
              <h2 id="kis-contacts" className="kuteka-detail-title">
                {copy.sections.contacts}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                <li>
                  <Badge variant={bundle?.emailConfirmed ? 'success' : 'warning'}>
                    {bundle?.emailConfirmed ? '✔ ' : '⏳ '}
                    {bundle?.emailConfirmed
                      ? copy.contacts.emailConfirmed
                      : copy.contacts.emailPending}
                  </Badge>
                </li>
                <li>
                  <Badge variant={bundle?.profile.phone_verified_at ? 'success' : 'warning'}>
                    {bundle?.profile.phone_verified_at ? '✔ ' : '⏳ '}
                    {bundle?.profile.phone_verified_at
                      ? copy.contacts.phoneConfirmed
                      : copy.contacts.phonePending}
                  </Badge>
                </li>
              </ul>
              <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onContacts}>
                <div>
                  <Label>{copy.contacts.emailPrimary}</Label>
                  <Input value={bundle?.email ?? ''} disabled readOnly />
                </div>
                <div>
                  <Label htmlFor="emailSecondary">{copy.contacts.emailSecondary}</Label>
                  <Input
                    id="emailSecondary"
                    type="email"
                    value={emailSecondary}
                    onChange={(e) => setEmailSecondary(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phonePrimary">{copy.contacts.phonePrimary}</Label>
                  <Input
                    id="phonePrimary"
                    value={phonePrimary}
                    onChange={(e) => setPhonePrimary(e.target.value)}
                    placeholder="+244..."
                  />
                </div>
                <div>
                  <Label htmlFor="phoneSecondary">{copy.contacts.phoneSecondary}</Label>
                  <Input
                    id="phoneSecondary"
                    value={phoneSecondary}
                    onChange={(e) => setPhoneSecondary(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={markPhone}
                    onChange={(e) => setMarkPhone(e.target.checked)}
                  />
                  {copy.contacts.markPhone}
                </label>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={busy === 'contacts'}>
                    {copy.saveAndContinue}
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          {step === 'personal' ? (
            <section className="kuteka-detail-panel p-5" aria-labelledby="kis-personal">
              <h2 id="kis-personal" className="kuteka-detail-title">
                {copy.sections.personal}
              </h2>
              <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onPersonal}>
                <div className="sm:col-span-2">
                  <Label htmlFor="legalFullName">{copy.personal.legalFullName}</Label>
                  <Input
                    id="legalFullName"
                    value={legalFullName}
                    onChange={(e) => setLegalFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preferredName">{copy.personal.preferredName}</Label>
                  <Input
                    id="preferredName"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="sex">{copy.personal.sex}</Label>
                  <select
                    id="sex"
                    className={selectClass}
                    value={sex}
                    onChange={(e) => setSex(e.target.value as typeof sex)}
                  >
                    <option value="">—</option>
                    {SEX_CODES.map((code) => (
                      <option key={code} value={code}>
                        {copy.sex[code]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="birthDate">{copy.personal.birthDate}</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="nationality">{copy.personal.nationality}</Label>
                  <Input
                    id="nationality"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="placeOfBirth">{copy.personal.placeOfBirth}</Label>
                  <Input
                    id="placeOfBirth"
                    value={placeOfBirth}
                    onChange={(e) => setPlaceOfBirth(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="maritalStatus">{copy.personal.maritalStatus}</Label>
                  <select
                    id="maritalStatus"
                    className={selectClass}
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as typeof maritalStatus)}
                  >
                    <option value="">—</option>
                    {MARITAL_STATUS_CODES.map((code) => (
                      <option key={code} value={code}>
                        {copy.marital[code]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={busy === 'personal'}>
                    {copy.saveAndContinue}
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          {step === 'document' ? (
            <section className="kuteka-detail-panel p-5" aria-labelledby="kis-doc">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="kis-doc" className="kuteka-detail-title">
                  {copy.sections.document}
                </h2>
                {docBadge ? (
                  <Badge
                    variant={
                      docStatus === 'accepted'
                        ? 'success'
                        : docStatus === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {docStatus === 'accepted' ? '✔ ' : '⏳ '}
                    {docBadge}
                  </Badge>
                ) : null}
              </div>
              {docStatus === 'rejected' && bundle?.document?.rejection_reason ? (
                <p className="mt-2 rounded-kuteka border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
                  <span className="font-medium">{copy.document.rejectionReason}: </span>
                  {bundle.document.rejection_reason}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">{copy.document.ocrNote}</p>
              <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onDocument}>
                <div>
                  <Label htmlFor="docKind">{copy.document.kind}</Label>
                  <select
                    id="docKind"
                    className={selectClass}
                    value={docKind}
                    onChange={(e) => setDocKind(e.target.value as typeof docKind)}
                  >
                    {ID_DOC_KINDS.map((code) => (
                      <option key={code} value={code}>
                        {copy.document.kinds[code]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="docNumber">{copy.document.number}</Label>
                  <Input
                    id="docNumber"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="issuedOn">{copy.document.issuedOn}</Label>
                  <Input
                    id="issuedOn"
                    type="date"
                    value={issuedOn}
                    onChange={(e) => setIssuedOn(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="expiresOn">{copy.document.expiresOn}</Label>
                  <Input
                    id="expiresOn"
                    type="date"
                    value={expiresOn}
                    onChange={(e) => setExpiresOn(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="issuedAt">{copy.document.issuedAt}</Label>
                  <Input
                    id="issuedAt"
                    value={issuedAt}
                    onChange={(e) => setIssuedAt(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="issuingCountry">{copy.document.country}</Label>
                  <Input
                    id="issuingCountry"
                    value={issuingCountry}
                    onChange={(e) => setIssuingCountry(e.target.value)}
                    placeholder="AO"
                  />
                </div>
                <div>
                  <Label htmlFor="front">{copy.document.front}</Label>
                  <Input
                    id="front"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div>
                  <Label htmlFor="back">{copy.document.back}</Label>
                  <Input
                    id="back"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" loading={busy === 'document'}>
                    {copy.saveAndContinue}
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          {step === 'photo' ? (
            <section className="kuteka-detail-panel p-5" aria-labelledby="kis-photo">
              <h2 id="kis-photo" className="kuteka-detail-title">
                {copy.sections.photo}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{copy.photo.required}</p>
              <p className="mt-1 text-xs text-slate-500">{copy.photo.livenessNote}</p>
              <div className="mt-4 flex flex-wrap items-start gap-6">
                <div className="flex flex-col gap-2">
                  {bundle?.profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bundle.profile.avatar_url}
                      alt=""
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                      —
                    </div>
                  )}
                  <Label htmlFor="avatar">{copy.photo.uploadAvatar}</Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => void onPhoto('avatar', e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  {bundle?.profile.selfie_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bundle.profile.selfie_url}
                      alt=""
                      className="h-24 w-24 rounded-kuteka object-cover"
                    />
                  ) : null}
                  <Label htmlFor="selfie">{copy.photo.uploadSelfie}</Label>
                  <Input
                    id="selfie"
                    type="file"
                    accept="image/*"
                    onChange={(e) => void onPhoto('selfie', e.target.files?.[0] ?? null)}
                  />
                  <p className="text-xs text-slate-500">{copy.photo.selfie}</p>
                </div>
              </div>
              {busy === 'avatar' || busy === 'selfie' ? (
                <p className="mt-2 text-sm text-slate-600">A carregar…</p>
              ) : null}
              {bundle?.profile.avatar_url ? (
                <div className="mt-4">
                  <Button type="button" onClick={() => setStep(nextAfter('photo'))}>
                    {copy.continue}
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {step === 'address' ? (
            <section className="kuteka-detail-panel p-5" aria-labelledby="kis-address">
              <h2 id="kis-address" className="kuteka-detail-title">
                {copy.sections.address}
              </h2>
              <form className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="province">{copy.address.province}</Label>
                  <Input
                    id="province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="municipality">{copy.address.municipality}</Label>
                  <Input
                    id="municipality"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="commune">{copy.address.commune}</Label>
                  <Input
                    id="commune"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">{copy.address.neighborhood}</Label>
                  <Input
                    id="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="street">{copy.address.street}</Label>
                  <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="number">{copy.address.number}</Label>
                  <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="postalCode">{copy.address.postalCode}</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                    {copy.address.gps}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="gpsLat">{copy.address.gpsLat}</Label>
                      <Input
                        id="gpsLat"
                        inputMode="decimal"
                        value={gpsLat}
                        onChange={(e) => setGpsLat(e.target.value)}
                        placeholder="-8.8383"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gpsLng">{copy.address.gpsLng}</Label>
                      <Input
                        id="gpsLng"
                        inputMode="decimal"
                        value={gpsLng}
                        onChange={(e) => setGpsLng(e.target.value)}
                        placeholder="13.2344"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button
                    type="button"
                    loading={busy === 'address'}
                    onClick={(e) => void onAddress(e as unknown as FormEvent, false)}
                  >
                    {copy.saveAndContinue}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busy === 'address'}
                    onClick={(e) => void onAddress(e as unknown as FormEvent, true)}
                  >
                    {copy.address.submit}
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          {step === 'banking' ? (
            <section className="kuteka-detail-panel p-5" aria-labelledby="kis-bank">
              <h2 id="kis-bank" className="kuteka-detail-title">
                {copy.sections.banking}
              </h2>
              <p className="kuteka-detail-body mt-1">{copy.banking.hint}</p>
              <form className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="bankName">{copy.banking.bank}</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="iban">{copy.banking.iban}</Label>
                  <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="accountNumber">{copy.banking.account}</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolder">{copy.banking.holder}</Label>
                  <Input
                    id="accountHolder"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="wallets">{copy.banking.wallets}</Label>
                  <Input
                    id="wallets"
                    value={wallets}
                    onChange={(e) => setWallets(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button
                    type="button"
                    loading={busy === 'banking'}
                    onClick={(e) => void onBanking(e as unknown as FormEvent, false)}
                  >
                    {copy.saveAndContinue}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={busy === 'banking'}
                    onClick={(e) => void onBanking(e as unknown as FormEvent, true)}
                  >
                    {copy.banking.submit}
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          {step === 'privacy' ? (
            <section className="kuteka-detail-panel p-5" aria-labelledby="kis-privacy">
              <h2 id="kis-privacy" className="kuteka-detail-title">
                {copy.sections.privacy}
              </h2>
              <p className="kuteka-detail-body mt-1">{copy.privacy.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  loading={busy === 'export'}
                  onClick={() => void onExport()}
                >
                  {copy.privacy.export}
                </Button>
                <Link href="/app/confianca" className={cn(buttonVariants({ variant: 'ghost' }))}>
                  {copy.privacy.confianca}
                </Link>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900">{copy.privacy.history}</h3>
                {!privacyLoaded ? (
                  <p className="mt-2 text-sm text-slate-500">A carregar…</p>
                ) : changes.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">{copy.privacy.historyEmpty}</p>
                ) : (
                  <ul className="mt-2 divide-y divide-slate-200 rounded-kuteka border border-slate-200">
                    {changes.map((row) => (
                      <li key={row.id} className="px-3 py-2 text-sm">
                        <p className="font-medium text-slate-800">{row.field_name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(row.created_at).toLocaleString('pt-AO')}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {(row.old_value ?? '—').slice(0, 40)} →{' '}
                          {(row.new_value ?? '—').slice(0, 40)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-900">{copy.privacy.accessLogs}</h3>
                {!privacyLoaded ? (
                  <p className="mt-2 text-sm text-slate-500">A carregar…</p>
                ) : accessLogs.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">{copy.privacy.accessLogsEmpty}</p>
                ) : (
                  <ul className="mt-2 divide-y divide-slate-200 rounded-kuteka border border-slate-200">
                    {accessLogs.map((row) => (
                      <li key={row.id} className="px-3 py-2 text-sm">
                        <p className="font-medium text-slate-800">{row.action}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(row.created_at).toLocaleString('pt-AO')} · {row.entity_type}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ) : null}
        </SoftListSlot>
      </div>
    </SessionStatusGate>
  );
}
